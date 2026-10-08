import { createHash } from "node:crypto";
import { articlePrompt, qualityGatePrompt, reviewPrompt } from "./prompts.js";
import { isGeminiSelection, passesQualityGate, prefilter } from "./policy.js";
import { buildWaitingApprovalRow } from "./row.js";

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function itemId(review) {
  const slug = String(review.original_source || "NEWS").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const suffix = createHash("sha256").update(review.original_url).digest("hex").slice(0, 10).toUpperCase();
  return `NEWS-${isoDate().replaceAll("-", "")}-${slug}-${suffix}`;
}

async function retry(operation, attempts) {
  let lastError;
  for (let count = 0; count < attempts; count += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
    }
  }
  throw lastError;
}

export async function runPipeline({ config, client, sourceResult, now = new Date(), logger = console }) {
  const existingUrls = await client.existingUrls();
  const filtered = prefilter(sourceResult.items, existingUrls, { now, maxAgeDays: config.maxAgeDays });
  const candidates = filtered.selected.slice(0, config.maxReviewCandidates);
  const report = { discovered: sourceResult.items.length, prefiltered: filtered.selected.length, reviewed: 0, rejected: filtered.rejected.length, generated: 0, reviewFailures: 0, generationFailures: 0, qualityGateFailures: 0, imagesGenerated: 0, imageFailures: 0, dryRun: config.dryRun, sourceErrors: sourceResult.errors };
  const date = isoDate(now);
  const runId = `RUN-${now.toISOString()}`;

  for (const item of candidates) {
    if (report.generated >= config.maxArticlesPerRun) break;
    let review;
    try {
      review = await retry(() => client.geminiJson(reviewPrompt(item, date)), config.geminiRetries ?? 1);
      report.reviewed += 1;
    } catch (error) {
      report.reviewFailures += 1;
      logger.error("News review failed; continuing with the next candidate", { title: item.title, error: error.message });
      continue;
    }
    if (!isGeminiSelection(review, config)) continue;
    let article;
    let qualityGate;
    try {
      article = await retry(() => client.geminiJson(articlePrompt(review)), config.geminiRetries ?? 1);
      qualityGate = await retry(() => client.geminiJson(qualityGatePrompt(review, article)), config.geminiRetries ?? 1);
    } catch (error) {
      report.generationFailures += 1;
      logger.error("News package generation failed; continuing with the next candidate", { title: review.original_title, error: error.message });
      continue;
    }
    if (!passesQualityGate(qualityGate)) {
      report.qualityGateFailures += 1;
      logger.error("Article failed quality gate", { title: review.original_title, result: qualityGate?.result, criticalFailures: qualityGate?.critical_failures });
      continue;
    }
    const imageSpecs = Array.isArray(article.image_package) ? article.image_package.slice(0, config.imagesPerArticle) : [];
    if (imageSpecs.length < config.imagesPerArticle && config.requireImage) {
      report.imageFailures += 1;
      logger.error("Article skipped because its image package is incomplete", { title: review.original_title, expected: config.imagesPerArticle, received: imageSpecs.length });
      continue;
    }
    const imageAssets = [];
    if (config.generateImages) {
      try {
        for (const spec of imageSpecs) {
          const image = await client.generateImage(spec.prompt);
          imageAssets.push({ ...spec, url: image.url, ai_generated: true });
          report.imagesGenerated += 1;
        }
      } catch (error) {
        report.imageFailures += 1;
        logger.error("Image generation failed", { title: review.original_title, error: error.message });
        if (config.requireImage) continue;
      }
    } else if (config.requireImage) {
      logger.error("Article skipped because NEWS_REQUIRE_IMAGE=true while NEWS_GENERATE_IMAGES=false", { title: review.original_title });
      report.imageFailures += 1;
      continue;
    }
    const featuredImageUrl = imageAssets[0]?.url || "";
    const row = buildWaitingApprovalRow({ itemId: itemId(review), discoveredAt: date, review, article, featuredImageUrl, imageAssets, qualityGate, runId });
    if (config.dryRun) logger.info("DRY_RUN: article not written", { title: review.original_title, status: "Waiting Approval" });
    else await client.appendRow(row);
    report.generated += 1;
  }
  return report;
}

