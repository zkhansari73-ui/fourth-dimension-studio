import { createHmac, timingSafeEqual } from "node:crypto";

export function verifyMetaSignature(rawBody, signatureHeader, appSecret) {
  if (!Buffer.isBuffer(rawBody) || !signatureHeader || !appSecret) return false;
  if (!signatureHeader.startsWith("sha256=")) return false;

  const suppliedHex = signatureHeader.slice("sha256=".length);
  if (!/^[a-f\d]{64}$/i.test(suppliedHex)) return false;

  const expected = Buffer.from(
    createHmac("sha256", appSecret).update(rawBody).digest("hex"),
    "hex",
  );
  const supplied = Buffer.from(suppliedHex, "hex");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

function asId(value) {
  if (typeof value === "string" && value.trim()) return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

export function extractCommentEvents(payload) {
  const events = [];
  for (const entry of Array.isArray(payload?.entry) ? payload.entry : []) {
    for (const change of Array.isArray(entry?.changes) ? entry.changes : []) {
      if (!["comments", "live_comments"].includes(change?.field)) continue;
      const value = change?.value ?? {};
      if (value.hidden === true) continue;
      const commentId = asId(value.id ?? value.comment_id);
      const mediaId = asId(value.media?.id ?? value.media_id ?? value.post_id);
      if (!commentId || !mediaId) continue;

      const sender = value.from ?? value.sender ?? {};
      events.push({
        id: commentId,
        commentId,
        mediaId,
        text: typeof value.text === "string" ? value.text : String(value.message ?? ""),
        username: String(sender.username ?? sender.name ?? "دوست عزیز"),
        senderId: asId(sender.id ?? value.sender_id),
        parentId: asId(value.parent_id ?? value.parent?.id),
        timestamp: value.timestamp ?? entry?.time ?? Date.now(),
        field: change.field,
      });
    }
  }
  return events;
}

export function verifyChallenge(searchParams, verifyToken) {
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");
  if (mode !== "subscribe" || token !== verifyToken || challenge == null) return null;
  return challenge;
}
