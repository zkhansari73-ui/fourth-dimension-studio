import assert from "node:assert/strict";
import test from "node:test";
import { DEFAULT_SOURCES, normalizeSitemap } from "../src/sources.js";

test("new international sources extend the existing list without duplicates", () => {
  const names = DEFAULT_SOURCES.map((source) => source.name);
  for (const expected of [
    "Parametric Architecture",
    "buildingSMART",
    "Speckle",
    "Unreal Engine",
    "NVIDIA",
    "Adobe",
    "Runway",
  ]) assert.ok(names.includes(expected), `${expected} must be configured`);
  assert.equal(new Set(names).size, names.length);
  assert.equal(DEFAULT_SOURCES.length, 23);
});

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
