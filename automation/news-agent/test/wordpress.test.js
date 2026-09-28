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
