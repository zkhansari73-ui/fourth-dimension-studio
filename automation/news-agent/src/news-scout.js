import { createHash } from "node:crypto";
import { reviewPrompt } from "./prompts.js";
import { isGeminiSelection, prefilter } from "./policy.js";
import { buildNewsInboxRow } from "./row.js";

function isoDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function newsId(review, date) {
  const source = String(review.original_source || "NEWS").toUpperCase().replace(/[^A-Z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
  const suffix = createHash("sha256").update(review.original_url).digest("hex").slice(0, 10).toUpperCase();
  return `NEWS-${date.replaceAll("-", "")}-${source}-${suffix}`;
}

export async function runNewsScout({ config, client, sourceResult, now = new Date(), logger = console }) {
  const existingUrls = await client.existingUrls();
  const filtered = prefilter(sourceResult.items, existingUrls, { now, maxAgeDays: config.maxAgeDays });
  const date = isoDate(now);
  const runId = `NEWS-RUN-${now.toISOString()}`;
  const report = {
    discovered: sourceResult.items.length,
    prefiltered: filtered.selected.length,
    rejected: filtered.rejected.length,
    queuedForApproval: 0,
    dryRun: config.dryRun,
    sourceErrors: sourceResult.errors,
  };

  for (const item of filtered.selected) {
    if (report.queuedForApproval >= config.maxNewsItemsPerRun) break;
    const review = await client.geminiJson(reviewPrompt(item, date));
    if (!isGeminiSelection(review, config)) continue;
    const row = buildNewsInboxRow({ newsId: newsId(review, date), discoveredAt: date, review, runId });
    if (config.dryRun) logger.info("DRY_RUN: news brief not written", { title: review.original_title, status: "Waiting News Approval" });
    else await client.appendNewsRow(row);
    report.queuedForApproval += 1;
  }

  return report;
}
