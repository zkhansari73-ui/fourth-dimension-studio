import assert from "node:assert/strict";
import test from "node:test";
import { normalizeSitemap } from "../src/sources.js";

test("sitemap sources keep dated matching news URLs only", () => {
  const parsed = { urlset: { url: [
    { loc: "https://example.test/news/new-model", lastmod: "2026-09-29" },
    { loc: "https://example.test/about", lastmod: "2026-09-29" },
    { loc: "https://example.test/news/no-date" },
  ] } };
  const items = normalizeSitemap(parsed, { name: "Official", category: "AI", tier: 1, itemPattern: "/news/" });
  assert.equal(items.length, 1);
  assert.equal(items[0].title, "new model");
  assert.equal(items[0].sourceTierHint, 1);
});
