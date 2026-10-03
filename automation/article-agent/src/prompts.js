const PILLARS = "1) architecture and BIM: architecture, interior/exterior design, Revit, openBIM, computational design, visualization and rendering; 2) AI and content production: generative image/video/3D, prompting, art direction and brand content systems; 3) motion and video: teasers, advertising, animation, logo motion, editing and sound design; 4) web and app design: UI/UX, WordPress, ecommerce, interactive/3D and multilingual experiences; 5) automation and AI agents: connected workflows, Composio, Make, n8n, GitHub, publishing and reporting; 6) editorial and books: research-led articles, digital/interactive books, visual identity, page design and interactive storytelling";

export function trendPrompt(candidates, requestedTopic, today) {
  return `You are the commissioning editor of Fourth Dimension Studio. Today is ${today}. Select exactly one timely, internationally relevant subject for a standalone long-form article. Studio pillars: ${PILLARS}. A subject needs a strong fit with at least one pillar; it does not need to combine AI with architecture.
${requestedTopic ? `The owner requested this direction: ${requestedTopic}. Select the strongest evidence-backed angle within it.` : "No topic was supplied. Choose the strongest candidate from any one of the six pillars. Do not systematically favor architecture or AI; consider source quality, audience value, search intent and recent pillar coverage."}
Prefer primary official sources, meaningful practical impact, strong search intent, durable value, and an angle that allows original expert analysis. Reject gossip, leaks, generic consumer technology, pure promotion, duplicate events, and subjects without verifiable primary evidence. The article is independent from the News Inbox; do not convert or consume any news approval record.
Assign exactly one content_pillar from: architecture_bim, ai_content, motion_video, web_app, automation_agents, editorial_books. Return strict JSON only with: decision (SELECT or REJECT), content_pillar, original_title, original_source, original_url, original_publication_date, primary_source_url, category, source_tier, editorial_angle, why_now, audience_value, search_seed_en, search_seed_fa, search_sed_ar, importance_score_1_to_10, relevance_score_1_to_10, total_score, primary_source_verified (boolean), is_recent (boolean), cluster_id, verified_facts (array of objects with claim and url), claim_verification_notes (array), caveats (array), value_add_opportunity.
Candidates: ${JSON.stringify(candidates)}`;
}

