import assert from "node:assert/strict";
import test from "node:test";
import { collectKeywordResearch, googleAutocomplete, sitemapUrls } from "../src/keyword-research.js";

test("Google Autocomplete returns bounded localized suggestions", async () => {
  let requested;
  const fetchImpl = async (url) => {
    requested = new URL(url);
    return Response.json(["معماری هوش مصنوعی", Array.from({ length: 12 }, (_, index) => `پیشنهاد ${index}`)]);
  };
  const result = await googleAutocomplete("معماری هوش مصنوعی", "fa", fetchImpl);
  assert.equal(requested.searchParams.get("hl"), "fa");
  assert.equal(requested.searchParams.get("gl"), "ir");
  assert.equal(result.length, 10);
});

test("site sitemap provides only real deduplicated internal URLs", async () => {
  const fetchImpl = async () => new Response("<urlset><url><loc>https://site.test/a</loc></url><url><loc>https://site.test/a</loc></url><url><loc>https://site.test/fa/b</loc></url></urlset>");
  assert.deepEqual(await sitemapUrls("https://site.test/sitemap.xml", fetchImpl), ["https://site.test/a", "https://site.test/fa/b"]);
});

test("keyword research keeps running when Search Console is unavailable", async () => {
  const fetchImpl = async (_url) => Response.json(["seed", ["seed one"]]);
  const client = { searchConsoleQueries: async () => { throw new Error("not connected"); } };
  const result = await collectKeywordResearch({ original_title: "seed" }, { client, config: { searchConsoleEnabled: true }, fetchImpl });
  assert.equal(result.languages.en.autocomplete[0], "seed one");
  assert.equal(result.search_console.error, "not connected");
});
