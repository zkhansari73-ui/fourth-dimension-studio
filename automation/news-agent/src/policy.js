const RELEVANT_TERMS = [
  "architecture", "architect", "interior", "design", "revit", "bim", "parametric",
  "computational", "artificial intelligence", "generative ai", "ai agent", "automation",
  "image generation", "video generation", "3d", "visualization", "autodesk",
];

export function canonicalUrl(value) {
  try {
    const url = new URL(value);
    url.hash = "";
    for (const key of [...url.searchParams.keys()]) {
      if (key.startsWith("utm_") || ["ref", "source", "fbclid", "gclid"].includes(key)) {
        url.searchParams.delete(key);
      }
    }
    // Normalize a trailing slash on the pathname without disturbing the query.
    if (url.pathname.length > 1) url.pathname = url.pathname.replace(/\/$/, "");
    return url.toString();
  } catch {
    return String(value ?? "").trim();
  }
}

export function prefilter(items, existingUrls, { now = new Date(), maxAgeDays = 7 } = {}) {
  const known = new Set([...existingUrls].map(canonicalUrl));
  const cutoff = now.getTime() - maxAgeDays * 86_400_000;
  const seen = new Set();
  const selected = [];
  const rejected = [];

  for (const item of items) {
    const url = canonicalUrl(item.url);
    const timestamp = Date.parse(item.publishedAt);
    const haystack = `${item.title} ${item.excerpt} ${item.categoryHint}`.toLowerCase();
    let reason = "";
    if (!url || known.has(url) || seen.has(url)) reason = "duplicate";
    else if (!Number.isFinite(timestamp) || timestamp < cutoff || timestamp > now.getTime() + 86_400_000) reason = "not_recent";
    else if (!RELEVANT_TERMS.some((term) => haystack.includes(term))) reason = "not_relevant";
    if (reason) rejected.push({ ...item, rejectionReason: reason });
    else {
      seen.add(url);
      selected.push({ ...item, url });
    }
  }
  return { selected, rejected };
}

export function isGeminiSelection(review, config) {
  return review?.decision === "SELECT"
    && Number(review.importance_score_1_to_10) >= config.minImportance
    && Number(review.relevance_score_1_to_10) >= config.minRelevance
    && review.primary_source_verified === true
    && review.is_recent === true;
}

