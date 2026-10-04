import sharp from "sharp";
import { publicationHtml, safeJson } from "./publication.js";

const COL = Object.freeze({ itemId: 0, created: 1, originalSource: 3, originalUrl: 4, originalDate: 5, category: 7, titleEn: 12, slugEn: 14, excerptEn: 16, bodyEn: 17, titleFa: 18, slugFa: 20, excerptFa: 22, bodyFa: 23, titleAr: 24, slugAr: 26, excerptAr: 28, bodyAr: 29, keywords: 30, tags: 31, featuredImageUrl: 33, altEn: 34, altFa: 35, altAr: 36, sources: 37, audit: 38, approval: 40, wordpressDraftUrl: 42, updated: 43 });

function approved(value) { return ["approved", "approve", "yes", "true", "تایید", "تأیید", "تایید شده", "تأیید شده"].includes(String(value ?? "").trim().toLowerCase()); }
function list(value) { return String(value || "").split(/\s*\|\s*|\s*,\s*/).filter(Boolean); }
function firstSlug(row) { return row[COL.slugFa] || row[COL.slugEn] || row[COL.slugAr] || row[COL.itemId]; }

export function approvedRows(rows) { return rows.map((row, index) => ({ row, sheetRow: index + 2 })).filter(({ row }) => approved(row[COL.approval]) && !String(row[COL.wordpressDraftUrl] ?? "").trim()); }

export function draftPayload(row, { postUrl = "https://example.invalid/pending", images = [], author = "Fourth Dimension Studio Editorial Team" } = {}) {
  const audit = safeJson(row[COL.audit], {});
  const content = publicationHtml({
    kind: "article", postUrl, author, published: row[COL.created], modified: row[COL.updated] || row[COL.created], category: row[COL.category] || "Articles",
    tags: list(row[COL.tags]), keywords: list(row[COL.keywords]), sources: safeJson(row[COL.sources], []), originalSource: row[COL.originalSource], originalUrl: audit.primary_source_url || row[COL.originalUrl], originalDate: row[COL.originalDate], images,
    languages: { en: { title: row[COL.titleEn], excerpt: row[COL.excerptEn], body: row[COL.bodyEn] }, fa: { title: row[COL.titleFa], excerpt: row[COL.excerptFa], body: row[COL.bodyFa] }, ar: { title: row[COL.titleAr], excerpt: row[COL.excerptAr], body: row[COL.bodyAr] } },
  });
  return { title: row[COL.titleFa] || row[COL.titleEn] || row[COL.titleAr] || row[COL.itemId], slug: firstSlug(row), content, excerpt: row[COL.excerptFa] || row[COL.excerptEn] || row[COL.excerptAr] || "", status: "draft" };
}

export class WordPressDraftClient {
  constructor(config, fetchImpl = fetch) { this.config = config; this.fetch = fetchImpl; }
  auth() { return Buffer.from(`${this.config.wordpressUsername}:${this.config.wordpressAppPassword}`).toString("base64"); }
  async createDraft(row) {
    const auth = this.auth();
    const audit = safeJson(row[COL.audit], {});
    const specs = Array.isArray(audit.image_assets) ? [...audit.image_assets] : [];
    if (!specs.length && row[COL.featuredImageUrl]) specs.push({ url: row[COL.featuredImageUrl], role: "featured", alt_text_en: row[COL.altEn], alt_text_fa: row[COL.altFa], alt_text_ar: row[COL.altAr], caption: row[COL.titleFa], ai_generated: true });
    if (this.config.requireImages && !specs.length) throw new Error("Approved article has no image package");
    const uploaded = [];
    for (let i = 0; i < specs.length; i += 1) uploaded.push(await this.uploadWebp(specs[i], auth, `${firstSlug(row)}-${specs[i].role || i}.webp`));
    const provisional = draftPayload(row, { images: uploaded, author: this.config.editorialAuthor || "Fourth Dimension Studio Editorial Team" });
    if (uploaded[0]?.id) provisional.featured_media = uploaded[0].id;
    const created = await this.requestJson(`${this.config.wordpressUrl}/wp-json/wp/v2/posts`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify(provisional) }, "WordPress draft creation");
    const postUrl = created.link || `${this.config.wordpressUrl}/?p=${created.id}`;
    const finalPayload = draftPayload(row, { postUrl, images: uploaded, author: this.config.editorialAuthor || "Fourth Dimension Studio Editorial Team" });
    if (uploaded[0]?.id) finalPayload.featured_media = uploaded[0].id;
    await this.requestJson(`${this.config.wordpressUrl}/wp-json/wp/v2/posts/${created.id}`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify(finalPayload) }, "WordPress final metadata update");
    return { id: created.id, editUrl: `${this.config.wordpressUrl}/wp-admin/post.php?post=${created.id}&action=edit`, previewUrl: postUrl };
  }
  async uploadWebp(spec, auth, filename) {
    const source = await this.fetch(spec.url);
    if (!source.ok) throw new Error(`Image download failed (${source.status})`);
    const webp = await sharp(Buffer.from(await source.arrayBuffer())).rotate().resize({ width: 1600, withoutEnlargement: true }).webp({ quality: 82, effort: 4 }).toBuffer();
    const media = await this.requestJson(`${this.config.wordpressUrl}/wp-json/wp/v2/media`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "image/webp", "Content-Disposition": `attachment; filename="${filename.replace(/[^a-z0-9._-]/gi, "-")}"` }, body: webp }, "WordPress image upload");
    const alt = spec.alt_text_fa || spec.alt_text_en || spec.alt_text_ar || "";
    const caption = [typeof spec.caption === "string" ? spec.caption : "", spec.credit, spec.source_name, spec.ai_generated ? "AI-generated" : spec.ai_assisted ? "AI-assisted" : ""].filter(Boolean).join(" · ");
    await this.requestJson(`${this.config.wordpressUrl}/wp-json/wp/v2/media/${media.id}`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify({ alt_text: alt, caption, description: JSON.stringify({ source_name: spec.source_name || "", source_url: spec.source_url || "", licence: spec.licence || spec.license || "studio-generated", ai_generated: Boolean(spec.ai_generated), ai_assisted: Boolean(spec.ai_assisted), keywords_en: spec.keywords_en || [], keywords_fa: spec.keywords_fa || [], keywords_ar: spec.keywords_ar || [] }) }) }, "WordPress image metadata update");
    return { ...spec, id: media.id, url: media.source_url || media.guid?.rendered || spec.url, alt };
  }
  async requestJson(url, options, label) { const response = await this.fetch(url, options); if (!response.ok) throw new Error(`${label} failed (${response.status}): ${await response.text()}`); return response.json(); }
}

export async function createApprovedDrafts({ config, client, wordpress, logger = console }) {
  if (!config.wordpressEnabled) return { enabled: false, created: 0 };
  const candidates = approvedRows(await client.articleRows());
  let created = 0;
  for (const { row, sheetRow } of candidates) { const draft = await wordpress.createDraft(row); await client.updateCell(`K${sheetRow}`, "Ready for Publishing"); await client.updateCell(`AQ${sheetRow}`, draft.editUrl); logger.info("WordPress Article draft created", { itemId: row[COL.itemId], postId: draft.id }); created += 1; }
  return { enabled: true, created };
}
