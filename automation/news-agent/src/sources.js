export const DEFAULT_SOURCES = Object.freeze([
  { name: "ArchDaily", category: "Architecture", tier: 2, kind: "rss", url: "https://www.archdaily.com/rss" },
  { name: "Dezeen", category: "Architecture", tier: 2, kind: "rss", url: "https://www.dezeen.com/feed/" },
  { name: "Designboom", category: "Design", tier: 2, kind: "rss", url: "https://www.designboom.com/feed/" },
  { name: "Parametric Architecture", category: "Parametric Design / AI in Architecture", tier: 2, kind: "rss", url: "https://parametric-architecture.com/feed/" },
  { name: "Architizer", category: "Architecture", tier: 2, kind: "rss", url: "https://architizer.com/blog/feed/" },
  { name: "The Architect's Newspaper", category: "Architecture", tier: 2, kind: "rss", url: "https://www.archpaper.com/feed/" },
  { name: "Autodesk AEC", category: "BIM / Revit", tier: 1, kind: "rss", url: "https://www.autodesk.com/blogs/aec/feed/" },
  { name: "buildingSMART", category: "BIM / openBIM Standards", tier: 1, kind: "rss", url: "https://news.google.com/rss/search?q=site%3Abuildingsmart.org%20openBIM&hl=en-US&gl=US&ceid=US%3Aen" },
  { name: "OpenAI", category: "Artificial Intelligence", tier: 1, kind: "rss", url: "https://openai.com/news/rss.xml" },
  { name: "Google DeepMind", category: "Artificial Intelligence", tier: 1, kind: "rss", url: "https://deepmind.google/blog/rss.xml" },
  { name: "Google AI", category: "Artificial Intelligence", tier: 1, kind: "rss", url: "https://blog.google/technology/ai/rss/" },
  { name: "Anthropic", category: "Artificial Intelligence", tier: 1, kind: "sitemap", url: "https://www.anthropic.com/sitemap.xml", itemPattern: "/news/" },
  { name: "Domus", category: "Architecture / Design", tier: 2, kind: "sitemap", url: "https://www.domusweb.it/sitemap.xml", itemPattern: "/en/(architecture|design|news)/" },
  { name: "AEC Magazine", category: "BIM / AEC Technology", tier: 3, kind: "rss", url: "https://aecmag.com/?format=feed&id=featured&type=rss" },
  { name: "Archinect", category: "Architecture", tier: 3, kind: "sitemap", url: "https://archinect.com/sitemap.xml", itemPattern: "/news/" },
  { name: "McNeel Rhino", category: "Computational Design", tier: 1, kind: "rss", url: "https://blog.rhino3d.com/feeds/posts/default?alt=rss" },
  { name: "Graphisoft", category: "BIM", tier: 1, kind: "sitemap", url: "https://graphisoft.com/sitemap.xml", itemPattern: "/(insights|blog|news)/" },
  { name: "Chaos", category: "Visualization / Rendering", tier: 1, kind: "sitemap", url: "https://www.chaos.com/sitemap.xml", itemPattern: "/(blog|enscape/latest-version)" },
  { name: "Speckle", category: "AEC Data / BIM / Automation", tier: 1, kind: "sitemap", url: "https://speckle.systems/sitemap.xml", itemPattern: "/blog/" },
  { name: "Unreal Engine", category: "Interactive Architecture / Real-time 3D", tier: 1, kind: "rss", url: "https://news.google.com/rss/search?q=site%3Aunrealengine.com%20architecture%20visualization&hl=en-US&gl=US&ceid=US%3Aen" },
  { name: "NVIDIA", category: "Omniverse / Rendering / 3D AI", tier: 1, kind: "rss", url: "https://news.google.com/rss/search?q=site%3Ablogs.nvidia.com%20Omniverse%20rendering%203D%20AI&hl=en-US&gl=US&ceid=US%3Aen" },
  { name: "Adobe", category: "Firefly / Creative AI", tier: 1, kind: "rss", url: "https://news.google.com/rss/search?q=site%3Ablog.adobe.com%20Firefly%20creative%20AI%203D%20video&hl=en-US&gl=US&ceid=US%3Aen" },
  { name: "Runway", category: "AI Video / Creative AI", tier: 1, kind: "sitemap", url: "https://runway.com/sitemap.xml", itemPattern: "/news/" }
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

function slugTitle(url) {
  try {
    const part = new URL(url).pathname.split("/").filter(Boolean).at(-1) || "";
    return decodeURIComponent(part).replace(/[-_]+/g, " ").trim();
  } catch {
    return "";
  }
}

export function normalizeSitemap(parsed, source) {
  const pattern = source.itemPattern ? new RegExp(source.itemPattern, "i") : null;
  return asArray(parsed?.urlset?.url).map((entry) => {
    const url = firstText(entry?.loc);
    return {
      source: source.name,
      sourceTierHint: source.tier,
      categoryHint: source.category,
      title: slugTitle(url),
      url,
      publishedAt: firstText(entry?.lastmod),
      excerpt: `${source.category} update from ${source.name}`,
    };
  }).filter((item) => item.title && item.url && item.publishedAt && (!pattern || pattern.test(new URL(item.url).pathname)));
}

async function fetchXml(url, source, parser, fetchImpl, timeoutMs) {
  const response = await fetchImpl(url, {
    headers: { "user-agent": "FourthDimensionNewsAgent/1.0" },
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!response.ok) throw new Error(`${source.name}: HTTP ${response.status}`);
  return parser.parse(await response.text());
}

async function fetchSitemapItems(source, parser, fetchImpl, timeoutMs) {
  const root = await fetchXml(source.url, source, parser, fetchImpl, timeoutMs);
  const direct = normalizeSitemap(root, source);
  if (direct.length) return direct;
  const childUrls = asArray(root?.sitemapindex?.sitemap).map((entry) => firstText(entry?.loc)).filter(Boolean).slice(0, 8);
  const children = await Promise.allSettled(childUrls.map((url) => fetchXml(url, source, parser, fetchImpl, timeoutMs)));
  return children.flatMap((result) => result.status === "fulfilled" ? normalizeSitemap(result.value, source) : []);
}

export async function fetchSourceItems(sources = DEFAULT_SOURCES, fetchImpl = fetch, { timeoutMs = 20000 } = {}) {
  const { XMLParser } = await import("fast-xml-parser");
  const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "" });
  const results = await Promise.allSettled(sources.map(async (source) => {
    if (source.kind === "sitemap") return fetchSitemapItems(source, parser, fetchImpl, timeoutMs);
    return normalizeFeed(await fetchXml(source.url, source, parser, fetchImpl, timeoutMs), source);
  }));

  return {
    items: results.flatMap((result) => result.status === "fulfilled" ? result.value : []),
    errors: results.flatMap((result, index) => result.status === "rejected"
      ? [{ source: sources[index].name, error: String(result.reason?.message ?? result.reason) }]
      : []),
  };
}

