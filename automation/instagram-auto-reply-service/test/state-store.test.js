import assert from "node:assert/strict";
import { mkdtemp, readFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { JsonStateStore } from "../src/state-store.js";

test("deduplicates queued and processed comments", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ig-reply-test-"));
  const filePath = path.join(directory, "state.json");
  const store = new JsonStateStore(filePath);
  await store.init();

  const event = { id: "comment-1", commentId: "comment-1", mediaId: "media-1" };
  assert.equal(await store.enqueue([event, event]), 1);
  assert.equal((await store.summary()).pending, 1);
  await store.complete(event.id, { status: "dry_run" });
  assert.equal(await store.enqueue([event]), 0);

  const saved = JSON.parse(await readFile(filePath, "utf8"));
  assert.equal(saved.processed["comment-1"].status, "dry_run");
});

test("quarantines an interrupted delivery instead of retrying it", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ig-reply-recovery-test-"));
  const filePath = path.join(directory, "state.json");
  const firstStore = new JsonStateStore(filePath);
  await firstStore.init();

  const event = { id: "comment-2", commentId: "comment-2", mediaId: "media-1" };
  await firstStore.enqueue([event]);
  await firstStore.beginDelivery(event.id);

  const recoveredStore = new JsonStateStore(filePath);
  await recoveredStore.init();
  assert.equal(await recoveredStore.nextReady(), null);
  assert.deepEqual(await recoveredStore.summary(), {
    pending: 0,
    processed: 0,
    deadLetter: 1,
  });

  const saved = JSON.parse(await readFile(filePath, "utf8"));
  assert.equal(saved.deadLetter[0].status, "delivery_unknown");
});
