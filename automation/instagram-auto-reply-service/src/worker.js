import { chooseReply, loadPolicy } from "./policy.js";

export function createWorker({ config, store, replier, logger = console }) {
  let timer = null;
  let activeDrain = null;
  let stopped = false;

  async function processItem(item) {
    const { event } = item;
    if (event.hidden === true) {
      await store.complete(event.id, { status: "ignored_hidden_comment" });
      return;
    }
    if (config.instagramAccountId && event.senderId === config.instagramAccountId) {
      await store.complete(event.id, { status: "ignored_own_comment" });
      return;
    }

    const policy = await loadPolicy(config.replyConfigPath);
    if (policy.settings?.ignoreRepliesToComments !== false && event.parentId) {
      await store.complete(event.id, { status: "ignored_comment_reply" });
      return;
    }

    const reply = chooseReply(policy, event);
    if (!reply) {
      await store.complete(event.id, { status: "no_matching_rule" });
      return;
    }

    if (config.dryRun) {
      logger.info("DRY_RUN: reply not sent", {
        commentId: event.commentId,
        mediaId: event.mediaId,
        reply,
      });
      await store.complete(event.id, { status: "dry_run", reply });
      return;
    }

    await store.beginDelivery(event.id);
    try {
      await replier.replyToComment(event.commentId, reply);
    } catch (error) {
      await store.markDeliveryUnknown(event.id, error);
      logger.error("Instagram reply outcome is unknown; automatic retry disabled", {
        commentId: event.commentId,
        mediaId: event.mediaId,
        message: String(error?.message ?? error),
      });
      return;
    }

    try {
      await store.complete(event.id, { status: "replied", reply });
    } catch (error) {
      logger.error("Instagram reply sent but local completion could not be persisted", {
        commentId: event.commentId,
        mediaId: event.mediaId,
        message: String(error?.message ?? error),
      });
      return;
    }
    logger.info("Instagram comment replied", {
      commentId: event.commentId,
      mediaId: event.mediaId,
    });
  }

  async function runDrain() {
    while (!stopped) {
      const item = await store.nextReady();
      if (!item) break;
      try {
        await processItem(item);
      } catch (error) {
        logger.error("Reply processing failed", {
          commentId: item.event.commentId,
          message: String(error?.message ?? error),
        });
        await store.fail(item.event.id, error, config.maxReplyAttempts);
        break;
      }
    }
  }

  function drain() {
    if (activeDrain) return activeDrain;
    if (stopped) return Promise.resolve();

    const run = runDrain();
    const tracked = run.finally(() => {
      if (activeDrain === tracked) activeDrain = null;
    });
    activeDrain = tracked;
    return activeDrain;
  }

  function kick() {
    if (stopped) return;
    queueMicrotask(() => {
      if (!stopped) {
        void drain().catch((error) => {
          logger.error("Worker drain failed", {
            message: String(error?.message ?? error),
          });
        });
      }
    });
  }

  function start() {
    if (timer) return;
    stopped = false;
    timer = setInterval(kick, 1_000);
    timer.unref();
    kick();
  }

  async function stop() {
    stopped = true;
    if (timer) clearInterval(timer);
    timer = null;
    if (activeDrain) await activeDrain;
  }

  return { drain, kick, start, stop };
}
