const LOCALES = { en: { hl: "en", gl: "us" }, fa: { hl: "fa", gl: "ir" }, ar: { hl: "ar", gl: "ae" } };

async function autocomplete(seed, language, fetchImpl) {
  if (!seed) return [];
  const locale = LOCALES[language];
  const url = new URL("https://suggestqueries.google.com/complete/search");
  url.searchParams.set("client", "firefox"); url.searchParams.set("q", seed); url.searchParams.set("hl", locale.hl); url.searchParams.set("gl", locale.gl);
  const response = await fetchImpl(url, { headers: { "user-agent": "FourthDimensionArticleAgent/1.0" } });
  if (!response.ok) throw new Error(`Autocomplete ${language}: HTTP ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload?.[1]) ? payload[1].filter((x) => typeof x === "string").slice(0, 10) : [];
}

async function sitemapUrls(url, fetchImpl) {
  if (!url) return [];
  const response = await fetchImpl(url, { headers: { "user-agent": "FourthDimensionArticleAgent/1.0" } });
  if (!response.ok) throw new Error(`Site sitemap: HTTP ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)].map((m) => m[1].replaceAll("&amp;", "").trim()).slice(0, 200);
}

export async function collectKeywordResearch(brief, { client, config, fetchImpl = fetch } = {}) {
  const result = { languages: {}, search_console: { enabled: false, queries: [], error: "" }, internal_links: { urls: [], error: "" } };
  for (const language of ["en", "fa", "ar"]) {
    const seed = brief[`search_seed_${language}`] || brief.original_title;
    try { result.languages[language] = { seed, autocomplete: await autocomplete(seed, language, fetchImpl), error: "" }; }
    catch (error) { result.languages[language] = { seed, autocomplete: [], error: error.message }; }
  }
  try { result.internal_links.urls = await sitemapUrls(config.siteSitemapUrl, fetchImpl); }
  catch (error) { result.internal_links.error = error.message; }
  if (config.searchConsoleEnabled) {
    result.search_console.enabled = true;
    try { result.search_console.queries = await client.searchConsoleQueries(); }
    catch (error) { result.search_console.error = error.message; }
  }
  return result;
}
