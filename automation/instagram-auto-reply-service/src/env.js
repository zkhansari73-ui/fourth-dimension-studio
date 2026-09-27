import path from "node:path";

function asBoolean(value, fallback) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function asPositiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env = process.env, cwd = process.cwd()) {
  const dryRun = asBoolean(env.DRY_RUN, true);
  const allowUnsignedWebhooks = asBoolean(env.ALLOW_UNSIGNED_WEBHOOKS, false);
  const ingestMode = env.INGEST_MODE?.trim().toLowerCase() || "poll";
  const config = {
    port: asPositiveInteger(env.PORT, 8787),
    dryRun,
    ingestMode,
    pollIntervalSeconds: asPositiveInteger(env.POLL_INTERVAL_SECONDS, 60),
    maxPagesPerPoll: asPositiveInteger(env.MAX_PAGES_PER_POLL, 10),
    allowUnsignedWebhooks,
    composioApiKey: env.COMPOSIO_API_KEY?.trim() ?? "",
    composioUserId: env.COMPOSIO_USER_ID?.trim() ?? "",
    composioConnectedAccountId:
      env.COMPOSIO_CONNECTED_ACCOUNT_ID?.trim() ?? "",
    composioInstagramVersion:
      env.COMPOSIO_INSTAGRAM_VERSION?.trim() || "20260915_00",
    instagramAccountId: env.INSTAGRAM_ACCOUNT_ID?.trim() ?? "",
    metaVerifyToken: env.META_VERIFY_TOKEN?.trim() ?? "",
    metaAppSecret: env.META_APP_SECRET?.trim() ?? "",
    replyConfigPath: path.resolve(
      cwd,
      env.REPLY_CONFIG_PATH?.trim() || "./config/replies.json",
    ),
    statePath: path.resolve(
      cwd,
      env.STATE_PATH?.trim() || "./data/state.json",
    ),
    maxReplyAttempts: asPositiveInteger(env.MAX_REPLY_ATTEMPTS, 5),
  };

  const errors = [];
  if (!["poll", "webhook"].includes(config.ingestMode)) {
    errors.push("INGEST_MODE must be poll or webhook");
  }
  if (config.ingestMode === "webhook") {
    if (!config.metaVerifyToken) errors.push("META_VERIFY_TOKEN is required in webhook mode");
    if (!config.allowUnsignedWebhooks && !config.metaAppSecret) {
      errors.push("META_APP_SECRET is required when unsigned webhooks are disabled");
    }
  }
  if (config.ingestMode === "poll" || !config.dryRun) {
    if (!config.composioApiKey) errors.push("COMPOSIO_API_KEY is required for Composio access");
    if (!config.composioUserId && !config.composioConnectedAccountId) {
      errors.push(
        "COMPOSIO_USER_ID or COMPOSIO_CONNECTED_ACCOUNT_ID is required for Composio access",
      );
    }
  }
  if (!config.dryRun && !config.instagramAccountId) {
    errors.push("INSTAGRAM_ACCOUNT_ID is required in live mode");
  }

  if (errors.length > 0) {
    throw new Error(`Invalid configuration:\n- ${errors.join("\n- ")}`);
  }
  return config;
}
