import test from "node:test";
import assert from "node:assert/strict";
import { loadConfig } from "../src/config.js";
import { passesQualityGate, recentCandidates } from "../src/policy.js";
import { articleRow } from "../src/row.js";
import { approvedRows, draftPayload } from "../src/wordpress.js";

test("article config is independent and manual-topic aware", () => {
  const config = loadConfig({ COMPOSIO_API_KEY: "c", COMPOSIO_USER_ID: "u", GEMINI_CONNECTED_ACCOUNT_ID: "g", GOOGLE_SHEETS_CONNECTED_ACCOUNT_ID: "s", ARTICLE_SPREADSHEET_ID: "id", ARTICLE_TOPIC: "BIM agents" }, []);
  assert.equal(config.articleSheetName, "Article Pipeline");
  assert.equal(config.requestedTopic, "BIM agents");
  assert.equal(config.generateImages, true);
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
