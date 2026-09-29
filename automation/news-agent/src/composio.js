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
    const range = `'${this.config.sheetName}'!E2:E`;
    const data = await this.execute("GOOGLESHEETS_VALUES_GET", {
      spreadsheet_id: this.config.spreadsheetId,
      range,
      major_dimension: "ROWS",
      value_render_option: "FORMATTED_VALUE",
    }, this.config.sheetsConnectedAccountId);
    return new Set((data?.values ?? []).flat().filter(Boolean));
  }

  async geminiJson(prompt) {
    const data = await this.execute("GEMINI_GENERATE_CONTENT", {
      prompt,
      model: this.config.geminiModel,
    }, this.config.geminiConnectedAccountId);
    const text = data?.text ?? data?.response ?? data?.result ?? data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no text");
    return JSON.parse(text.replace(/^```json\s*|\s*```$/g, ""));
  }

  async generateImage(prompt) {
    const data = await this.execute("GEMINI_GENERATE_IMAGE", {
      prompt,
      model: this.config.geminiImageModel,
      aspect_ratio: "16:9",
    }, this.config.geminiConnectedAccountId);
    const url = firstHttpUrl(data);
    if (!url) throw new Error("Gemini generated an image but returned no usable image URL");
    return { url, raw: data };
  }

  async appendRow(row) {
    if (row.length !== 46) throw new Error(`News Pipeline row must have 46 columns; got ${row.length}`);
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND", {
      spreadsheet_id: this.config.spreadsheetId,
      range: `'${this.config.sheetName}'!A:AT`,
      values: [row],
      major_dimension: "ROWS",
      value_input_option: "RAW",
      insert_data_option: "INSERT_ROWS",
    }, this.config.sheetsConnectedAccountId);
  }

  async pipelineRows() {
    const data = await this.execute("GOOGLESHEETS_VALUES_GET", {
      spreadsheet_id: this.config.spreadsheetId,
      range: `'${this.config.sheetName}'!A2:AT`,
      major_dimension: "ROWS",
      value_render_option: "FORMATTED_VALUE",
    }, this.config.sheetsConnectedAccountId);
    return data?.values ?? [];
  }

  async updateCell(a1Range, value) {
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_UPDATE", {
      spreadsheet_id: this.config.spreadsheetId,
      range: `'${this.config.sheetName}'!${a1Range}`,
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

