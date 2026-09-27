import { readFile } from "node:fs/promises";

function countMatches(value, pattern) {
  return (value.match(pattern) ?? []).length;
}

export function validateReply(reply) {
  if (typeof reply !== "string" || !reply.trim()) {
    throw new Error("Reply must be a non-empty string");
  }
  const trimmed = reply.trim();
  if (trimmed.length > 300) throw new Error("Reply must be 300 characters or fewer");
  if (countMatches(trimmed, /(^|\s)#[\p{L}\p{N}_]+/gu) > 4) {
    throw new Error("Reply may contain at most 4 hashtags");
  }
  if (countMatches(trimmed, /https?:\/\/\S+/giu) > 1) {
    throw new Error("Reply may contain at most 1 URL");
  }
  const letters = trimmed.match(/\p{L}/gu) ?? [];
  if (letters.length > 4 && trimmed === trimmed.toUpperCase() && trimmed !== trimmed.toLowerCase()) {
    throw new Error("Reply must not be written entirely in uppercase");
  }
  return trimmed;
}

export function validatePolicy(policy) {
  if (!policy || typeof policy !== "object" || Array.isArray(policy)) {
    throw new Error("Reply policy must be a JSON object");
  }
  if (policy.version !== 1) throw new Error("Reply policy version must be 1");
  if (!policy.posts || typeof policy.posts !== "object" || Array.isArray(policy.posts)) {
    throw new Error("Reply policy must contain a posts object");
  }
  for (const [mediaId, post] of Object.entries(policy.posts)) {
    if (!mediaId.trim()) throw new Error("Post media IDs must not be empty");
    if (!post || typeof post !== "object" || Array.isArray(post)) {
      throw new Error(`Policy for media ${mediaId} must be an object`);
    }
    if (post.enabled === true) {
      const activatedAt = Date.parse(post.activatedAt ?? "");
      if (!Number.isFinite(activatedAt)) {
        throw new Error(`Enabled media ${mediaId} needs an ISO activatedAt timestamp`);
      }
    }
    if (post.fallback != null && post.fallback !== "") validateReply(post.fallback);
    if (post.rules != null && !Array.isArray(post.rules)) {
      throw new Error(`Rules for media ${mediaId} must be an array`);
    }
    for (const [index, rule] of (post.rules ?? []).entries()) {
      if (!Array.isArray(rule?.containsAny) || rule.containsAny.length === 0) {
        throw new Error(`Rule ${index + 1} for media ${mediaId} needs containsAny`);
      }
      validateReply(rule.reply);
    }
  }
  return policy;
}

export async function loadPolicy(filePath) {
  const raw = await readFile(filePath, "utf8");
  return validatePolicy(JSON.parse(raw));
}

function render(template, event) {
  return template
    .replaceAll("{username}", event.username || "دوست عزیز")
    .replaceAll("{comment}", event.text || "")
    .replaceAll("{media_id}", event.mediaId);
}

export function chooseReply(policy, event) {
  const post = policy.posts[event.mediaId];
  if (!post || post.enabled !== true) return null;
  const activatedAt = Date.parse(post.activatedAt);
  const eventTime = toEpochMilliseconds(event.timestamp);
  if (Number.isFinite(eventTime) && eventTime <= activatedAt) return null;
  const normalizedText = String(event.text ?? "").toLocaleLowerCase("fa");

  for (const rule of post.rules ?? []) {
    const matches = rule.containsAny.some((keyword) =>
      normalizedText.includes(String(keyword).toLocaleLowerCase("fa")),
    );
    if (matches) return validateReply(render(rule.reply, event));
  }

  if (post.fallback) return validateReply(render(post.fallback, event));
  return null;
}

function toEpochMilliseconds(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value < 10_000_000_000 ? value * 1_000 : value;
  }
  const parsed = Date.parse(value ?? "");
  return Number.isFinite(parsed) ? parsed : Number.NaN;
}
