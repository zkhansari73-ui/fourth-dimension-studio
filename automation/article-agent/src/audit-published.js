import { loadConfig } from "./config.js";
import { ArticleComposioClient } from "./composio.js";
import { safeJson } from "./publication.js";

const COL = Object.freeze({ itemId: 0, workflowStatus: 10, wordpressBundle: 42, publishNotes: 45 });
const LANGS = ["en", "fa", "ar"];

function publishedRows(rows) {
  return rows.map((row, index) => ({ row, sheetRow: index + 2 })).filter(({ row }) =>
    /^published\b/i.test(String(row[COL.workflowStatus] || ""))
  );
}

async function fetchText(url) {
  const response = await fetch(url, { redirect: "follow", headers: { "user-agent": "FourthDimensionArticleAudit/1.0" } });
  return { status: response.status, ok: response.ok, url: response.url, text: await response.text() };
}

function includesHref(html, rel, href) {
  const quoted = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`<link[^>]+rel=["'][^"']*${rel}[^"']*["'][^>]+href=["']${quoted}["']|<link[^>]+href=["']${quoted}["'][^>]+rel=["'][^"']*${rel}`, "i").test(html);
}

async function inspectBundle(urls, sitemapUrl) {
  const pages = {};
  for (const lang of LANGS) {
    const requestedUrl = urls[lang];
    if (!requestedUrl) { pages[lang] = { ok: false, error: "missing language URL" }; continue; }
    try {
      const page = await fetchText(requestedUrl);
      pages[lang] = {
        http_200: page.ok,
        final_url: page.url,
        self_canonical: includesHref(page.text, "canonical", page.url) || includesHref(page.text, "canonical", requestedUrl),
        reciprocal_hreflang: Object.entries(urls).every(([code, href]) => includesHref(page.text, "alternate", href) && new RegExp(`hreflang=["']${code}["']`, "i").test(page.text)),
        article_schema: /"@type"\s*:\s*"Article"/i.test(page.text),
        breadcrumb_schema: /"@type"\s*:\s*"BreadcrumbList"/i.test(page.text),
        faq_schema_when_present: !/<h2[^>]*>[^<]*FAQ/i.test(page.text) || /"@type"\s*:\s*"FAQPage"/i.test(page.text),
      };
    } catch (error) { pages[lang] = { ok: false, error: error.message }; }
  }
  let sitemap = { checked: false, included: false, error: "" };
  if (sitemapUrl) {
    try {
      const data = await fetchText(sitemapUrl);
      sitemap = { checked: true, included: Object.values(urls).every((url) => data.text.includes(url)), error: "" };
    } catch (error) { sitemap = { checked: true, included: false, error: error.message }; }
  }
  return { checked_at: new Date().toISOString(), pages, sitemap };
}

const config = loadConfig();
const client = new ArticleComposioClient(config);
let audited = 0;
for (const { row, sheetRow } of publishedRows(await client.articleRows())) {
  const prior = safeJson(row[COL.publishNotes], {});
  const urls = prior.language_urls || safeJson(row[COL.wordpressBundle], {}).urls || {};
  const report = await inspectBundle(urls, config.siteSitemapUrl);
  let searchConsole = { enabled: false, note: "Search Console metrics are collected at site level; ordinary articles cannot be force-indexed by API." };
  if (config.searchConsoleEnabled) {
    try { searchConsole = { enabled: true, queries: await client.searchConsoleQueries(), note: "Use URL Inspection in Search Console for per-URL coverage; sitemap discovery is automatic." }; }
    catch (error) { searchConsole = { enabled: true, error: error.message }; }
  }
  await client.updateCell(`AT${sheetRow}`, JSON.stringify({ ...prior, audit: report, search_console: searchConsole }));
  audited += 1;
  console.log("Published article audited", { itemId: row[COL.itemId], urls });
}
console.log(JSON.stringify({ audited, published: false }, null, 2));
