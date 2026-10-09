import { loadConfig } from "./config.js";
import { NewsComposioClient } from "./composio.js";
import { createApprovedDrafts, WordPressDraftClient } from "./wordpress.js";

const config = loadConfig();
const client = new NewsComposioClient(config);
const wordpress = new WordPressDraftClient(config);
const drafts = await createApprovedDrafts({ config, client, wordpress });
// The scheduled ChatGPT Work task performs editorial research, writing,
// translation and image briefing. This job is mechanical only: it creates
// private WordPress drafts from explicitly approved News Pipeline packages.
console.log(JSON.stringify({
  role: "approval-safe-private-draft-publisher",
  wordpressDrafts: drafts,
}, null, 2));
