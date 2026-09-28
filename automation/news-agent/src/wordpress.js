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

function paragraphs(value) {
  return String(value ?? "").split(/\n{2,}/).filter(Boolean)
    .map((part) => `<p>${escapeHtml(part).replaceAll("\n", "<br>")}</p>`).join("\n");
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
    `<section lang="fa" dir="rtl"><h1>${escapeHtml(row[COL.titleFa])}</h1>${paragraphs(row[COL.articleFa])}</section>`,
    `<hr><section lang="en" dir="ltr"><h2>${escapeHtml(row[COL.titleEn])}</h2>${paragraphs(row[COL.articleEn])}</section>`,
    `<hr><section lang="ar" dir="rtl"><h2>${escapeHtml(row[COL.titleAr])}</h2>${paragraphs(row[COL.articleAr])}</section>`,
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
    const response = await this.fetch(`${this.config.wordpressUrl}/wp-json/wp/v2/posts`, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/json" },
      body: JSON.stringify(wordpressDraft(row)),
    });
    if (!response.ok) throw new Error(`WordPress draft creation failed (${response.status}): ${await response.text()}`);
    const post = await response.json();
    return { id: post.id, editUrl: `${this.config.wordpressUrl}/wp-admin/post.php?post=${post.id}&action=edit` };
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
