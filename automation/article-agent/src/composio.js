import { Composio } from "@composio/core";

function firstUrl(value) {
  if (typeof value === "string") return value.match(/https?:\/\/[^\s\"'<>]+/i)?.[0] || "";
  if (Array.isArray(value)) { for (const x of value) { const found = firstUrl(x); if (found) return found; } return ""; }
  if (value && typeof value === "object") { for (const x of Object.values(value)) { const found = firstUrl(x); if (found) return found; } }
  return "";
}// Escape non-ASCII code units because Composio's Gemini bridge serializes tool arguments through a latin-1 path.
function asciiSafe(value) {
  return String(value).replace(/[^\x00-\x7F]/g, (char) =>
    `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}



export class ArticleComposioClient {
  constructor(config) { this.config = config; this.client = new Composio({ apiKey: config.composioApiKey }); this.versions = new Map(); }
  async execute(slug, args, account = "") {
    let version = this.versions.get(slug);
    if (!version) {
      const tool = await this.client.tools.getRawComposioToolBySlug(slug);
      version = tool?.version;
      if (!version || version === "latest") version = (tool?.availableVersions || []).find((x) => x && x !== "latest");
      if (!version) throw new Error(`No pinned Composio version for ${slug}`);
      this.versions.set(slug, version);
    }
    const request = { userId: this.config.composioUserId, arguments: args, version };
    if (account) request.connectedAccountId = account;
    const result = await this.client.tools.execute(slug, request);
    if (result?.error) throw new Error(result.error?.message || String(result.error));
    return result?.data ?? result;
  }
  async geminiJson(prompt) {
    const data = await this.execute("GEMINI_GENERATE_CONTENT", { prompt: asciiSafe(prompt), model: this.config.geminiModel }, this.config.geminiConnectedAccountId);
    const text = data?.text ?? data?.response ?? data?.result ?? data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no text");
    return JSON.parse(String(text).replace(/^```json\s*|\s*```$/g, ""));
  }
  async generateImage(prompt) {
    const data = await this.execute("GEMINI_GENERATE_IMAGE", { prompt, model: this.config.geminiImageModel, aspect_ratio: "16:9" }, this.config.geminiConnectedAccountId);
    const url = firstUrl(data); if (!url) throw new Error("Gemini returned no usable image URL"); return { url };
  }
  async existingArticleUrls() {
    const data = await this.execute("GOOGLESHEETS_VALUES_GET", { spreadsheet_id: this.config.spreadsheetId, range: `'${this.config.articleSheetName}'!E2:E`, major_dimension: "ROWS", value_render_option: "FORMATTED_VALUE" }, this.config.sheetsConnectedAccountId);
    return new Set((data?.values || []).flat().filter(Boolean));
  }
  async appendArticle(row) {
    if (row.length !== 46) throw new Error(`Article Pipeline row must have 46 columns; got ${row.length}`);
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND", { spreadsheet_id: this.config.spreadsheetId, range: `'${this.config.articleSheetName}'!A:AT`, values: [row], major_dimension: "ROWS", value_input_option: "RAW", insert_data_option: "INSERT_ROWS" }, this.config.sheetsConnectedAccountId);
  }
  async articleRows() {
    const data = await this.execute("GOOGLESHEETS_VALUES_GET", { spreadsheet_id: this.config.spreadsheetId, range: `'${this.config.articleSheetName}'!A2:AT`, major_dimension: "ROWS", value_render_option: "FORMATTED_VALUE" }, this.config.sheetsConnectedAccountId);
    return data?.values || [];
  }
  async updateCell(range, value) {
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_UPDATE", { spreadsheet_id: this.config.spreadsheetId, range: `'${this.config.articleSheetName}'!${range}`, values: [[value]], major_dimension: "ROWS", value_input_option: "RAW" }, this.config.sheetsConnectedAccountId);
  }
  async searchConsoleQueries() {
    const end = new Date(), start = new Date(end.getTime() - 90 * 86_400_000), date = (x) => x.toISOString().slice(0, 10);
    const data = await this.execute("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY", { site_url: this.config.searchConsoleSiteUrl, start_date: date(start), end_date: date(end), dimensions: ["query"], row_limit: 100 }, this.config.searchConsoleConnectedAccountId);
    return (data?.rows ?? data?.response?.rows ?? data?.data?.rows ?? []).map((row) => ({ query: row?.keys?.[0] || row?.query || "", clicks: row?.clicks || 0, impressions: row?.impressions || 0, ctr: row?.ctr || 0, position: row?.position || 0 })).filter((x) => x.query);
  }
}
