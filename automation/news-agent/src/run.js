import { loadConfig } from "./config.js";
import { NewsComposioClient } from "./composio.js";
import { runNewsScout } from "./news-scout.js";
import { fetchSourceItems } from "./sources.js";

const config = loadConfig();
const client = new NewsComposioClient(config);
let news = { skipped: true, reason: "NEWS_SCOUT_ENABLED=false" };
if (config.newsScoutEnabled) {
  const sourceResult = await fetchSourceItems();
  news = await runNewsScout({ config, client, sourceResult });
}
console.log(JSON.stringify({ news }, null, 2));

