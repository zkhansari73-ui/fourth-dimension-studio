function bool(value, fallback) {
  if (value == null || value === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(value).toLowerCase());
}

function positiveInt(value, fallback) {
  const parsed = Number.parseInt(value ?? "", 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export function loadConfig(env = process.env, argv = process.argv.slice(2)) {
  const config = {
    composioApiKey: env.COMPOSIO_API_KEY?.trim() || "",
    composioUserId: env.COMPOSIO_USER_ID?.trim() || "",    geminiApiKey: env.GEMINI_API_KEY?.trim() || "",
    geminiConnectedAccountId: env.GEMINI_CONNECTED_ACCOUNT_ID?.trim() || "",
    sheetsConnectedAccountId: env.GOOGLE_SHEETS_CONNECTED_ACCOUNT_ID?.trim() || "",
    driveConnectedAccountId: env.GOOGLE_DRIVE_CONNECTED_ACCOUNT_ID?.trim() || "",
    searchConsoleConnectedAccountId: env.GOOGLE_SEARCH_CONSOLE_CONNECTED_ACCOUNT_ID?.trim() || "",
    searchConsoleSiteUrl: env.SEARCH_CONSOLE_SITE_URL?.trim() || "",
    siteSitemapUrl: env.SITE_SITEMAP_URL?.trim() || "",
    spreadsheetId: env.ARTICLE_SPREADSHEET_ID?.trim() || "",
    articleSheetName: env.ARTICLE_SHEET_NAME?.trim() || "Article Pipeline",
    requestedTopic: env.ARTICLE_TOPIC?.trim() || "",
    geminiModel: env.GEMINI_MODEL?.trim() || "models/gemini-2.5-flash",
    geminiImageModel: env.GEMINI_IMAGE_MODEL?.trim() || "gemini-2.5-flash-image",
    generateImages: bool(env.ARTICLE_GENERATE_IMAGES, true),
    requireImages: bool(env.ARTICLE_REQUIRE_IMAGES, true),
    imagesPerArticle: positiveInt(env.ARTICLE_IMAGES_PER_ARTICLE, 4),
    sourceTimeoutMs: positiveInt(env.ARTICLE_SOURCE_TIMEOUT_MS, 20000),
    maxTrendCandidates: positiveInt(env.ARTICLE_MAX_TREND_CANDIDATES, 12),
    dryRun: argv.includes("--dry-run") || bool(env.ARTICLE_DRY_RUN, false),
    wordpressUrl: env.WORDPRESS_URL?.trim().replace(/\/$/, "") || "",
    wordpressUsername: env.WORDPRESS_USERNAME?.trim() || "",
    wordpressAppPassword: env.WORDPRESS_APP_PASSWORD?.replace(/\s+/g, "") || "",
  };
  const missing = [
    ["composioApiKey", "COMPOSIO_API_KEY"], ["composioUserId", "COMPOSIO_USER_ID"],
    ["sheetsConnectedAccountId", "GOOGLE_SHEETS_CONNECTED_ACCOUNT_ID"],
    ["spreadsheetId", "ARTICLE_SPREADSHEET_ID"],
  ].filter(([key]) => !config[key]).map(([, label]) => label);
  if (missing.length) throw new Error(`Missing required settings: ${missing.join(", ")}`);
  config.searchConsoleEnabled = Boolean(config.searchConsoleConnectedAccountId && config.searchConsoleSiteUrl);
  config.wordpressEnabled = Boolean(config.wordpressUrl && config.wordpressUsername && config.wordpressAppPassword);
  return config;
}
