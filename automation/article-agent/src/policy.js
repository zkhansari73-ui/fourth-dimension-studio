export function passesQualityGate(gate) {
  return gate?.result === "PASS"
    && gate?.human_review_required === true
    && Array.isArray(gate.critical_failures)
    && gate.critical_failures.length === 0;
}

export function recentCandidates(items, existingUrls, { now = new Date(), maxAgeDays = 14, limit = 30 } = {}) {
  const known = new Set([...existingUrls].map(canonicalUrl));
  const cutoff = now.getTime() - maxAgeDays * 86_400_000;
  const seen = new Set();
  return items.filter((item) => {
    const url = canonicalUrl(item.url);
    const time = Date.parse(item.publishedAt);
    if (!url || known.has(url) || seen.has(url) || !Number.isFinite(time) || time < cutoff || time > now.getTime() + 86_400_000) return false;
    seen.add(url);
    return true;
  }).sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt)).slice(0, limit);
}

export function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) if (key.startsWith("utm_") || ["ref", "source", "fbclid", "gclid"].includes(key)) url.searchParams.delete(key);
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch { return String(value ?? "").trim(); }
}
