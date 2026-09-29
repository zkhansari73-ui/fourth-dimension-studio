export const DEFAULT_SOURCES = Object.freeze([
  { name: "ArchDaily", category: "Architecture", tier: 2, url: "https://www.archdaily.com/rss" },
  { name: "Dezeen", category: "Architecture", tier: 2, url: "https://www.dezeen.com/feed/" },
  { name: "Designboom", category: "Design", tier: 2, url: "https://www.designboom.com/feed/" },
  { name: "Architizer", category: "Architecture", tier: 2, url: "https://architizer.com/blog/feed/" },
  { name: "The Architect's Newspaper", category: "Architecture", tier: 2, url: "https://www.archpaper.com/feed/" },
  { name: "Autodesk AEC", category: "BIM / Revit", tier: 1, url: "https://www.autodesk.com/blogs/aec/feed/" },
  { name: "OpenAI", category: "Artificial Intelligence", tier: 1, url: "https://openai.com/news/rss.xml" },
  { name: "Google DeepMind", category: "Artificial Intelligence", tier: 1, url: "https://deepmind.google/blog/rss.xml" },
  { name: "Google AI", category: "Artificial Intelligence", tier: 1, url: "https://blog.google/technology/ai/rss/" }
]);

function asArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}

function firstText(value) {
  if (typeof value === "string") return value.trim();
  if (value && typeof value === "object") return String(value["#text"] ?? value.href ?? "").trim();
  return "";
}

export function normalizeFeed(parsed, source) {
  const rssItems = asArray(parsed?.rss?.channel?.item);
  const atomItems = asArray(parsed?.feed?.entry);
  return [...rssItems, ...atomItems].map((item) => ({
    source: source.name,
    sourceTierHint: source.tier,
    categoryHint: source.category,
    title: firstText(item.title),
    url: firstText(item.link) || firstText(item.guid),
    publishedAt: firstText(item.pubDate) || firstText(item.published) || firstText(item.updated),
    excerpt: firstText(item.description) || firstText(item.summary) || firstText(item.content),
  })).filter((item) => item.title && item.url);
}

export async function fetchSourceItems(sources = DEFAULT_SOURCES, fetchImpl = fetch) {
  const { XMLParser } = await import("fast-xml-parser");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const results = await Promise.allSettled(sources.map(async (source) => {
    const response = await fetchImpl(source.url, { headers: { "user-agent": "FourthDimensionNewsAgent/1.0" } });
    if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
    return normalizeFeed(parser.parse(await response.text()), source);
  }));

  return {
    items: results.flatMap((result) => result.status === "fulfilled" ? result.value : []),
    errors: results.flatMap((result, index) => result.status === "rejected"
      ? [{ source: sources[index].name, error: String(result.reason?.message ?? result.reason) }]
      : []),
  };
}

