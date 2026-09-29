const TOPICS = "architecture, interior design, Revit, BIM, parametric/computational design, AI in architecture, artificial intelligence, AI agents, automation, generative AI, image/video/3D AI, and important technology for architecture and design";
const STUDIO_FOCUS = "Fourth Dimension Studio serves architects, interior designers, BIM/Revit professionals, visualization artists, AI creators, and design studios. Prioritize architecture/design projects; BIM, Revit, Rhino, Grasshopper and digital-construction workflows; rendering and visualization; generative image/video/3D tools with a concrete creative use; and AI agents or automation that materially improve studio work. Reject generic consumer AI, finance, politics, gadgets, corporate announcements, or broad technology news unless the item has a direct, specific and practical impact on this audience.";

export function reviewPrompt(item, today) {
  return `You are the fact-checking editor for Fourth Dimension Studio. Evaluate one candidate news item. Topics: ${TOPICS}. Audience rule: ${STUDIO_FOCUS} Today is ${today}. Find and prefer the original primary/official source. A technical product, model, tool, Revit/BIM, or platform claim requires a tier-1 official source. Reject rumors, leaks, undocumented social posts, pure promotion, unverifiable claims, stale items, previously-covered events, and stories with no independent editorial value. Do not write an article.

Score exactly out of 100: studio_relevance 0-25, source_authority 0-20, importance_and_recency 0-15, independent_analysis_value 0-15, audience_utility 0-10, verifiability 0-10, multilingual_potential 0-5. total_score must equal the sum. Selection threshold is 70, but hard rejection rules override score.

For a SELECT decision also create a concise, original news brief—not a long article. Localize it separately for English, Persian and Arabic. Each summary must be 80-140 words, clearly attribute the primary source, separate confirmed fact from interpretation, and contain no copied sentences. Supply searchable metadata for an eventual news archive. Do not generate images and do not turn the item into a long-form article.

Return strict JSON only with: decision (SELECT or REJECT), rejection_reason, hard_rejection_reasons (array), primary_source_verified (boolean), is_recent (boolean), source_tier (1, 2, or 3), primary_source_url, category, editorial_angle, scores (object containing the seven named scores), total_score, importance_score_1_to_10, relevance_score_1_to_10, original_title, original_source, original_url, original_publication_date, cluster_id, verified_facts (array where every numeric/product claim includes its supporting URL), caveats (array), claim_verification_notes (array), value_add_opportunity, search_seed_en, search_seed_fa, search_seed_ar, news_title_en, news_title_fa, news_title_ar, summary_en, summary_fa, summary_ar, why_it_matters_en, why_it_matters_fa, why_it_matters_ar, country, architect_or_company, building_or_technology_type, tags (array), seo_title_en, slug_en, meta_description_en, seo_title_fa, slug_fa, meta_description_fa, seo_title_ar, slug_ar, meta_description_ar. Search seeds must be short, natural queries localized for each language. Candidate: ${JSON.stringify(item)}`;
}

