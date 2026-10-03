import test from "node:test";
import assert from "node:assert/strict";
import { ensureImagePackage } from "../src/images.js";

test("every article image carries sources and multilingual keywords", () => {
  const article = {
    slug_en: "ai-for-bim",
    article_title_en: "AI for BIM",
    article_title_fa: "هوش مصنوعی برای بیم",
    article_title_ar: "الذكاء الاصطناعي لنمذجة البناء",
    primary_keyword_en: "AI for BIM",
    primary_keyword_fa: "هوش مصنوعی برای بیم",
    primary_keyword_ar: "الذكاء الاصطناعي لنمذجة البناء",
    sources: [{ name: "Autodesk AEC", url: "https://www.autodesk.com/blogs/aec/" }],
  };
  for (const image of ensureImagePackage(article, 4)) {
    assert.ok(image.credit);
    assert.equal(image.source_name, "Autodesk AEC");
    assert.equal(image.source_url, "https://www.autodesk.com/blogs/aec/");
    assert.ok(image.reference_sources.length);
    assert.ok(image.keywords_en.length);
    assert.ok(image.keywords_fa.length);
    assert.ok(image.keywords_ar.length);
    assert.ok(image.caption);
    assert.ok(image.alt_text_en && image.alt_text_fa && image.alt_text_ar);
  }
});
