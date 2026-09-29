import assert from "node:assert/strict";
import test from "node:test";
import { runPipeline } from "../src/pipeline.js";

const sourceResult = {
  items: [{ title: "AI architecture", excerpt: "BIM design automation", url: "https://official.test/news", publishedAt: "2026-09-29" }],
  errors: [],
};

const review = {
  decision: "SELECT", primary_source_verified: true, is_recent: true,
  importance_score_1_to_10: 9, relevance_score_1_to_10: 9,
  original_title: "AI architecture", original_source: "Official",
  original_url: "https://official.test/news", original_publication_date: "2026-09-29", category: "AI",
};

const article = {
  image_prompt_16_9: "Original 16:9 editorial architecture image, no text or logos",
  keywords: [], tags: [], sources: [], fact_check_notes: [],
};

function config() {
  return { maxAgeDays: 7, maxArticlesPerRun: 1, minImportance: 7, minRelevance: 7, dryRun: false, generateImages: true, requireImage: true };
}

test("a generated image URL is stored with the approval row", async () => {
  let written;
  const client = {
    existingUrls: async () => new Set(),
    geminiJson: async (prompt) => prompt.includes("fact-checking editor") ? review : article,
    generateImage: async () => ({ url: "https://images.test/generated.png" }),
    appendRow: async (row) => { written = row; },
  };
  const report = await runPipeline({ config: config(), client, sourceResult, now: new Date("2026-09-29T12:00:00Z"), logger: { error() {}, info() {} } });
  assert.equal(report.generated, 1);
  assert.equal(report.imagesGenerated, 1);
  assert.equal(written[33], "https://images.test/generated.png");
  assert.equal(written[10], "Waiting Approval");
});

test("an article is not queued when its required image fails", async () => {
  let writes = 0;
  const client = {
    existingUrls: async () => new Set(),
    geminiJson: async (prompt) => prompt.includes("fact-checking editor") ? review : article,
    generateImage: async () => { throw new Error("quota"); },
    appendRow: async () => { writes += 1; },
  };
  const report = await runPipeline({ config: config(), client, sourceResult, now: new Date("2026-09-29T12:00:00Z"), logger: { error() {}, info() {} } });
  assert.equal(report.generated, 0);
  assert.equal(report.imageFailures, 1);
  assert.equal(writes, 0);
});
