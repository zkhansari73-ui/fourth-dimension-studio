import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join, normalize, resolve } from "node:path";

const root = resolve(import.meta.dirname, "../dist");
const pages = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) walk(path);
    else if (entry.name.endsWith(".html")) pages.push(path);
  }
}
walk(root);

test("every indexable HTML page has one H1 and complete base SEO", () => {
  for (const path of pages) {
    const html = readFileSync(path, "utf8");
    assert.equal((html.match(/<h1\b/gi) || []).length, 1, `${path} must contain exactly one H1`);
    assert.match(html, /<title>[^<]{10,}<\/title>/i, `${path} needs a useful title`);
    assert.match(html, /<meta\s+name=["']description["'][^>]+content=["'][^"']{40,}["']/i, `${path} needs a meta description`);
    assert.match(html, /<link\s+rel=["']canonical["'][^>]+href=["']https:\/\//i, `${path} needs a canonical URL`);
    assert.match(html, /property=["']og:title["']/i, `${path} needs Open Graph title`);
    assert.match(html, /property=["']og:description["']/i, `${path} needs Open Graph description`);
    assert.match(html, /property=["']og:url["']/i, `${path} needs Open Graph URL`);
  }
});

test("internal page links resolve to existing files", () => {
  for (const path of pages) {
    const html = readFileSync(path, "utf8");
    for (const match of html.matchAll(/href=["']([^"']+)["']/gi)) {
      const href = match[1];
      if (/^(?:https?:|mailto:|tel:|#)/i.test(href)) continue;
      const clean = href.split(/[?#]/)[0];
      if (!clean || /\.(?:css|js|png|jpe?g|webp|svg|ico|webmanifest)$/i.test(clean)) continue;
      let target = normalize(join(dirname(path), clean));
      if (clean.endsWith("/")) target = join(target, "index.html");
      assert.ok(existsSync(target), `${path} links to missing ${href}`);
    }
  }
});

test("technical SEO infrastructure and schemas exist", () => {
  const robots = readFileSync(join(root, "robots.txt"), "utf8");
  const sitemap = readFileSync(join(root, "sitemap.xml"), "utf8");
  const home = readFileSync(join(root, "index.html"), "utf8");
  const articlePublisher = readFileSync(resolve(root, "../automation/article-agent/src/publication.js"), "utf8");
  const newsPublisher = readFileSync(resolve(root, "../automation/news-agent/src/publication.js"), "utf8");
  assert.match(robots, /Sitemap:\s+https:\/\//);
  assert.match(sitemap, /<urlset/);
  assert.match(home, /"@type":"Organization"/);
  assert.match(articlePublisher, /"Article"/);
  assert.match(newsPublisher, /"NewsArticle"/);
  assert.match(articlePublisher, /Breadcrumb/);
  assert.match(newsPublisher, /Breadcrumb/);
});

test("installable app uses the transparent 4D brand mark", () => {
  const manifest = JSON.parse(readFileSync(join(root, "manifest.webmanifest"), "utf8"));
  assert.equal(manifest.display, "standalone");
  assert.deepEqual(
    manifest.icons.map((icon) => icon.purpose),
    ["any", "any"],
    "transparent artwork must not be declared as a maskable tile",
  );
  for (const icon of manifest.icons) {
    assert.match(icon.src, /-transparent\.png$/);
    assert.ok(existsSync(join(root, icon.src)), `missing app icon ${icon.src}`);
  }
});

test("mobile experience is touch-safe and performance-aware", () => {
  const home = readFileSync(join(root, "index.html"), "utf8");
  const css = readFileSync(join(root, "styles.css"), "utf8");
  const app = readFileSync(join(root, "app.js"), "utf8");
  const worker = readFileSync(join(root, "sw.js"), "utf8");
  assert.match(home, /preload="metadata"/);
  assert.match(home, /aria-expanded="false"/);
  assert.match(home, /<script src="app\.js" defer>/);
  assert.match(css, /min-height:44px/);
  assert.match(css, /safe-area-inset/);
  assert.match(app, /event\.key!==['"]Escape['"]/);
  assert.match(worker, /request\.mode===['"]navigate['"]/);
  assert.match(worker, /caches\.match\(request\)/);
});
