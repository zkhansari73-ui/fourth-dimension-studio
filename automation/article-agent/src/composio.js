import { Composio } from "@composio/core";
import { createHash } from "node:crypto";
import { writeFile, unlink } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

function firstUrl(value) {
  if (typeof value === "string") return value.match(/https?:\/\/[^\s\"'<>]+/i)?.[0] || "";
  if (Array.isArray(value)) { for (const x of value) { const found = firstUrl(x); if (found) return found; } return ""; }
  if (value && typeof value === "object") { for (const x of Object.values(value)) { const found = firstUrl(x); if (found) return found; } }
  return "";
}

function firstFileId(value) {
  if (!value || typeof value !== "object") return "";
  for (const key of ["id", "file_id", "fileId"]) {
    if (typeof value[key] === "string" && value[key]) return value[key];
  }
  for (const nested of Object.values(value)) {
    const found = firstFileId(nested);
    if (found) return found;
  }
  return "";
}

// Composio's Gemini bridge currently serializes tool arguments through a
// latin-1 path. Escape non-ASCII code units so Persian/Arabic prompts reach
// Gemini without the bridge rejecting them; JSON output is still decoded
// normally after the tool returns it.
async function fetchWithRetry(url, options) {
  const { timeoutMs = 45_000, attempts = 2, ...requestOptions } = options;
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const response = await fetch(url, { ...requestOptions, signal: AbortSignal.timeout(timeoutMs) });
      if (![429, 500, 502, 503, 504].includes(response.status) || attempt === attempts) return response;
      lastError = new Error(`Gemini HTTP ${response.status}`);
    } catch (error) {
      lastError = error;
    }
    if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 10_000));
  }
  throw lastError || new Error("Gemini request failed");
}

function parseGeminiJson(value) {
  const text = String(value).replace(/^```json\s*|\s*```$/g, "");
  try {
    return JSON.parse(text);
  } catch (error) {
    const repaired = text.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    if (repaired === text) throw error;
    return JSON.parse(repaired);
  }
}

function asciiSafe(value) {
  return String(value).replace(/[^\x00-\x7F]/g, (char) =>
    `\\u${char.charCodeAt(0).toString(16).padStart(4, "0")}`
  );
}

