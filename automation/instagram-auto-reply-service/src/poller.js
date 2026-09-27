import { loadPolicy } from "./policy.js";

function asId(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function toEvent(comment, mediaId) {
  if (comment.hidden === true) return null;
  const sender = comment.from ?? {};
  const commentId = asId(comment.id);
  if (!commentId) return null;
  return {
    id: commentId,
    commentId,
    mediaId,
    text: String(comment.text ?? ""),
    username: String(comment.username ?? sender.username ?? sender.name ?? "دوست عزیز"),
    senderId: asId(sender.id ?? comment.user_id),
    parentId: asId(comment.parent_id ?? comment.parent?.id),
    timestamp: comment.timestamp ?? Date.now(),
    field: "poll",
  };
}

export function createPoller({ config, store, client, worker, logger = console }) {
  let timer = null;
  let activePoll = null;
  let stopped = false;

  async function runPoll() {
    let discovered = 0;
    let queued = 0;
    try {
      const policy = await loadPolicy(config.replyConfigPath);
      const mediaIds = Object.entries(policy.posts)
        .filter(([, post]) => post?.enabled === true)
        .map(([mediaId]) => mediaId);

      for (const mediaId of mediaIds) {
        let after = "";
        for (let page = 0; page < config.maxPagesPerPoll; page += 1) {
          const result = await client.listMediaComments(mediaId, after);
          if (result?.successful === false || result?.error) {
            throw new Error(result?.error?.message ?? result?.error ?? "Comment listing failed");
          }
          const comments = Array.isArray(result?.data?.data) ? result.data.data : [];
          const events = comments.map((comment) => toEvent(comment, mediaId)).filter(Boolean);
          discovered += events.length;
          queued += await store.enqueue(events);
          const next = result?.data?.paging?.cursors?.after;
          if (!comments.length || !next || next === after) break;
          after = next;
        }
      }
      worker.kick();
      return { skipped: false, media: mediaIds.length, discovered, queued };
    } catch (error) {
      logger.error("Instagram comment poll failed", {
        message: String(error?.message ?? error),
      });
      return { skipped: false, error: String(error?.message ?? error) };
    }
  }

  function pollOnce() {
    if (stopped || activePoll) return Promise.resolve({ skipped: true });
    const run = runPoll();
    const tracked = run.finally(() => {
      if (activePoll === tracked) activePoll = null;
    });
    activePoll = tracked;
    return activePoll;
  }

  function start() {
    if (timer) return;
    stopped = false;
    timer = setInterval(() => void pollOnce(), config.pollIntervalSeconds * 1_000);
    timer.unref();
    void pollOnce();
  }

  async function stop() {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
    if (activePoll) await activePoll;
  }

  return { pollOnce, start, stop };
}
