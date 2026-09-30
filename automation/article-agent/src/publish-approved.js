import { loadConfig } from "./config.js";
import { ArticleComposioClient } from "./composio.js";
import { approvedRows, WordPressDraftClient } from "./wordpress.js";

const config = loadConfig();
if (!config.wordpressEnabled) throw new Error("WordPress credentials are not configured");
const client = new ArticleComposioClient(config);
const wordpress = new WordPressDraftClient(config);
let created = 0;
for (const { row, sheetRow } of approvedRows(await client.articleRows())) {
  const draft = await wordpress.createDraft(row);
  await client.updateCell(`K${sheetRow}`, "Ready for Publishing");
  await client.updateCell(`AQ${sheetRow}`, draft.editUrl);
  created += 1;
}
console.log(JSON.stringify({ approvedDraftsCreated: created, published: false }, null, 2));
