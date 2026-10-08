import { Composio } from "@composio/core";

export class NewsComposioClient {
  constructor(config) {
    this.config = config;
    this.client = new Composio({ apiKey: config.composioApiKey });
    this.toolVersions = new Map();
  }

  async execute(slug, arguments_, connectedAccountId = "") {
    let version = this.toolVersions.get(slug);
    if (!version) {
      const tool = await this.client.tools.getRawComposioToolBySlug(slug);
      version = tool?.version;
      if (!version || version === "latest") {
        version = (tool?.availableVersions ?? []).find((item) => item && item !== "latest");
      }
      if (!version) throw new Error(`No pinned Composio version is available for ${slug}`);
      this.toolVersions.set(slug, version);
    }
    const request = { userId: this.config.composioUserId, arguments: arguments_, version };
    if (connectedAccountId) request.connectedAccountId = connectedAccountId;
    const result = await this.client.tools.execute(slug, request);
    if (result?.error) throw new Error(result.error?.message ?? String(result.error));
    return result?.data ?? result;
  }

  async existingUrls() {
    const range = `'${this.config.newsInboxSheetName}'!E2:E`;
    const data = await this.execute("GOOGLESHEETS_VALUES_GET", {
      spreadsheet_id: this.config.spreadsheetId,
      range,
      major_dimension: "ROWS",
      value_render_option: "FORMATTED_VALUE",
    }, this.config.sheetsConnectedAccountId);
    return new Set((data?.values ?? []).flat().filter(Boolean));
  }

  async geminiJson(prompt) {
    if (!this.config.geminiApiKey) throw new Error("GEMINI_API_KEY is required for the news agent");
    const configuredModel = String(this.config.geminiModel).replace(/^models\//, "");
    const models = [...new Set([configuredModel, "gemini-2.5-flash", "gemini-2.0-flash"])];
    let lastError = "unknown error";
    for (const model of models) {
      const endpoint = "https://generativelanguage.googleapis.com/v1beta/models/" + encodeURIComponent(model) + ":generateContent?key=" + encodeURIComponent(this.config.geminiApiKey);
      const response = await fetch(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.25 } }) });
      const payload = await response.json().catch(() => ({}));
      if (response.ok) {
        const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join("");
        if (!text) throw new Error("Gemini API returned no text");
        return JSON.parse(text);
      }
      lastError = model + " (" + response.status + "): " + (payload?.error?.message || "unknown error");
    }
    throw new Error("Gemini API failed across fallback models: " + lastError);
  }

  async generateImage(prompt) {
    const data = await this.execute("GEMINI_GENERATE_IMAGE", {
      prompt: latin1SafePrompt(prompt),
      model: this.config.geminiImageModel,
      aspect_ratio: "16:9",
    }, this.config.geminiConnectedAccountId);
    const url = firstHttpUrl(data);
    if (!url) throw new Error("Gemini generated an image but returned no usable image URL");
    return { url, raw: data };
  }

  async searchConsoleQueries() {
    const end = new Date();
    const start = new Date(end.getTime() - 90 * 86_400_000);
    const date = (value) => value.toISOString().slice(0, 10);
    const data = await this.execute("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY", {
      site_url: this.config.searchConsoleSiteUrl,
      start_date: date(start),
      end_date: date(end),
      dimensions: ["query"],
      row_limit: 100,
    }, this.config.searchConsoleConnectedAccountId);
    const rows = data?.rows ?? data?.response?.rows ?? data?.data?.rows ?? [];
    return rows.map((row) => ({
      query: row?.keys?.[0] ?? row?.query ?? "",
      clicks: row?.clicks ?? 0,
      impressions: row?.impressions ?? 0,
      ctr: row?.ctr ?? 0,
      position: row?.position ?? 0,
    })).filter((row) => row.query);
  }

  async appendNewsRow(row) {
    if (row.length !== 30) throw new Error(`News Inbox row must have 30 columns; got ${row.length}`);
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND", {
      spreadsheet_id: this.config.spreadsheetId,
      range: `'${this.config.newsInboxSheetName}'!A:AD`,
      values: [row],
      major_dimension: "ROWS",
      value_input_option: "RAW",
      insert_data_option: "INSERT_ROWS",
    }, this.config.sheetsConnectedAccountId);
  }

  async appendArticleRow(row) {
    if (row.length !== 46) throw new Error(`Article Pipeline row must have 46 columns; got ${row.length}`);
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND", {
      spreadsheet_id: this.config.spreadsheetId,
      range: `'${this.config.articleSheetName}'!A:AT`,
      values: [row],
      major_dimension: "ROWS",
      value_input_option: "RAW",
      insert_data_option: "INSERT_ROWS",
    }, this.config.sheetsConnectedAccountId);
  }

  async articlePipelineRows() {
    const data = await this.execute("GOOGLESHEETS_VALUES_GET", {
      spreadsheet_id: this.config.spreadsheetId,
      range: `'${this.config.articleSheetName}'!A2:AT`,
      major_dimension: "ROWS",
      value_render_option: "FORMATTED_VALUE",
    }, this.config.sheetsConnectedAccountId);
    return data?.values ?? [];
  }

  async updateArticleCell(a1Range, value) {
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_UPDATE", {
      spreadsheet_id: this.config.spreadsheetId,
      range: `'${this.config.articleSheetName}'!${a1Range}`,
      values: [[value]],
      major_dimension: "ROWS",
      value_input_option: "RAW",
    }, this.config.sheetsConnectedAccountId);
  }
}

function firstHttpUrl(value) {
  if (typeof value === "string") {
    const match = value.match(/https?:\/\/[^\s"'<>]+/i);
    return match?.[0] || "";
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      const found = firstHttpUrl(item);
      if (found) return found;
    }
    return "";
  }
  if (value && typeof value === "object") {
    const preferred = ["url", "image_url", "imageUrl", "download_url", "downloadUrl", "file_url", "fileUrl", "uri"];
    for (const key of preferred) {
      if (key in value) {
        const found = firstHttpUrl(value[key]);
        if (found) return found;
      }
    }
    for (const nested of Object.values(value)) {
      const found = firstHttpUrl(nested);
      if (found) return found;
    }
  }
  return "";
}

function latin1SafePrompt(value) {
  return String(value ?? "").replace(/[^\x00-\x7F]/g, " ");
}
function latin1SafeValue(value) {
  if (typeof value === "string") return latin1SafePrompt(value);
  if (Array.isArray(value)) return value.map(latin1SafeValue);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([key, item]) => [latin1SafePrompt(key), latin1SafeValue(item)]));
  }
  return value;
}
