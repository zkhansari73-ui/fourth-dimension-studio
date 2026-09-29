import assert from "node:assert/strict";
import test from "node:test";
import { runNewsScout } from "../src/news-scout.js";

test("news scout queues a brief without generating an article or image", async () => {
  const calls = [];
  let written;
  const review = {
    decision: "SELECT", hard_rejection_reasons: [], primary_source_verified: true, is_recent: true,
    total_score: 90, importance_score_1_to_10: 9, relevance_score_1_to_10: 9,
    original_title: "AI for BIM", original_source: "Official", original_url: "https://official.test/news",
    original_publication_date: "2026-09-29", category: "AI in Architecture", source_tier: 1,
    news_title_en: "AI for BIM", news_title_fa: "هوش مصنوعی برای BIM", news_title_ar: "الذكاء الاصطناعي لـ BIM",
    summary_en: "summary", summary_fa: "خلاصه", summary_ar: "ملخص", tags: ["AI", "BIM"], verified_facts: [],
  };
  const client = {
    existingUrls: async () => new Set(),
    geminiJson: async (prompt) => { calls.push(prompt); return review; },
    appendNewsRow: async (row) => { written = row; },
    generateImage: async () => { throw new Error("must not generate images"); },
  };
  const sourceResult = { items: [{ title: "AI architecture BIM", excerpt: "design automation", url: "https://official.test/news", publishedAt: "2026-09-29" }], errors: [] };
  const config = { maxAgeDays: 7, maxNewsItemsPerRun: 10, minTotalScore: 70, minImportance: 7, minRelevance: 7, dryRun: false };
  const report = await runNewsScout({ config, client, sourceResult, now: new Date("2026-09-29T12:00:00Z") });
  assert.equal(calls.length, 1);
  assert.equal(report.queuedForApproval, 1);
  assert.equal(written[26], "Waiting News Approval");
  assert.equal(written.length, 30);
});
