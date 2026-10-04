import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";
import { passesQualityGate, recentCandidates } from "../src/policy.js";
import { articleRow } from "../src/row.js";
import { approvedRows, draftPayload } from "../src/wordpress.js";
import { ensureImagePackage } from "../src/images.js";
import { parseGeminiJson } from "../src/json.js";
import { topicSuggestionsPrompt } from "../src/prompts.js";

test("article config is independent and manual-topic aware", () => {
  const config = loadConfig({ COMPOSIO_API_KEY: "c", COMPOSIO_USER_ID: "u", GEMINI_API_KEY: "direct", GEMINI_CONNECTED_ACCOUNT_ID: "g", GOOGLE_SHEETS_CONNECTED_ACCOUNT_ID: "s", ARTICLE_SPREADSHEET_ID: "id", ARTICLE_TOPIC: "BIM agents" }, []);
  assert.equal(config.articleSheetName, "Article Pipeline");
  assert.equal(config.mode, "suggest_topics");
  assert.equal(config.requestedTopic, "BIM agents");
  assert.equal(config.generateImages, true);
  assert.equal(config.geminiApiKey, "direct");
});

test("topic suggestion mode requests five verified choices without generating an article", () => {
  const prompt = topicSuggestionsPrompt([{ title: "Current topic", url: "https://example.test/source" }], "2026-10-04");
  assert.match(prompt, /exactly five/i);
  assert.match(prompt, /Do not write an article/i);
  assert.match(prompt, /primary_source_verified/);
});

test("trend candidates exclude duplicate and stale article sources", () => {
  const now = new Date("2026-09-30T00:00:00Z");
  const items = [
    { url: "https://a.test/new?utm_source=x", publishedAt: "2026-09-29", title: "new" },
    { url: "https://a.test/old", publishedAt: "2026-01-01", title: "old" },
    { url: "https://a.test/used", publishedAt: "2026-09-29", title: "used" },
  ];
  assert.deepEqual(recentCandidates(items, new Set(["https://a.test/used"]), { now }).map((x) => x.title), ["new"]);
});

test("quality gate always requires explicit human review", () => {
  assert.equal(passesQualityGate({ result: "PASS", human_review_required: true, critical_failures: [] }), true);
  assert.equal(passesQualityGate({ result: "PASS", human_review_required: false, critical_failures: [] }), false);
});

test("image package is completed to four production-ready specifications", () => {
  const article = {
    article_title_en: "AI for BIM",
    article_title_fa: "هوش مصنوعی برای بیم",
    article_title_ar: "الذكاء الاصطناعي لنمذجة البناء",
    slug_en: "ai-for-bim",
    primary_keyword_en: "AI for BIM",
    primary_keyword_fa: "هوش مصنوعی برای بیم",
    primary_keyword_ar: "الذكاء الاصطناعي لنمذجة البناء",
    related_keywords_en: ["BIM automation"],
    related_keywords_fa: ["اتوماسیون بیم"],
    related_keywords_ar: ["أتمتة نمذجة البناء"],
    sources: [{ name: "Autodesk AEC", url: "https://www.autodesk.com/blogs/aec/" }],
    image_package: [{ role: "featured", prompt: "original hero" }],
  };
  const result = ensureImagePackage(article, 4);
  assert.equal(result.length, 4);
  assert.equal(result[0].prompt, "original hero");
  for (const item of result) {
    assert.ok(item.prompt); assert.ok(item.filename.endsWith(".webp")); assert.ok(item.placement_hint);
    assert.ok(item.caption); assert.ok(item.credit); assert.equal(item.source_name, "Autodesk AEC");
    assert.equal(item.source_url, "https://www.autodesk.com/blogs/aec/"); assert.ok(item.reference_sources.length);
    assert.ok(item.keywords_en.length); assert.ok(item.keywords_fa.length); assert.ok(item.keywords_ar.length);
    assert.ok(item.alt_text_en); assert.ok(item.alt_text_fa); assert.ok(item.alt_text_ar);
  }
});

test("generated article row is waiting approval and has 46 columns", () => {
  const brief = { original_title: "T", original_source: "S", original_url: "https://s.test", original_publication_date: "2026-09-30", category: "AI", importance_score_1_to_10: 9, relevance_score_1_to_10: 9 };
  const article = { article_title_en: "E", seo_title_en: "E", slug_en: "e", meta_description_en: "m", excerpt_en: "x", full_article_en: "b", article_title_fa: "F", seo_title_fa: "F", slug_fa: "f", meta_description_fa: "m", excerpt_fa: "x", full_article_fa: "b", article_title_ar: "A", seo_title_ar: "A", slug_ar: "a", meta_description_ar: "m", excerpt_ar: "x", full_article_ar: "b", keywords: [], tags: [], sources: [] };
  const row = articleRow({ articleId: "ID", createdAt: "2026-09-30", brief, article, featuredImageUrl: "https://img.test", imageAssets: [], keywordResearch: {}, qualityGate: {}, runId: "R" });
  assert.equal(row.length, 46); assert.equal(row[10], "Waiting Approval"); assert.equal(row[40], "Pending"); assert.equal(row[42], "");
});

test("WordPress step selects only Approved rows and always creates a draft", () => {
  const approved = Array(46).fill(""); approved[0] = "ID"; approved[18] = "عنوان"; approved[23] = "متن"; approved[40] = "Approved";
  const pending = [...approved]; pending[40] = "Pending";
  assert.equal(approvedRows([pending, approved]).length, 1);
  assert.equal(draftPayload(approved).status, "draft");
});

test("article draft includes professional publication components", () => {
  const value = Array(46).fill("");
  value[0] = "ARTICLE-1"; value[1] = "2026-10-04"; value[7] = "Architecture";
  value[12] = "English article"; value[16] = "English excerpt"; value[17] = "## Overview\n\nEnglish body";
  value[18] = "مقاله فارسی"; value[22] = "خلاصه فارسی"; value[23] = "## معرفی\n\nمتن فارسی";
  value[24] = "مقال عربي"; value[28] = "ملخص عربي"; value[29] = "## مقدمة\n\nنص عربي";
  value[30] = "architecture | AI"; value[31] = "BIM | Design";
  value[37] = JSON.stringify([{ name: "Autodesk", url: "https://autodesk.com" }]);
  const payload = draftPayload(value, { postUrl: "https://site.test/article", images: [{ url: "https://site.test/hero.webp", role: "featured" }, { url: "https://site.test/internal.webp", caption: "Workflow", credit: "Fourth Dimension Studio", ai_generated: true, alt_text_en: "Workflow image", alt_text_fa: "تصویر فرایند", alt_text_ar: "صورة سير العمل" }] });
  assert.match(payload.content, /"@type":"Article"/);
  assert.match(payload.content, /fd-toc/);
  assert.match(payload.content, /loading="lazy"/);
  assert.match(payload.content, /AI-generated/);
  assert.match(payload.content, /hreflang="ar"/);
  assert.match(payload.content, /fd-share/);
  assert.match(payload.content, /Related content/);
});

test("Gemini JSON parser preserves LaTeX-style backslashes", () => {
  const parsed = parseGeminiJson(String.raw`{"formula":"$\lambda$","line":"first\nsecond"}`);
  assert.equal(parsed.formula, String.raw`$\lambda$`);
  assert.equal(parsed.line, "first\nsecond");
});
