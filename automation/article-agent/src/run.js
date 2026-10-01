import { createHash } from "node:crypto";
import { loadConfig } from "./config.js";
import { ArticleComposioClient } from "./composio.js";
import { collectKeywordResearch } from "./keyword-research.js";
import { ensureImagePackage } from "./images.js";
import { articlePrompt, qualityGatePrompt, trendPrompt } from "./prompts.js";
import { passesQualityGate, recentCandidates } from "./policy.js";
import { articleRow } from "./row.js";
import { fetchSourceItems } from "./sources.js";

const config = loadConfig();
const client = new ArticleComposioClient(config);
const now = new Date();
const today = now.toISOString().slice(0, 10);
const runId = `ARTICLE-RUN-${now.toISOString()}`;

console.log("Collecting current international source candidates for an independent article...");
const sourceResult = await fetchSourceItems(undefined, fetch, { timeoutMs: config.sourceTimeoutMs });
const existingUrls = await client.existingArticleUrls();
const candidates = recentCandidates(sourceResult.items, existingUrls, { now, maxAgeDays: 14, limit: config.maxTrendCandidates });
if (!candidates.length) throw new Error("No recent non-duplicate candidates were available for article commissioning");

// Keep the Composio/Gemini request bounded: source pages can contain very large RSS excerpts.
const compactCandidates = candidates.map((item) => ({
  source: item.source,
  sourceTierHint: item.sourceTierHint,
  categoryHint: item.categoryHint,
  title: String(item.title || "").slice(0, 240),
  url: item.url,
  publishedAt: item.publishedAt,
  excerpt: String(item.excerpt || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 360),
}));
const brief = await client.geminiJson(trendPrompt(compactCandidates, config.requestedTopic, today));
if (brief?.decision !== "SELECT" || brief?.primary_source_verified !== true) throw new Error(`No publishable article subject selected: ${brief?.rejection_reason || "selection rejected"}`);

const keywordResearch = await collectKeywordResearch(brief, { client, config });
const article = await client.geminiJson(articlePrompt(brief, keywordResearch, today));
article.image_package = ensureImagePackage(article, config.imagesPerArticle);
const qualityGate = await client.geminiJson(qualityGatePrompt(brief, article));
if (!passesQualityGate(qualityGate)) throw new Error(`Article failed quality gate: ${JSON.stringify(qualityGate?.critical_failures || qualityGate?.revision_items || [])}`);

const specs = Array.isArray(article.image_package) ? article.image_package.slice(0, config.imagesPerArticle) : [];
if (config.requireImages && specs.length !== config.imagesPerArticle) throw new Error(`Article requires ${config.imagesPerArticle} image specifications; received ${specs.length}`);
const imageAssets = [];
if (config.generateImages) {
  for (const spec of specs) {
    const generated = await client.generateImage(spec.prompt);
    imageAssets.push({ ...spec, url: generated.url, ai_generated: true });
  }
} else if (config.requireImages) throw new Error("Images are required but ARTICLE_GENERATE_IMAGES=false");

const articleId = `ARTICLE-${today.replaceAll("-", "")}-${createHash("sha256").update(brief.original_url || brief.original_title).digest("hex").slice(0, 10).toUpperCase()}`;
const row = articleRow({ articleId, createdAt: today, brief, article, featuredImageUrl: imageAssets[0]?.url || "", imageAssets, keywordResearch, qualityGate, runId });
if (config.dryRun) console.log("DRY_RUN: article validated but not written", { articleId, title: article.article_title_fa });
else await client.appendArticle(row);
console.log(JSON.stringify({ articleId, status: "Waiting Approval", topicMode: config.requestedTopic ? "requested-direction" : "automatic-trend", titleFa: article.article_title_fa, sourceErrors: sourceResult.errors, imagesGenerated: imageAssets.length, wroteToSheet: !config.dryRun, published: false }, null, 2));
