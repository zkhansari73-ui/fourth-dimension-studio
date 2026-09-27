import assert from "node:assert/strict";
import { mkdtemp, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { JsonStateStore } from "../src/state-store.js";
import { createWorker } from "../src/worker.js";

async function createFixture() {
  const directory = await mkdtemp(path.join(os.tmpdir(), "ig-worker-test-"));
  const policyPath = path.join(directory, "replies.json");
  const statePath = path.join(directory, "state.json");
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
      },
    }),
    "utf8",
  );
  const store = new JsonStateStore(statePath);
  await store.init();
  await store.enqueue([
    {
      id: "comment-1",
      commentId: "comment-1",
      mediaId: "media-1",
      text: "سلام",
      username: "tester",
      senderId: "person-1",
      parentId: "",
      timestamp: "2026-01-02T00:00:00.000Z",
    },
  ]);
  return { policyPath, statePath, store };
}

function config(policyPath) {
  return {
    dryRun: false,
    instagramAccountId: "account-1",
    replyConfigPath: policyPath,
    maxReplyAttempts: 5,
  };
}

const logger = { info() {}, error() {} };

test("does not automatically retry an ambiguous Instagram delivery failure", async () => {
  const fixture = await createFixture();
  let calls = 0;
  const worker = createWorker({
    config: config(fixture.policyPath),
    store: fixture.store,
    replier: {
      async replyToComment() {
        calls += 1;
        throw new Error("network outcome unknown");
      },
    },
    logger,
  });

  await worker.drain();
  await worker.drain();
  assert.equal(calls, 1);
  assert.deepEqual(await fixture.store.summary(), {
    pending: 0,
    processed: 0,
    deadLetter: 1,
  });
  const saved = JSON.parse(await readFile(fixture.statePath, "utf8"));
  assert.equal(saved.deadLetter[0].status, "delivery_unknown");
});

test("graceful stop waits for an in-flight reply to finish", async () => {
  const fixture = await createFixture();
  let releaseReply;
  let markStarted;
  const replyStarted = new Promise((resolve) => {
    markStarted = resolve;
  });
  const replyBlocked = new Promise((resolve) => {
    releaseReply = resolve;
  });
  const worker = createWorker({
    config: config(fixture.policyPath),
    store: fixture.store,
    replier: {
      async replyToComment() {
        markStarted();
        await replyBlocked;
      },
    },
    logger,
  });

  const draining = worker.drain();
  await replyStarted;
  let stopped = false;
  const stopping = worker.stop().then(() => {
    stopped = true;
  });
  await new Promise((resolve) => setImmediate(resolve));
  assert.equal(stopped, false);

  releaseReply();
  await Promise.all([draining, stopping]);
  assert.equal(stopped, true);
  assert.deepEqual(await fixture.store.summary(), {
    pending: 0,
    processed: 1,
    deadLetter: 0,
  });
});
