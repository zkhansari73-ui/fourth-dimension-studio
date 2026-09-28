import { loadConfig } from "./config.js";
import { NewsComposioClient } from "./composio.js";
import { runPipeline } from "./pipeline.js";
import { fetchSourceItems } from "./sources.js";
import { createApprovedDrafts, WordPressDraftClient } from "./wordpress.js";

const config = loadConfig();
const sourceResult = await fetchSourceItems();
const client = new NewsComposioClient(config);
const report = await runPipeline({ config, client, sourceResult });
const wordpress = new WordPressDraftClient(config);
const drafts = await createApprovedDrafts({ config, client, wordpress });
console.log(JSON.stringify({ ...report, wordpressDrafts: drafts }, null, 2));