export function articlePrompt(brief, keywordResearch, today) {
  return `Create one original, independent, professional long-form article package for Fourth Dimension Studio. Date: ${today}. This is not a news brief and must not copy or closely paraphhrase any source.

RESEARCH AND EDITORIAL RULES:
- Treat the supplied brief as a starting point, not as sufficient evidence. Use only its verified facts and URLs; clearly distinguish fact, interpretation, and Fourth Dimension Studio analysis.
- Write separate, genuinely localized English, Persian, and Arabic versions. Do not mechanically translate. Each should normally contain 1,500-2,500 useful words; completeness matters more than padding.
- Match the selected content_pillar and serve its real audience: architects/BIM teams; AI creators and art directors; motion/video professionals; web/app and UX teams; automation builders and studio operators; or researchers, editors and digital publishers. Do not force an architecture angle onto another pillar.
- Explain practical workflow impact, limitations, cost/vendor dependence, access uncertainty, privacy/copyright risk, and skills required whenever relevant.
- No invented facts, quotes, statistics, dates, prices, availability, author identity, URLs, or case studies. Cite a supporting URL near every important product, numeric, or capability claim.
- Use short paragraphs, useful comparison tables, numbered steps when appropriate, a clear conclusion, and evidence-based FAQ only when it genuinely helps.

SEO/GEO RULES:
- Pick one specific primary query and 3-5 related queries per language using the supplied autocomplete/Search Console evidence. Do not keyword-stuff.
- The title field is H1. In full_article use Markdown H2/H3 only, without repeating H1. Begin each major section with a concise answer suitable for AI search summaries.
- SEO title target: 50-60 characters. Meta description target: 145-160 characters. Provide an accurate slug, excerpt, tags, internal-link suggestions, reputable external links, and sources.
- Provide Article and BreadcrumbList JSON-LD only from visible facts. FAQPage JSON-LD is allowed only when the same FAQ is present in the article. Never invent an author or author URL.
- Provide self-referencing canonical placeholders and reciprocal hreflang for en, fa, ar and x-default, marked pending until real URLs exist.

IMAGE RULES:
- Return exactly four original AI image specifications: one featured image 1200x630 (about 1.91:1) and three contextual 16:9 images, all at least 1200px wide.
- No text, logos, UI screenshots, copyrighted artwork, copied layouts, or watermarks. Each needs prompt, role, WebP filename, placement_hint, caption, credit, source_name, source_url, reference_sources, localized keyword arrays (keywords_en, keywords_fa, keywords_ar), and localized alt text (en/fa/ar). Source attribution belongs in image metadata/caption, never rendered inside the image. Keywords must accurately describe that specific image and article context; never keyword-stuff.

End every language version with its exact editorial note:
EN: Editorial note: This article is based on publicly available primary sources and editorial analysis by Fourth Dimension Studio. Product availability, capabilities and regional access may change; consult the original source before making project decisions.
FA: یادداشت تحریریه: این مقاله بر پایه منابع اولیه عمومی و تحلیل تحریریه Fourth Dimension Studio نوشته شده است. قابلیت‌ها و دسترسی منطقه‌ای ممکن است تغییر کنند؛ پیش از تصمیم‌گیری پروژه‌ای منبع اصلی را بررسی کنید.
AR: ملاحظة تحريرية: يستند هذا المقال إلى مصادر أولية متاحة للعامة وإلى تحليل تحريري من Fourth Dimension Studio. قد تتغير القدرات والتوافر؛ يُنصح بالرجوع إلى المصدر الأصلي قبل اتخاذ قرارات مرتبطة بالمشروعات.

Return strict JSON only with: content_pillar, editorial_angle, article_title_en, seo_title_en, slug_en, meta_description_en, excerpt_en, full_article_en, primary_keyword_en, related_keywords_en, keyword_evidence_en, article_title_fa, seo_title_fa, slug_fa, meta_description_fa, excerpt_fa, full_article_fa, primary_keyword_fa, related_keywords_fa, keyword_evidence_fa, article_title_ar, seo_title_ar, slug_ar, meta_description_ar, excerpt_ar, full_article_ar, primary_keyword_ar, related_keywords_ar, keyword_evidence_ar, keywords, tags, image_prompt_16_9, image_package, alt_text_en, alt_text_fa, alt_text_ar, sources, fact_check_notes, internal_link_suggestions, external_links, json_ld_article, json_ld_breadcrumb, json_ld_faq, canonical_hreflang_plan, byline_status, date_fact_checked, date_modified, value_add_notes.
Brief: ${JSON.stringify(brief)}
Keyword evidence: ${JSON.stringify(keywordResearch)}`;
}

export function qualityGatePrompt(brief, article) {
  return `Act as a strict pre-publication editor. Return strict JSON only with: result (PASS, NEEDS_REVISION, FAIL), critical_failures (array), revision_items (array), passed_checks (array), human_review_required (must be true), originality_assessment, factuality_assessment, multilingual_assessment, seo_assessment, image_assessment, adsense_risk_notes (array).
FAIL for missing primary evidence, copied/close-paraphrased language, unsupported important claims, invented URLs/facts/author, absent localized EN/FA/AR versions, absent editorial notes, invalid schema, fewer than four complete original image specifications, or any image missing credit, source_name, source_url/reference_sources, keywords_en, keywords_fa, keywords_ar, caption, or localized alt text. The result can be PASS only when the package is useful, original, source-grounded, SEO-ready, image-ready, and still requires human approval. Brief: ${JSON.stringify(brief)} Article: ${JSON.stringify(article)}`;
}
