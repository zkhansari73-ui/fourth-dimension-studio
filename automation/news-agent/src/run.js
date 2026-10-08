import { loadConfig } from "./config.js";
import { NewsComposioClient } from "./composio.js";
import { runNewsScout } from "./news-scout.js";
import { DEFAULT_SOURCES, fetchSourceItems } from "./sources.js";

const config = loadConfig();
const client = new NewsComposioClient(config);
let news = { skipped: true, reason: "NEWS_SCOUT_ENABLED=false" };
if (config.newsScoutEnabled) {
  console.log("Fetching approved news sources...");
  const sources = DEFAULT_SOURCES.filter((source) => source.kind === "rss" && source.tier <= 2);
  const sourceResult = await fetchSourceItems(sources, fetch, { timeoutMs: 12000 });
  console.log(`Fetched ${sourceResult.items.length} items; ${sourceResult.errors.length} source errors.`);
  news = await runNewsScout({ config, client, sourceResult });
}
console.log(JSON.stringify({ news }, null, 2));
