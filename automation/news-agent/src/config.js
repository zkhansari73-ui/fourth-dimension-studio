function positiveInteger(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function boolean(value, fallback) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

export function loadConfig(env = process.env, argv = process.argv.slice(2)) {
  const config = {
    composioApiKey: env.COMPOSIO_API_KEY?.trim() || "",
    composioUserId: env.COMPOSIO_USER_ID?.trim() || "",
    geminiConnectedAccountId: env.GEMINI_CONNECTED_ACCOUNT_ID?.trim() || "",
    sheetsConnectedAccountId: env.GOOGLE_SHEETS_CONNECTED_ACCOUNT_ID?.trim() || "",
    driveConnectedAccountId: env.GOOGLE_DRIVE_CONNECTED_ACCOUNT_ID?.trim() || "",
    spreadsheetId: env.NEWS_SPREADSHEET_ID?.trim() || "",
    sheetName: env.NEWS_SHEET_NAME?.trim() || "News Pipeline",
    geminiModel: env.GEMINI_MODEL?.trim() || "models/gemini-2.5-flash",
    maxAgeDays: positiveInteger(env.NEWS_MAX_AGE_DAYS, 7),
    maxArticlesPerRun: positiveInteger(env.NEWS_MAX_ARTICLES_PER_RUN, 2),
    minImportance: positiveInteger(env.NEWS_MIN_IMPORTANCE, 7),
    minRelevance: positiveInteger(env.NEWS_MIN_RELEVANCE, 7),
    dryRun: argv.includes("--dry-run") || boolean(env.NEWS_DRY_RUN, true),
    generateNews: boolean(env.NEWS_GENERATE, true),
    timezone: env.NEWS_TIMEZONE?.trim() || "Asia/Tehran",
    wordpressUrl: env.WORDPRESS_URL?.trim().replace(/\/$/, "") || "",
    wordpressUsername: env.WORDPRESS_USERNAME?.trim() || "",
    wordpressAppPassword: env.WORDPRESS_APP_PASSWORD?.replace(/\s+/g, "") || "",
  };

  const missing = [];
  for (const [key, label] of [
    ["composioApiKey", "COMPOSIO_API_KEY"],
    ["composioUserId", "COMPOSIO_USER_ID"],
    ["spreadsheetId", "NEWS_SPREADSHEET_ID"],
  ]) {
    if (!config[key]) missing.push(label);
  }
  if (missing.length) throw new Error(`Missing required settings: ${missing.join(", ")}`);
  config.wordpressEnabled = Boolean(config.wordpressUrl && config.wordpressUsername && config.wordpressAppPassword);
  return config;
}

