import { loadConfig } from "./config.js";
import { NewsComposioClient } from "./composio.js";
import { runNewsScout } from "./news-scout.js";
import { fetchSourceItems } from "./sources.js";

const config = loadConfig();
const client = new NewsComposioClient(config);
let news = { skipped: true, reason: "NEWS_SCOUT_ENABLED=false" };
if (config.newsScoutEnabled) {
  console.log("Fetching approved news sources...");
  const sourceResult = await fetchSourceItems(undefined, fetch, { timeoutMs: config.sourceTimeoutMs });
  console.log(`Fetched ${sourceResult.items.length} items; ${sourceResult.errors.length} source errors.`);
  news = await runNewsScout({ config, client, sourceResult });
}
console.log(JSON.stringify({ news }, null, 2));

