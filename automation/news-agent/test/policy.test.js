import assert from "node:assert/strict";
import test from "node:test";
import { canonicalUrl, isGeminiSelection, prefilter } from "../src/policy.js";

test("canonicalUrl removes tracking parameters", () => {
  assert.equal(canonicalUrl("https://example.com/a/?utm_source=x&id=2#top"), "https://example.com/a?id=2");
});

test("prefilter keeps only recent relevant unique items", () => {
  const now = new Date("2026-09-28T12:00:00Z");
  const items = [
    { title: "AI in architecture", excerpt: "BIM design", url: "https://a.test/1", publishedAt: "2026-09-27" },
    { title: "AI in architecture", excerpt: "BIM design", url: "https://a.test/1?utm_source=x", publishedAt: "2026-09-27" },
    { title: "Old Revit story", excerpt: "BIM", url: "https://a.test/2", publishedAt: "2026-01-01" },
  ];
  const result = prefilter(items, new Set(), { now, maxAgeDays: 7 });
  assert.equal(result.selected.length, 1);
  assert.deepEqual(result.rejected.map((x) => x.rejectionReason), ["duplicate", "not_recent"]);
});

test("Gemini selection enforces scores and verification", () => {
  const config = { minImportance: 7, minRelevance: 7, minTotalScore: 70 };
  assert.equal(isGeminiSelection({ decision: "SELECT", total_score: 82, hard_rejection_reasons: [], importance_score_1_to_10: 8, relevance_score_1_to_10: 9, primary_source_verified: true, is_recent: true }, config), true);
  assert.equal(isGeminiSelection({ decision: "SELECT", total_score: 82, hard_rejection_reasons: [], importance_score_1_to_10: 6, relevance_score_1_to_10: 9, primary_source_verified: true, is_recent: true }, config), false);
  assert.equal(isGeminiSelection({ decision: "SELECT", total_score: 95, hard_rejection_reasons: ["unverified claim"], importance_score_1_to_10: 9, relevance_score_1_to_10: 9, primary_source_verified: true, is_recent: true }, config), false);
});

