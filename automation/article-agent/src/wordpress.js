const C = { id: 0, status: 10, titleEn: 12, excerptEn: 16, bodyEn: 17, titleFa: 18, excerptFa: 22, bodyFa: 23, titleAr: 24, excerptAr: 28, bodyAr: 29, image: 33, altFa: 35, sources: 37, approval: 40, draftUrl: 42 };
const isApproved = (value) => ["approved", "approve", "yes", "true", "تایید", "تأیید", "تایید شده", "تأیید شده"].includes(String(value ?? "").trim().toLowerCase());
const escape = (value) => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");

function markdown(value) {
  return String(value ?? "").split(/\n{2,}/).map((x) => x.trim()).filter(Boolean).map((block) => {
    const heading = block.match(/^(#{2,3})\s+(.+)$/s);
    if (heading) return `<h${heading[1].length}>${escape(heading[2].trim())}</h${heading[1].length}>`;
    const lines = block.split("\n");
    if (lines.every((x) => /^[-*]\s+/.test(x))) return `<ul>${lines.map((x) => `<li>${escape(x.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    if (lines.every((x) => /^\d+\.\s+/.test(x))) return `<ol>${lines.map((x) => `<li>${escape(x.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
    return `<p>${escape(block).replaceAll("\n", "<br>")}</p>`;
  }).join("\n");
}

export function approvedRows(rows) { return rows.map((row, i) => ({ row, sheetRow: i + 2 })).filter(({ row }) => isApproved(row[C.approval]) && !String(row[C.draftUrl] || "").trim()); }
export function draftPayload(row) {
  const sources = String(row[C.sources] || "").trim();
  return {
    title: row[C.titleFa] || row[C.titleEn] || row[C.titleAr] || row[C.id], status: "draft",
    excerpt: row[C.excerptFa] || row[C.excerptEn] || row[C.excerptAr] || "",
    content: [`<section lang="fa" dir="rtl"><h1>${escape(row[C.titleFa])}</h1>${markdown(row[C.bodyFa])}</section>`, `<hr><section lang="en" dir="ltr"><h2>${escape(row[C.titleEn])}</h2>${markdown(row[C.bodyEn])}</section>`, `<hr><section lang="ar" dir="rtl"><h2>${escape(row[C.titleAr])}</h2>${markdown(row[C.bodyAr])}</section>`, sources ? `<h2>Sources</h2><p>${escape(sources)}</p>` : ""].join("\n"),
  };
}

export class WordPressDraftClient {
  constructor(config, fetchImpl = fetch) { this.config = config; this.fetch = fetchImpl; }
  async createDraft(row) {
    const auth = Buffer.from(`${this.config.wordpressUsername}:${this.config.wordpressAppPassword}`).toString("base64");
    const imageUrl = String(row[C.image] || "").trim();
    let mediaId = 0;
    if (imageUrl) mediaId = await this.upload(imageUrl, row[C.altFa], auth);
    else if (this.config.requireImages) throw new Error("Approved article has no featured image");
    const payload = draftPayload(row); if (mediaId) payload.featured_media = mediaId;
    const response = await this.fetch(`${this.config.wordpressUrl}/wp-json/wp/v2/posts`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!response.ok) throw new Error(`WordPress draft failed (${response.status}): ${await response.text()}`);
    const post = await response.json();
    return { id: post.id, editUrl: `${this.config.wordpressUrl}/wp-admin/post.php?post=${post.id}&action=edit` };
  }
  async upload(url, alt, auth) {
    const source = await this.fetch(url); if (!source.ok) throw new Error(`Image download failed (${source.status})`);
    const type = source.headers.get("content-type")?.split(";")[0] || "image/png";
    const response = await this.fetch(`${this.config.wordpressUrl}/wp-json/wp/v2/media`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": type, "Content-Disposition": 'attachment; filename="fourth-dimension-article-image.png"' }, body: Buffer.from(await source.arrayBuffer()) });
    if (!response.ok) throw new Error(`WordPress media upload failed (${response.status}): ${await response.text()}`);
    const media = await response.json();
    if (alt) await this.fetch(`${this.config.wordpressUrl}/wp-json/wp/v2/media/${media.id}`, { method: "POST", headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" }, body: JSON.stringify({ alt_text: String(alt) }) });
    return media.id;
  }
}
