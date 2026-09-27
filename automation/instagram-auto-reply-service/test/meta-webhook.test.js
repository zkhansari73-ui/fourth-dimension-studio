import assert from "node:assert/strict";
import { createHmac } from "node:crypto";
import test from "node:test";
import {
  extractCommentEvents,
  verifyChallenge,
  verifyMetaSignature,
} from "../src/meta-webhook.js";

test("verifies Meta SHA-256 signatures", () => {
  const secret = "test-secret";
  const body = Buffer.from('{"ok":true}');
  const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
  assert.equal(verifyMetaSignature(body, signature, secret), true);
  assert.equal(verifyMetaSignature(body, `${signature.slice(0, -1)}0`, secret), false);
});

test("extracts comment events and ignores unrelated fields", () => {
  const payload = {
    entry: [
      {
        id: "account-1",
        changes: [
          {
            field: "comments",
            value: {
              id: "comment-1",
              text: "قیمت چنده؟",
              from: { id: "person-1", username: "ali" },
              media: { id: "media-1" },
            },
          },
          {
            field: "comments",
            value: {
              id: "comment-hidden",
              text: "spam",
              hidden: true,
              from: { id: "person-2", username: "spammer" },
              media: { id: "media-1" },
            },
          },
          { field: "messages", value: { id: "message-1" } },
        ],
      },
    ],
  };
  const events = extractCommentEvents(payload);
  assert.deepEqual(events, [
    {
      id: "comment-1",
      commentId: "comment-1",
      mediaId: "media-1",
      text: "قیمت چنده؟",
      username: "ali",
      senderId: "person-1",
      parentId: "",
      timestamp: expectAnyTimestamp(events[0].timestamp),
      field: "comments",
    },
  ]);
});

function expectAnyTimestamp(value) {
  assert.ok(value);
  return value;
}

test("accepts only the configured verification token", () => {
  const params = new URLSearchParams({
    "hub.mode": "subscribe",
    "hub.verify_token": "known-token",
    "hub.challenge": "12345",
  });
  assert.equal(verifyChallenge(params, "known-token"), "12345");
  assert.equal(verifyChallenge(params, "wrong-token"), null);
});
