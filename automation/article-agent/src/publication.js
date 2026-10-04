const LANGS = ["fa", "en", "ar"];

export function escapeHtml(value) {
  return String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

export function safeJson(value, fallback = {}) {
  try { return JSON.parse(String(value || "")); } catch { return fallback; }
}

function words(value) { return String(value || "").trim().split(/\s+/u).filter(Boolean).length; }
export function readingMinutes(value) { return Math.max(1, Math.ceil(words(value) / 220)); }

function slug(value) {
  return String(value || "section").toLowerCase().trim().replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "").slice(0, 80) || "section";
}

export function markdownToHtml(value) {
  const toc = [];
  const blocks = String(value ?? "").split(/\n{2,}/).map((part) => part.trim()).filter(Boolean);
  const html = blocks.map((part) => {
    const heading = part.match(/^(#{2,3})\s+(.+)$/s);
    if (heading) {
      const level = heading[1].length;
      const text = heading[2].trim();
      const id = slug(text);
      toc.push({ level, text, id });
      return `<h${level} id="${escapeHtml(id)}">${escapeHtml(text)}</h${level}>`;
    }
    const lines = part.split("\n");
    if (lines.every((line) => /^[-*]\s+/.test(line))) return `<ul>${lines.map((line) => `<li>${escapeHtml(line.replace(/^[-*]\s+/, ""))}</li>`).join("")}</ul>`;
    if (lines.every((line) => /^\d+\.\s+/.test(line))) return `<ol>${lines.map((line) => `<li>${escapeHtml(line.replace(/^\d+\.\s+/, ""))}</li>`).join("")}</ol>`;
    return `<p>${escapeHtml(part).replaceAll("\n", "<br>")}</p>`;
  }).join("\n");
  return { html, toc };
}

function tocHtml(items, lang) {
  if (!items.length) return "";
  const label = { fa: "فهرست مطالب", en: "Table of contents", ar: "جدول المحتويات" }[lang];
  return `<nav class="fd-toc" aria-label="${label}"><strong>${label}</strong><ol>${items.map((item) => `<li class="level-${item.level}"><a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a></li>`).join("")}</ol></nav>`;
}

function sourceList(sources) {
  const rows = Array.isArray(sources) ? sources : [];
  return rows.map((item) => {
    const source = typeof item === "string" ? { name: item, url: "" } : item || {};
    const label = source.name || source.title || source.source || source.url || "Source";
    return source.url ? `<li><a href="${escapeHtml(source.url)}" rel="nofollow noopener" target="_blank">${escapeHtml(label)}</a></li>` : `<li>${escapeHtml(label)}</li>`;
  }).join("");
}

function figures(images, lang) {
  return images.map((image) => {
    const alt = image[`alt_text_${lang}`] || image.alt || "";
    const caption = typeof image.caption === "object" ? image.caption[lang] : image.caption;
    const disclosure = image.ai_generated ? "AI-generated" : image.ai_assisted ? "AI-assisted" : "";
    const credit = [image.credit, image.source_name, disclosure].filter(Boolean).join(" · ");
    return `<figure class="fd-inline-image"><img src="${escapeHtml(image.url)}" width="1280" height="720" loading="lazy" decoding="async" alt="${escapeHtml(alt)}"><figcaption>${escapeHtml(caption || "")}${credit ? `<small>${escapeHtml(credit)}</small>` : ""}</figcaption></figure>`;
  }).join("\n");
}

function schemaFor({ kind, title, excerpt, postUrl, imageUrl, published, modified, author, keywords, originalSource, originalUrl }) {
  const schema = {
    "@context": "https://schema.org", "@type": kind === "news" ? "NewsArticle" : "Article",
    headline: title, description: excerpt, mainEntityOfPage: postUrl, datePublished: published, dateModified: modified,
    author: { "@type": "Organization", name: author }, publisher: { "@type": "Organization", name: "Fourth Dimension Studio" },
    image: imageUrl ? [imageUrl] : [], keywords,
  };
  if (kind === "news" && originalUrl) schema.isBasedOn = { "@type": "CreativeWork", name: originalSource, url: originalUrl };
  return schema;
}

export function publicationHtml(data) {
  const { kind, postUrl, author, published, modified, category, tags, keywords, sources, originalSource, originalUrl, originalDate, images = [] } = data;
  const languageLinks = LANGS.map((lang) => `<a href="${escapeHtml(postUrl)}?lang=${lang}" hreflang="${lang}">${lang.toUpperCase()}</a>`).join("");
  const sections = LANGS.map((lang) => {
    const copy = data.languages[lang];
    const rendered = markdownToHtml(copy.body);
    const schema = schemaFor({ kind, title: copy.title, excerpt: copy.excerpt, postUrl: `${postUrl}?lang=${lang}`, imageUrl: images[0]?.url, published, modified, author, keywords, originalSource, originalUrl });
    const sourceTitle = { fa: "منابع", en: "Sources", ar: "المصادر" }[lang];
    const relatedTitle = { fa: "مطالب مرتبط", en: "Related content", ar: "محتوى مرتبط" }[lang];
    const shareTitle = { fa: "اشتراک‌گذاری", en: "Share", ar: "مشاركة" }[lang];
    const metadata = kind === "news" ? `<div class="fd-original-source"><strong>${escapeHtml(originalSource)}</strong> · <time>${escapeHtml(originalDate)}</time> · <a href="${escapeHtml(originalUrl)}" rel="nofollow noopener" target="_blank">${lang === "en" ? "Original source" : lang === "ar" ? "المصدر الأصلي" : "منبع اصلی"}</a></div>` : "";
    return `<article class="fd-publication fd-lang-${lang}" lang="${lang}" dir="${lang === "en" ? "ltr" : "rtl"}" data-lang="${lang}">
      <header><p class="fd-kind">${kind === "news" ? "NEWS" : "ARTICLE"} · ${escapeHtml(category)}</p><h1>${escapeHtml(copy.title)}</h1><p class="fd-excerpt">${escapeHtml(copy.excerpt)}</p><div class="fd-byline"><span>${escapeHtml(author)}</span><time datetime="${escapeHtml(published)}">${escapeHtml(published)}</time><span>${readingMinutes(copy.body)} min</span></div>${metadata}<div class="fd-taxonomy">${tags.map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div></header>
      ${tocHtml(rendered.toc, lang)}<div class="fd-body">${rendered.html}</div>${figures(images.slice(1), lang)}
      <section class="fd-sources"><h2>${sourceTitle}</h2><ol>${sourceList(sources)}</ol></section>
      <section class="fd-related"><h2>${relatedTitle}</h2><a href="/wp-content/themes/fourth-dimension-theme/site/${kind === "news" ? "news" : "articles"}/?lang=${lang}">${relatedTitle}</a></section>
      <nav class="fd-share" aria-label="${shareTitle}"><strong>${shareTitle}</strong><a href="https://t.me/share/url?url=${encodeURIComponent(postUrl)}&text=${encodeURIComponent(copy.title)}" target="_blank" rel="noopener">Telegram</a><a href="https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}" target="_blank" rel="noopener">LinkedIn</a></nav>
      <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>
    </article>`;
  }).join("\n");
  const alternates = LANGS.map((lang) => `<link rel="alternate" hreflang="${lang}" href="${escapeHtml(postUrl)}?lang=${lang}">`).join("") + `<link rel="alternate" hreflang="x-default" href="${escapeHtml(postUrl)}?lang=en">`;
  const seo = Object.fromEntries(LANGS.map((lang) => [lang, { title: data.languages[lang].title, description: data.languages[lang].excerpt, canonical: `${postUrl}?lang=${lang}` }]));
  const seoJson = JSON.stringify(seo).replace(/</g, "\\u003c");
  return `<div class="fd-language-switcher">${languageLinks}</div>${alternates}${sections}<script>(function(){var l=new URLSearchParams(location.search).get('lang');if(!/^(fa|en|ar)$/.test(l))l='fa';var seo=${seoJson}[l];document.documentElement.lang=l;document.documentElement.dir=l==='en'?'ltr':'rtl';document.title=seo.title+' | Fourth Dimension Studio';var m=document.querySelector('meta[name="description"]');if(!m){m=document.createElement('meta');m.name='description';document.head.appendChild(m)}m.content=seo.description;var c=document.querySelector('link[rel="canonical"]');if(!c){c=document.createElement('link');c.rel='canonical';document.head.appendChild(c)}c.href=seo.canonical;document.querySelectorAll('.fd-publication').forEach(function(x){x.hidden=x.dataset.lang!==l});document.querySelectorAll('.fd-language-switcher a').forEach(function(a){a.setAttribute('aria-current',a.hreflang===l?'page':'false')});})();</script>`;
}
