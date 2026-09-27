import { loadConfig } from "./env.js";
import { ComposioReplier } from "./composio-replier.js";

const config = loadConfig();
const client = new ComposioReplier(config);
const account = await client.verifyConnectedAccount();

console.log("Composio Instagram connection verified", {
  connectedAccountId: account.id,
  userId: account.userId,
  status: account.status,
  toolkitVersion: config.composioInstagramVersion,
  mode: config.dryRun ? "dry-run" : "live",
});
