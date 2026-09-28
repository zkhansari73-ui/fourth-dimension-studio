import { loadConfig } from "./config.js";
import { NewsComposioClient } from "./composio.js";
import { runPipeline } from "./pipeline.js";
import { fetchSourceItems } from "./sources.js";
import { createApprovedDrafts, WordPressDraftClient } from "./wordpress.js";

const config = loadConfig();
const client = new NewsComposioClient(config);
const wordpress = new WordPressDraftClient(config);
const drafts = await createApprovedDrafts({ config, client, wordpress });
let report = { skipped: true, reason: "NEWS_GENERATE=false" };
if (config.generateNews) {
  const sourceResult = await fetchSourceItems();
  report = await runPipeline({ config, client, sourceResult });
}
console.log(JSON.stringify({ ...report, wordpressDrafts: drafts }, null, 2));

