import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";

const INITIAL_STATE = { pending: [], processed: {}, deadLetter: [] };
const UNKNOWN_DELIVERY_MESSAGE =
  "Delivery was interrupted after it was marked as sending; it was not retried to prevent a duplicate Instagram reply";

export class JsonStateStore {
  #filePath;
  #state = structuredClone(INITIAL_STATE);
  #lock = Promise.resolve();

  constructor(filePath) {
    this.#filePath = filePath;
  }

  async init() {
    await mkdir(path.dirname(this.#filePath), { recursive: true });
    try {
      const parsed = JSON.parse(await readFile(this.#filePath, "utf8"));
      const pending = Array.isArray(parsed.pending) ? parsed.pending : [];
      const recoveredAt = new Date().toISOString();
      const interrupted = pending
        .filter((item) => item?.deliveryState === "sending")
        .map((item) => ({
          ...item,
          status: "delivery_unknown",
          lastError: UNKNOWN_DELIVERY_MESSAGE,
          failedAt: recoveredAt,
        }));
      this.#state = {
        pending: pending.filter((item) => item?.deliveryState !== "sending"),
        processed: parsed.processed && typeof parsed.processed === "object" ? parsed.processed : {},
        deadLetter: [
          ...(Array.isArray(parsed.deadLetter) ? parsed.deadLetter : []),
          ...interrupted,
        ],
      };
      if (interrupted.length > 0) await this.#persist();
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
      await this.#persist();
    }
  }

  async #persist() {
    const tempPath = `${this.#filePath}.tmp`;
    await writeFile(tempPath, `${JSON.stringify(this.#state, null, 2)}\n`, "utf8");
    await rename(tempPath, this.#filePath);
  }

  #withLock(operation) {
    const run = this.#lock.then(operation, operation);
    this.#lock = run.catch(() => {});
    return run;
  }

  enqueue(events) {
    return this.#withLock(async () => {
      const pendingIds = new Set(this.#state.pending.map((item) => item.event.id));
      let added = 0;
      for (const event of events) {
        if (this.#state.processed[event.id] || pendingIds.has(event.id)) continue;
        this.#state.pending.push({
          event,
          attempts: 0,
          deliveryState: "queued",
          nextAttemptAt: 0,
          lastError: null,
          createdAt: new Date().toISOString(),
        });
        pendingIds.add(event.id);
        added += 1;
      }
      if (added > 0) await this.#persist();
      return added;
    });
  }

  nextReady(now = Date.now()) {
    return this.#withLock(async () => {
      const item = this.#state.pending.find(
        (candidate) =>
          candidate.deliveryState !== "sending" && candidate.nextAttemptAt <= now,
      );
      return item ? structuredClone(item) : null;
    });
  }

  beginDelivery(eventId) {
    return this.#withLock(async () => {
      const item = this.#state.pending.find((candidate) => candidate.event.id === eventId);
      if (!item) throw new Error(`Pending event ${eventId} was not found`);
      item.deliveryState = "sending";
      item.deliveryStartedAt = new Date().toISOString();
      item.lastError = null;
      await this.#persist();
    });
  }

  markDeliveryUnknown(eventId, error) {
    return this.#withLock(async () => {
      const index = this.#state.pending.findIndex((item) => item.event.id === eventId);
      if (index < 0) return;
      const [item] = this.#state.pending.splice(index, 1);
      this.#state.deadLetter.push({
        ...item,
        status: "delivery_unknown",
        lastError: String(error?.message ?? error ?? UNKNOWN_DELIVERY_MESSAGE),
        failedAt: new Date().toISOString(),
      });
      await this.#persist();
    });
  }

  complete(eventId, outcome) {
    return this.#withLock(async () => {
      this.#state.pending = this.#state.pending.filter((item) => item.event.id !== eventId);
      this.#state.processed[eventId] = {
        ...outcome,
        completedAt: new Date().toISOString(),
      };
      const entries = Object.entries(this.#state.processed);
      if (entries.length > 10_000) {
        entries
          .sort(([, a], [, b]) => String(a.completedAt).localeCompare(String(b.completedAt)))
          .slice(0, entries.length - 10_000)
          .forEach(([id]) => delete this.#state.processed[id]);
      }
      await this.#persist();
    });
  }

  fail(eventId, error, maxAttempts) {
    return this.#withLock(async () => {
      const index = this.#state.pending.findIndex((item) => item.event.id === eventId);
      if (index < 0) return;
      const item = this.#state.pending[index];
      if (item.deliveryState === "sending") {
        this.#state.pending.splice(index, 1);
        this.#state.deadLetter.push({
          ...item,
          status: "delivery_unknown",
          lastError: String(error?.message ?? error ?? UNKNOWN_DELIVERY_MESSAGE),
          failedAt: new Date().toISOString(),
        });
        await this.#persist();
        return;
      }
      item.attempts += 1;
      item.lastError = String(error?.message ?? error);
      if (item.attempts >= maxAttempts) {
        this.#state.pending.splice(index, 1);
        this.#state.deadLetter.push({ ...item, failedAt: new Date().toISOString() });
      } else {
        const delayMs = Math.min(60_000, 1_000 * 2 ** (item.attempts - 1));
        item.nextAttemptAt = Date.now() + delayMs;
      }
      await this.#persist();
    });
  }

  summary() {
    return this.#withLock(async () => ({
      pending: this.#state.pending.length,
      processed: Object.keys(this.#state.processed).length,
      deadLetter: this.#state.deadLetter.length,
    }));
  }
}
