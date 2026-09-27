import assert from "node:assert/strict";
import { mkdtemp, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { createPoller } from "../src/poller.js";
import { JsonStateStore } from "../src/state-store.js";

test("poller queues comments only for explicitly enabled media", async () => {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ig-poller-test-"));
  const policyPath = path.join(directory, "replies.json");
  await writeFile(
    policyPath,
    JSON.stringify({
      version: 1,
      settings: { ignoreRepliesToComments: true },
      posts: {
        "media-1": {
          enabled: true,
          activatedAt: "2026-01-01T00:00:00.000Z",
          fallback: "ممنون {username}",
        },
        "media-disabled": {
          enabled: false,
          fallback: "ارسال نشود",
        },
      },
    }),
    "utf8",
  );

  const store = new JsonStateStore(path.join(directory, "state.json"));
  await store.init();
  const calls = [];
  const client = {
    async listMediaComments(mediaId) {
      calls.push(mediaId);
      return {
        successful: true,
        data: {
          data: [
            {
              id: "comment-1",
              text: "سلام",
              username: "tester",
              timestamp: "2026-01-02T00:00:00.000Z",
            },
            {
              id: "comment-hidden",
              text: "spam",
              username: "spammer",
              hidden: true,
              timestamp: "2026-01-02T00:00:00.000Z",
            },
          ],
        },
      };
    },
  };
  let kicks = 0;
  const poller = createPoller({
    config: {
      replyConfigPath: policyPath,
      maxPagesPerPoll: 2,
      pollIntervalSeconds: 60,
    },
    store,
    client,
    worker: { kick() { kicks += 1; } },
    logger: { error() {} },
  });

  const result = await poller.pollOnce();
  assert.deepEqual(calls, ["media-1"]);
  assert.equal(result.queued, 1);
  assert.equal((await store.summary()).pending, 1);
  assert.equal(kicks, 1);
});
