import assert from "node:assert/strict";
import test from "node:test";
import { buildNewsInboxRow, buildWaitingApprovalRow, NEWS_INBOX_HEADERS } from "../src/row.js";

test("news inbox rows are separate approval records without article content", () => {
  const review = {
    original_title: "t", original_source: "s", original_url: "https://source.test/news",
    original_publication_date: "2026-09-29", category: "AI in Architecture", source_tier: 1,
    total_score: 88, importance_score_1_to_10: 8, relevance_score_1_to_10: 9,
    primary_source_verified: true, is_recent: true, news_title_en: "EN", news_title_fa: "FA", news_title_ar: "AR",
    summary_en: "EN summary", summary_fa: "FA summary", summary_ar: "AR summary", why_it_matters_fa: "important",
    tags: ["AI", "Architecture"], verified_facts: [],
  };
  const row = buildNewsInboxRow({ newsId: "NEWS-1", discoveredAt: "2026-09-29", review, runId: "run" });
  assert.equal(row.length, NEWS_INBOX_HEADERS.length);
  assert.equal(row.length, 30);
  assert.equal(row[26], "Waiting News Approval");
  assert.equal(row[27], "Pending");
});

test("approval-gated row always has 46 columns and blank publishing fields", () => {
  const review = { original_title: "t", original_source: "s", original_url: "u", original_publication_date: "2026-09-27", category: "AI", importance_score_1_to_10: 8, relevance_score_1_to_10: 9 };
  const article = Object.fromEntries([
    "article_title_en", "seo_title_en", "slug_en", "meta_description_en", "excerpt_en", "full_article_en",
    "article_title_fa", "seo_title_fa", "slug_fa", "meta_description_fa", "excerpt_fa", "full_article_fa",
    "article_title_ar", "seo_title_ar", "slug_ar", "meta_description_ar", "excerpt_ar", "full_article_ar",
    "image_prompt_16_9", "alt_text_en", "alt_text_fa", "alt_text_ar",
  ].map((key) => [key, key]));
  article.keywords = ["one", "two"];
  article.tags = ["tag"];
  article.sources = [];
  article.fact_check_notes = [];
  const row = buildWaitingApprovalRow({ itemId: "id", discoveredAt: "2026-09-28", review, article, featuredImageUrl: "https://images.test/cover.png", runId: "run" });
  assert.equal(row.length, 46);
  assert.equal(row[10], "Waiting Approval");
  assert.equal(row[40], "Pending");
  assert.equal(row[41], "");
  assert.equal(row[42], "");
  assert.equal(row[33], "https://images.test/cover.png");
});

