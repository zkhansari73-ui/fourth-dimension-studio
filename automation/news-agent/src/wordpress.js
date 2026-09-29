const COL = Object.freeze({
  itemId: 0,
  workflowStatus: 10,
  titleEn: 12,
  excerptEn: 16,
  articleEn: 17,
  titleFa: 18,
  excerptFa: 22,
  articleFa: 23,
  titleAr: 24,
  excerptAr: 28,
  articleAr: 29,
  featuredImageUrl: 33,
  altTextFa: 35,
  sources: 37,
  approval: 40,
  wordpressDraftUrl: 42,
});

function approved(value) {
  return ["approved", "approve", "yes", "true", "تایید", "تأیید", "تایید شده", "تأیید شده"]
    .includes(String(value ?? "").trim().toLowerCase());
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function articleHtml(value) {
  const blocks = String(value ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  return blocks.map((part) => {
    const heading = part.match(/^(#{2,3})\s+(.+)$/s);
    if (heading) {
      const level = heading[1].length;
      return `<h${level}>${escapeHtml(heading[2].trim())}</h${level}>`;
    }
    const lines = part.split("\n");
    if (lines.every((line) => /^[-*]\s+/.test(line))) {
      return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    }
    if (lines.every((line) => /^\d+\.\s+/.test(line))) {
      return `<ol>${lines.map((line) => `<li>${escapeHtml(line.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
    }
    return `<p>${escapeHtml(part).replaceAll("\n", "<br>")}</p>`;
  }).join("\n");
}

export function eligibleApprovedRows(rows) {
  return rows.map((row, index) => ({ row, sheetRow: index + 2 })).filter(({ row }) =>
    approved(row[COL.approval]) && !String(row[COL.wordpressDraftUrl] ?? "").trim()
  );
}

export function wordpressDraft(row) {
  const sources = String(row[COL.sources] ?? "").trim();
  const sourceBlock = sources ? `<h2>Sources</h2><p>${escapeHtml(sources)}</p>` : "";
  const content = [
    `<section lang="fa" dir="rtl"><h1>${escapeHtml(row[COL.titleFa])}</h1>${articleHtml(row[COL.articleFa])}</section>`,
    `<hr><section lang="en" dir="ltr"><h2>${escapeHtml(row[COL.titleEn])}</h2>${articleHtml(row[COL.articleEn])}</section>`,
    `<hr><section lang="ar" dir="rtl"><h2>${escapeHtml(row[COL.titleAr])}</h2>${articleHtml(row[COL.articleAr])}</section>`,
    sourceBlock,
  ].join("\n");
  return {
    title: row[COL.titleFa] || row[COL.titleEn] || row[COL.titleAr] || row[COL.itemId],
    content,
    excerpt: row[COL.excerptFa] || row[COL.excerptEn] || row[COL.excerptAr] || "",
    status: "draft",
  };
}

export class WordPressDraftClient {
  constructor(config, fetchImpl = fetch) {
    this.config = config;
    this.fetch = fetchImpl;
  }

  async createDraft(row) {
    const auth = Buffer.from(`${this.config.wordpressUsername}:${this.config.wordpressAppPassword}`).toString("base64");
    let featuredMediaId = 0;
    const imageUrl = String(row[COL.featuredImageUrl] ?? "").trim();
    if (imageUrl) featuredMediaId = await this.uploadFeaturedImage(imageUrl, row[COL.altTextFa], auth);
    else if (this.config.requireImage) throw new Error("Approved article has no featured image URL");
    const payload = wordpressDraft(row);
    if (featuredMediaId) payload.featured_media = featuredMediaId;
    const response = await this.fetch(`${this.config.wordpressUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) throw new Error(`WordPress draft creation failed (${response.status}): ${await response.text()}`);
    const post = await response.json();
    return { id: post.id, editUrl: `${this.config.wordpressUrl}/wp-admin/post.php?post=${post.id}&action=edit` };
  }

  async uploadFeaturedImage(imageUrl, altText, auth) {
    const source = await this.fetch(imageUrl);
    if (!source.ok) throw new Error(`Featured image download failed (${source.status})`);
    const contentType = source.headers.get("content-type")?.split(";")[0] || "image/png";
    const extension = contentType === "image/jpeg" ? "jpg" : contentType.split("/")[1] || "png";
    const bytes = Buffer.from(await source.arrayBuffer());
    const upload = await this.fetch(`${this.config.wordpressUrl}/wp-json/wp/v2/media`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": contentType,
        "Content-Disposition": `attachment; filename="fourth-dimension-news.${extension}"`,
      },
      body: bytes,
    });
    if (!upload.ok) throw new Error(`WordPress featured image upload failed (${upload.status}): ${await upload.text()}`);
    const media = await upload.json();
    if (!media?.id) throw new Error("WordPress media upload returned no media ID");
    if (altText) {
      const update = await this.fetch(`${this.config.wordpressUrl}/wp-json/wp/v2/media/${media.id}`, {
        method: "POST",
        headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
        body: JSON.stringify({ alt_text: String(altText) }),
      });
      if (!update.ok) throw new Error(`WordPress image alt-text update failed (${update.status}): ${await update.text()}`);
    }
    return media.id;
  }
}

export async function createApprovedDrafts({ config, client, wordpress, logger = console }) {
  if (!config.wordpressEnabled) return { enabled: false, created: 0 };
  const candidates = eligibleApprovedRows(await client.pipelineRows());
  let created = 0;
  for (const { row, sheetRow } of candidates) {
    const draft = await wordpress.createDraft(row);
    await client.updateCell(`K${sheetRow}`, "Ready for Publishing");
    await client.updateCell(`AQ${sheetRow}`, draft.editUrl);
    logger.info("WordPress draft created", { itemId: row[COL.itemId], postId: draft.id });
    created += 1;
  }
  return { enabled: true, created };
}
