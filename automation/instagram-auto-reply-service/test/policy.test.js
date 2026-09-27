import assert from "node:assert/strict";
import test from "node:test";
import { chooseReply, validatePolicy, validateReply } from "../src/policy.js";

const policy = validatePolicy({
  version: 1,
  settings: { ignoreRepliesToComments: true },
  posts: {
    "media-1": {
      enabled: true,
      activatedAt: "2026-01-01T00:00:00.000Z",
      rules: [{ containsAny: ["قیمت"], reply: "سلام {username}، لطفاً دایرکت بدهید." }],
      fallback: "ممنون {username} ✨",
    },
  },
});

test("chooses a keyword reply for the matching post", () => {
  assert.equal(
    chooseReply(policy, {
      mediaId: "media-1",
      text: "قیمت چنده؟",
      username: "سارا",
      timestamp: "2026-01-02T00:00:00.000Z",
    }),
    "سلام سارا، لطفاً دایرکت بدهید.",
  );
});

test("uses the post fallback and ignores unmapped posts", () => {
  assert.equal(
    chooseReply(policy, { mediaId: "media-1", text: "عالیه", username: "رضا", timestamp: "2026-01-02T00:00:00.000Z" }),
    "ممنون رضا ✨",
  );
  assert.equal(
    chooseReply(policy, { mediaId: "media-2", text: "عالیه", username: "رضا", timestamp: "2026-01-02T00:00:00.000Z" }),
    null,
  );
});

test("does not reply to comments older than activation", () => {
  assert.equal(
    chooseReply(policy, {
      mediaId: "media-1",
      text: "قیمت",
      username: "مینا",
      timestamp: "2025-12-31T23:59:59.000Z",
    }),
    null,
  );
});

test("rejects replies longer than Instagram's documented limit", () => {
  assert.throws(() => validateReply("x".repeat(301)), /300/);
});
