import assert from "node:assert/strict";
import test from "node:test";
import { buildWaitingApprovalRow } from "../src/row.js";

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
  const row = buildWaitingApprovalRow({ itemId: "id", discoveredAt: "2026-09-28", review, article, runId: "run" });
  assert.equal(row.length, 46);
  assert.equal(row[10], "Waiting Approval");
  assert.equal(row[40], "Pending");
  assert.equal(row[41], "");
  assert.equal(row[42], "");
});

