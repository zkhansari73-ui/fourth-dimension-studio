import { loadConfig } from "./config.js";
import { ArticleComposioClient } from "./composio.js";
import { createPreviewDrafts, WordPressDraftClient } from "./wordpress.js";

const config = loadConfig();
if (!config.wordpressEnabled) throw new Error("WordPress credentials are not configured");

const client = new ArticleComposioClient(config);
const wordpress = new WordPressDraftClient(config);
const result = await createPreviewDrafts({ config, client, wordpress });
console.log(JSON.stringify({ previewBundlesCreated: result.created, languageVersionsPerArticle: 3, published: false }, null, 2));