export function articlePrompt(review, keywordResearch = {}) {
  return `Create an original, independent, professional multilingual article package for Fourth Dimension Studio from the verified review below. This is editorial analysis, not a translation or rewrite of the source.

CONTENT RULES:
- Write separately localized English, Persian, and Arabic versions for their real audiences; never mechanically translate.
- Each analytical version should normally be 1,500-2,500 useful words. Completeness matters more than padding.
- The title fields are the H1. In each full_article field use Markdown with logical H2/H3 sections (do not repeat H1); every section begins with a short answer or definition.
- Separate verified facts, specialist context, and Fourth Dimension Studio's practical analysis. Explain why architects, BIM specialists, visualization artists, and studio managers should care, including limits, cost/vendor dependence, access uncertainty, and skills required when relevant.
- Use short paragraphs, tables for genuine comparisons, numbered steps where useful, a clear conclusion, real publication/fact-check dates, and only evidence-based FAQs.
- Cite the primary source for every important numerical/product claim. Never invent prices, access, dates, capabilities, quotes, authors, or URLs.
- No source copying, close paraphrase, clichés, filler, keyword stuffing, clickbait, or artificial links.
- Include the exact localized editorial note supplied below at the end of each language version.

SEO/GEO RULES:
- For each language choose one specific primary query and 3-5 closely related queries. Place the main query naturally in H1, first paragraph, SEO title, slug, and one or two H2s.
- SEO titles should target about 50-60 characters; meta descriptions about 150-160 characters and remain accurate.
- Provide Article JSON-LD and BreadcrumbList JSON-LD only from visible facts. Do not invent author identity or author URLs. FAQPage schema is allowed only when the same FAQ is visible; never add HowTo schema to news/analysis.
- Provide self-referencing canonical placeholders and reciprocal hreflang values for en, fa, ar, and x-default; mark them as pending until real URLs exist.

IMAGE RULES:
- Return an image_package of exactly 4 original AI image specifications: one featured image (1200x630, about 1.91:1) and three contextual images (16:9). Every image must be at least 1200px wide, contain no text, logos, screenshots, copied artwork, or watermark, and have a descriptive WebP filename, short localized alt text, caption, placement_hint, and ai_generated=true.
- Also copy the featured prompt to image_prompt_16_9 and its alt texts to alt_text_en/fa/ar for backward compatibility.

Use these exact editorial notes:
EN: Editorial note: This article is based on publicly available primary sources and editorial analysis by Fourth Dimension Studio. Product availability, capabilities and regional access may change; consult the original source before making project decisions.
FA: یادداشت تحریریه: این مقاله بر پایه منابع اولیه عمومی و تحلیل تحریریه Fourth Dimension Studio نوشته شده است. قابلیت‌ها و دسترسی منطقه‌ای ممکن است تغییر کنند؛ پیش از تصمیم‌گیری پروژه‌ای منبع اصلی را بررسی کنید.
AR: ملاحظة تحريرية: يستند هذا المقال إلى مصادر أولية متاحة للعامة وإلى تحليل تحريري من Fourth Dimension Studio. قد تتغير القدرات والتوافر؛ يُنصح بالرجوع إلى المصدر الأصلي قبل اتخاذ قرارات مرتبطة بالمشروعات.

Use the supplied live keyword evidence as guidance, not as an instruction to stuff phrases. Search Console queries have priority when they are genuinely relevant; otherwise use localized Google Autocomplete evidence. Never claim a volume that is not supplied. Internal links may only use exact URLs present in internal_links.urls; if that list is empty, return suggestions without URLs and do not invent links.

Return strict JSON only with these keys: editorial_angle, article_title_en, seo_title_en, slug_en, meta_description_en, excerpt_en, full_article_en, primary_keyword_en, related_keywords_en, keyword_evidence_en, article_title_fa, seo_title_fa, slug_fa, meta_description_fa, excerpt_fa, full_article_fa, primary_keyword_fa, related_keywords_fa, keyword_evidence_fa, article_title_ar, seo_title_ar, slug_ar, meta_description_ar, excerpt_ar, full_article_ar, primary_keyword_ar, related_keywords_ar, keyword_evidence_ar, keywords, tags, image_prompt_16_9, image_package, alt_text_en, alt_text_fa, alt_text_ar, sources, fact_check_notes, internal_link_suggestions, external_links, json_ld_article, json_ld_breadcrumb, json_ld_faq, canonical_hreflang_plan, byline_status, date_fact_checked, date_modified, value_add_notes. Verified review: ${JSON.stringify(review)} Live keyword evidence: ${JSON.stringify(keywordResearch)}`;
}

export function qualityGatePrompt(review, article) {
  return `Act as a strict pre-publication quality gate for Fourth Dimension Studio. Check the candidate package against these critical rules: verified primary source; no duplicate event; every important factual/numeric/product claim supported; clear separation of fact and analysis; original value-add; three genuinely localized EN/FA/AR versions; specific SEO queries; accurate title/meta/slug; logical H1/H2/H3; concise opening answer; practical implications and limitations; real editorial notes; no invented author/URL/price/access/quote; 4 complete original image specifications; valid visible-content-only Article/Breadcrumb schema; FAQ schema only if FAQ is visible; canonical/hreflang marked pending until real URLs; human approval required. Return strict JSON only: result (PASS, NEEDS_REVISION, or FAIL), critical_failures (array), revision_items (array), passed_checks (array), human_review_required (must be true), adsense_risk_notes (array), originality_assessment, factuality_assessment, multilingual_assessment, seo_assessment. Any missing primary source, duplication, or unverifiable key claim must be FAIL. Review: ${JSON.stringify(review)} Article: ${JSON.stringify(article)}`;
}

