const LANGUAGE_SETTINGS = Object.freeze({
  en: { hl: "en", gl: "us" },
  fa: { hl: "fa", gl: "ir" },
  ar: { hl: "ar", gl: "ae" },
});

export async function googleAutocomplete(seed, language, fetchImpl = fetch) {
  if (!seed) return [];
  const settings = LANGUAGE_SETTINGS[language] ?? LANGUAGE_SETTINGS.en;
  const url = new URL("https://suggestqueries.google.com/complete/search");
  url.searchParams.set("client", "firefox");
  url.searchParams.set("q", seed);
  url.searchParams.set("hl", settings.hl);
  url.searchParams.set("gl", settings.gl);
  const response = await fetchImpl(url, { headers: { "user-agent": "FourthDimensionNewsAgent/1.0" } });
  if (!response.ok) throw new Error(`Google Autocomplete ${language}: HTTP ${response.status}`);
  const payload = await response.json();
  return Array.isArray(payload?.[1]) ? payload[1].filter((item) => typeof item === "string").slice(0, 10) : [];
}

export async function collectKeywordResearch(review, { client, config, fetchImpl = fetch } = {}) {
  const seeds = {
    en: review.search_seed_en || review.original_title,
    fa: review.search_seed_fa || review.original_title,
    ar: review.search_seed_ar || review.original_title,
  };
  const entries = await Promise.all(Object.entries(seeds).map(async ([language, seed]) => {
    try {
      return [language, { seed, autocomplete: await googleAutocomplete(seed, language, fetchImpl), error: "" }];
    } catch (error) {
      return [language, { seed, autocomplete: [], error: error.message }];
    }
  }));
  const result = { languages: Object.fromEntries(entries), search_console: { enabled: false, queries: [], error: "" }, internal_links: { urls: [], error: "" } };

  if (config?.siteSitemapUrl) {
    try {
      result.internal_links.urls = await sitemapUrls(config.siteSitemapUrl, fetchImpl);
    } catch (error) {
      result.internal_links.error = error.message;
    }
  }

  if (config?.searchConsoleEnabled && client?.searchConsoleQueries) {
    result.search_console.enabled = true;
    try {
      result.search_console.queries = await client.searchConsoleQueries();
    } catch (error) {
      result.search_console.error = error.message;
    }
  }
  return result;
}

export async function sitemapUrls(url, fetchImpl = fetch) {
  const response = await fetchImpl(url, { headers: { "user-agent": "FourthDimensionNewsAgent/1.0" } });
  if (!response.ok) throw new Error(`Site sitemap: HTTP ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>\s*(https?:\/\/[^<]+)\s*<\/loc>/gi)]
    .map((match) => match[1].replaceAll("&amp;", "&").trim())
    .filter((item, index, all) => all.indexOf(item) === index)
    .slice(0, 200);
}
