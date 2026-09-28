import { createHash } from "node:crypto";
import { articlePrompt, reviewPrompt } from "./prompts.js";
import { isGeminiSelection, prefilter } from "./policy.js";
import { buildWaitingApprovalRow } from "./row.js";

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function itemId(review) {
  const slug = String(review.original_source || "NEWS").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const suffix = createHash("sha256").update(review.original_url).digest("hex").slice(0, 10).toUpperCase();
  return `NEWS-${isoDate().replaceAll("-", "")}-${slug}-${suffix}`;
}

export async function runPipeline({ config, client, sourceResult, now = new Date(), logger = console }) {
  const existingUrls = await client.existingUrls();
  const filtered = prefilter(sourceResult.items, existingUrls, { now, maxAgeDays: config.maxAgeDays });
  const report = { discovered: sourceResult.items.length, prefiltered: filtered.selected.length, rejected: filtered.rejected.length, generated: 0, dryRun: config.dryRun, sourceErrors: sourceResult.errors };
  const date = isoDate(now);
  const runId = `RUN-${now.toISOString()}`;

  for (const item of filtered.selected) {
    if (report.generated >= config.maxArticlesPerRun) break;
    const review = await client.geminiJson(reviewPrompt(item, date));
    if (!isGeminiSelection(review, config)) continue;
    const article = await client.geminiJson(articlePrompt(review));
    const row = buildWaitingApprovalRow({ itemId: itemId(review), discoveredAt: date, review, article, runId });
    if (config.dryRun) logger.info("DRY_RUN: article not written", { title: review.original_title, status: "Waiting Approval" });
    else await client.appendRow(row);
    report.generated += 1;
  }
  return report;
}