export class ArticleComposioClient {
  constructor(config) { this.config = config; this.client = new Composio({ apiKey: config.composioApiKey, dangerouslyAllowAutoUploadDownloadFiles: true, fileUploadDirs: [tmpdir()] }); this.versions = new Map(); }
  async execute(slug, args, account = "") {
    let version = this.versions.get(slug);
    if (!version) {
      const tool = await this.client.tools.getRawComposioToolBySlug(slug);
      version = tool?.version;
      if (!version || version === "latest") version = (tool?.availableVersions || []).filter((x) => x && x !== "latest").sort((a, b) => String(b).localeCompare(String(a)))[0];
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
    if (this.config.geminiApiKey) {
      const configuredModel = String(this.config.geminiModel).replace(/^models\//, "");
      const models = [...new Set([configuredModel, "gemini-3.6-flash", "gemini-3.5-flash-lite"])];
      let lastError = "unknown error";
      for (const model of models) {
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.config.geminiApiKey)}`;
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          let response;
          try {
            response = await fetchWithRetry(endpoint, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.25 } }) });
          } catch (error) {
            lastError = `${model}: ${error?.message || error}`;
            break;
          }
          const payload = await response.json().catch(() => ({}));
          if (response.ok) { const text = payload?.candidates?.[0]?.content?.parts?.map((part) => part?.text || "").join(""); if (!text) throw new Error("Gemini API returned no text"); return parseGeminiJson(text); }
          lastError = `${model} (${response.status}): ${payload?.error?.message || "unknown error"}`;
          if (![429, 503].includes(response.status)) break;
          if (attempt < 2) await new Promise((resolve) => setTimeout(resolve, 10_000));
        }
      }
      console.warn(`Direct Gemini API unavailable; falling back to connected Composio Gemini: ${lastError}`);
    }
    const transportPrompt = `${prompt}\nTRANSPORT REQUIREMENT: First create the requested JSON internally. Then UTF-8 encode that complete JSON and return ONLY its standard Base64 representation. The response must contain Base64 characters only (A-Z, a-z, 0-9, +, /, and optional = padding), with no markdown fence, prose, whitespace, or literal JSON. This is mandatory because the transport accepts ASCII only.`;
    const data = await this.execute("GEMINI_GENERATE_CONTENT", { prompt: asciiSafe(transportPrompt), model: this.config.geminiModel }, this.config.geminiConnectedAccountId);
    const text = data?.text ?? data?.response ?? data?.result ?? data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error("Gemini returned no text");
    const encoded = String(text).replace(/^```(?:base64)?\s*|\s*```$/gi, "").replace(/\s+/g, "");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) throw new Error("Gemini returned a non-Base64 transport payload");
    return parseGeminiJson(Buffer.from(encoded, "base64").toString("utf8"));
  }
  async uploadImageBuffer(prompt, imageBuffer, extension = "jpg") {
    const digest = createHash("sha256").update(String(prompt)).digest("hex").slice(0, 16);
    const filePath = join(tmpdir(), `fourth-dimension-${digest}.${extension}`);
    await writeFile(filePath, imageBuffer);
    try {
      const uploaded = await this.execute("GOOGLEDRIVE_UPLOAD_FILE", { file_to_upload: filePath }, this.config.driveConnectedAccountId || process.env.GOOGLE_DRIVE_CONNECTED_ACCOUNT_ID || "");
      const fileId = firstFileId(uploaded);
      const url = firstUrl(uploaded) || (fileId ? `https://drive.google.com/file/d/${fileId}/view` : "");
      if (!url) throw new Error("Google Drive upload returned no usable image URL or file ID");
      return { url };
    } finally {
      await unlink(filePath).catch(() => {});
    }
  }
  async generateCloudflareImage(prompt) {
    if (!this.config.cloudflareImagesEnabled) throw new Error("Cloudflare image fallback is not configured");
    const model = String(this.config.cloudflareImageModel).replace(/^\/+/, "");
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${encodeURIComponent(this.config.cloudflareAccountId)}/ai/run/${model}`;
    const response = await fetchWithRetry(endpoint, {
      method: "POST",
      headers: { authorization: `Bearer ${this.config.cloudflareApiToken}`, "content-type": "application/json" },
      body: JSON.stringify({ prompt: String(prompt).slice(0, 2048), steps: 6 }),
      timeoutMs: 180_000,
      attempts: 2,
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok || payload?.success === false) {
      const message = payload?.errors?.[0]?.message || payload?.error?.message || "unknown error";
      throw new Error(`Cloudflare image API failed (${response.status}): ${message}`);
    }
    const imageData = payload?.result?.image || payload?.image;
    if (!imageData) throw new Error("Cloudflare image API returned no image bytes");
    return this.uploadImageBuffer(prompt, Buffer.from(imageData, "base64"), "jpg");
  }
  async generateImage(prompt) {
    let geminiError;
    if (this.config.geminiApiKey) {
      try {
        const model = String(this.config.geminiImageModel).replace(/^models\//, "");
        const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(this.config.geminiApiKey)}`;
        const response = await fetchWithRetry(endpoint, {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }], generationConfig: { responseModalities: ["IMAGE"] } }),
          timeoutMs: 180_000,
          attempts: 1,
        });
        const payload = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(`Gemini image API failed (${response.status}): ${payload?.error?.message || "unknown error"}`);
        const parts = payload?.candidates?.[0]?.content?.parts || [];
        const imagePart = parts.find((part) => part?.inlineData?.data || part?.inline_data?.data);
        const imageData = imagePart?.inlineData?.data || imagePart?.inline_data?.data;
        const mimeType = imagePart?.inlineData?.mimeType || imagePart?.inline_data?.mime_type || "image/png";
        if (!imageData) throw new Error("Gemini image API returned no image bytes");
        const extension = mimeType.includes("jpeg") ? "jpg" : mimeType.includes("webp") ? "webp" : "png";
        return this.uploadImageBuffer(prompt, Buffer.from(imageData, "base64"), extension);
      } catch (error) {
        geminiError = error;
      }
    }
    if (this.config.cloudflareImagesEnabled) {
      if (geminiError) console.warn(`${geminiError.message}; using Cloudflare Workers AI fallback.`);
      return this.generateCloudflareImage(prompt);
    }
    if (geminiError) throw geminiError;
    const data = await this.execute("GEMINI_GENERATE_IMAGE", { prompt: asciiSafe(prompt), model: this.config.geminiImageModel, aspect_ratio: "16:9" }, this.config.geminiConnectedAccountId);
    const url = firstUrl(data); if (!url) throw new Error("Gemini returned no usable image URL"); return { url };
  }
  async existingArticleUrls() {
    const data = await this.execute("GOOGLESHEETS_VALUES_GET", { spreadsheet_id: this.config.spreadsheetId, range: `'${this.config.articleSheetName}'!E2:E`, major_dimension: "ROWS", value_render_option: "FORMATTED_VALUE" }, this.config.sheetsConnectedAccountId);
    return new Set((data?.values || []).flat().filter(Boolean));
  }
  async appendArticle(row) {
    if (row.length !== 46) throw new Error(`Article Pipeline row must have 46 columns; got ${row.length}`);
    const normalizedRow = row.map((value) => {
      if (value === null || value === undefined) return "";
      if (["string", "number", "boolean"].includes(typeof value)) return value;
      return JSON.stringify(value);
    });
    return this.execute("GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND", { spreadsheet_id: this.config.spreadsheetId, range: `'${this.config.articleSheetName}'!A:AT`, values: [normalizedRow], major_dimension: "ROWS", value_input_option: "RAW", insert_data_option: "INSERT_ROWS" }, this.config.sheetsConnectedAccountId);
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
