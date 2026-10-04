import assert from "node:assert/strict";
import test from "node:test";
import { createApprovedDrafts, eligibleApprovedRows, wordpressDraft } from "../src/wordpress.js";

function row(overrides = {}) {
  const value = Array(46).fill("");
  value[0] = "NEWS-1";
  value[10] = "Waiting Approval";
  value[12] = "English title";
  value[17] = "English body";
  value[18] = "عنوان فارسی";
  value[22] = "خلاصه فارسی";
  value[23] = "متن فارسی";
  value[24] = "عنوان عربي";
  value[29] = "نص عربي";
  value[40] = "Approved";
  for (const [index, item] of Object.entries(overrides)) value[Number(index)] = item;
  return value;
}

test("only approved rows without a WordPress URL are eligible", () => {
  const rows = [row(), row({ 40: "Pending" }), row({ 42: "https://example.test/edit" })];
  assert.deepEqual(eligibleApprovedRows(rows).map((x) => x.sheetRow), [2]);
});

test("WordPress payload is always a draft and contains all three languages", () => {
  const payload = wordpressDraft(row());
  assert.equal(payload.status, "draft");
  assert.match(payload.content, /lang="fa"/);
  assert.match(payload.content, /lang="en"/);
  assert.match(payload.content, /lang="ar"/);
});

test("WordPress uploads the image and sets it as featured media", async () => {
  const requests = [];
  const fetchImpl = async (url, options = {}) => {
    requests.push({ url, options });
    if (url === "https://images.test/cover.png") return new Response(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"), { status: 200, headers: { "content-type": "image/png" } });
    if (url.endsWith("/wp-json/wp/v2/media")) return Response.json({ id: 91, source_url: "https://site.test/media/cover.webp" });
    if (url.endsWith("/wp-json/wp/v2/media/91")) return Response.json({ id: 91 });
    return Response.json({ id: 17 });
  };
  const value = row({ 33: "https://images.test/cover.png", 35: "متن جایگزین" });
  const wordpress = new (await import("../src/wordpress.js")).WordPressDraftClient({
    wordpressUrl: "https://site.test", wordpressUsername: "u", wordpressAppPassword: "p", requireImage: true,
  }, fetchImpl);
  const result = await wordpress.createDraft(value);
  assert.equal(result.id, 17);
  const postPayload = JSON.parse(requests.at(-1).options.body);
  assert.equal(postPayload.status, "draft");
  assert.equal(postPayload.featured_media, 91);
  assert.equal(JSON.parse(requests[2].options.body).alt_text, "متن جایگزین");
  assert.equal(requests[1].options.headers["Content-Type"], "image/webp");
  assert.match(postPayload.content, /NewsArticle/);
});

test("news output is independent, searchable and standards-complete", () => {
  const payload = wordpressDraft(row({ 3: "Official Source", 4: "https://source.test/news", 5: "2026-10-04", 7: "AI", 17: "## Verified facts\n\nNews body", 30: "AI | agents", 31: "News | Automation", 37: JSON.stringify([{ name: "Official Source", url: "https://source.test/news" }]), 38: JSON.stringify({ primary_source_url: "https://source.test/news" }) }), { postUrl: "https://site.test/news-item", images: [{ url: "https://site.test/cover.webp", role: "featured" }, { url: "https://site.test/context.webp", caption: "Context", credit: "Fourth Dimension Studio", ai_generated: true, alt_text_fa: "تصویر خبری" }] });
  assert.match(payload.content, /NewsArticle/);
  assert.match(payload.content, /Original source/);
  assert.match(payload.content, /fd-toc/);
  assert.match(payload.content, /loading="lazy"/);
  assert.match(payload.content, /AI-generated/);
  assert.match(payload.content, /hreflang="fa"/);
  assert.match(payload.content, /fd-share/);
});

test("created drafts update status and edit URL in the sheet", async () => {
  const updates = [];
  const client = {
    pipelineRows: async () => [row()],
    updateCell: async (...args) => updates.push(args),
  };
  const wordpress = { createDraft: async () => ({ id: 15, editUrl: "https://example.test/wp-admin/post.php?post=15&action=edit" }) };
  const result = await createApprovedDrafts({ config: { wordpressEnabled: true }, client, wordpress, logger: { info() {} } });
  assert.equal(result.created, 1);
  assert.deepEqual(updates, [["K2", "Ready for Publishing"], ["AQ2", "https://example.test/wp-admin/post.php?post=15&action=edit"]]);
});
