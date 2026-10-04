function joined(value) {
  return Array.isArray(value) ? value.join(" | ") : String(value ?? "");
}

export const NEWS_INBOX_HEADERS = Object.freeze([
  "News ID", "Discovered At", "Original Title", "Original Source", "Original URL", "Original Publication Date",
  "Category", "Source Tier", "Total Score", "Importance 1-10", "Relevance 1-10", "Primary Source Verified",
  "Is Recent", "News Title EN", "News Title FA", "News Title AR", "Summary EN", "Summary FA", "Summary AR",
  "Why It Matters FA", "Country", "Architect / Company", "Building / Technology Type", "Tags",
  "SEO Bundle", "Verified Facts", "Workflow Status", "Human Approval", "Run ID", "Review Audit JSON",
]);

export function buildNewsInboxRow({ newsId, discoveredAt, review, runId }) {
  const seoBundle = {
    en: { title: review.seo_title_en, slug: review.slug_en, meta_description: review.meta_description_en },
    fa: { title: review.seo_title_fa, slug: review.slug_fa, meta_description: review.meta_description_fa },
    ar: { title: review.seo_title_ar, slug: review.slug_ar, meta_description: review.meta_description_ar },
    canonical_status: "pending-until-real-url-exists",
  };
  return [
    newsId, discoveredAt, review.original_title, review.original_source, review.original_url,
    review.original_publication_date, review.category, review.source_tier, review.total_score,
    review.importance_score_1_to_10, review.relevance_score_1_to_10, review.primary_source_verified,
    review.is_recent, review.news_title_en, review.news_title_fa, review.news_title_ar,
    review.summary_en, review.summary_fa, review.summary_ar, review.why_it_matters_fa,
    review.country, review.architect_or_company, review.building_or_technology_type,
    joined(review.tags), JSON.stringify(seoBundle), JSON.stringify(review.verified_facts ?? []),
    "Waiting News Approval", "Pending", runId, JSON.stringify(review),
  ];
}

export function buildWaitingApprovalRow({ itemId, discoveredAt, review, article, featuredImageUrl = "", imageAssets = [], keywordResearch = {}, qualityGate = {}, runId }) {
  const auditBundle = {
    fact_check_notes: article.fact_check_notes ?? [],
    claim_verification_notes: review.claim_verification_notes ?? [],
    primary_source_url: review.primary_source_url || review.original_url,
    source_tier: review.source_tier,
    cluster_id: review.cluster_id,
    editorial_angle: article.editorial_angle || review.editorial_angle,
    total_score: review.total_score,
    quality_gate: qualityGate,
    image_assets: imageAssets,
    image_ai_generated: imageAssets.length > 0,
    human_review_done: false,
    value_add_notes: article.value_add_notes || review.value_add_opportunity || "",
    keyword_research: keywordResearch,
    canonical_hreflang_plan: article.canonical_hreflang_plan ?? {},
    json_ld: { newsArticle: article.json_ld_news_article, breadcrumb: article.json_ld_breadcrumb },
  };
  return [
    itemId, discoveredAt, review.original_title, review.original_source, review.original_url,
    review.original_publication_date, discoveredAt, review.category,
    review.importance_score_1_to_10, review.relevance_score_1_to_10,
    "Waiting Approval", "",
    article.article_title_en, article.seo_title_en, article.slug_en, article.meta_description_en, article.excerpt_en, article.full_article_en,
    article.article_title_fa, article.seo_title_fa, article.slug_fa, article.meta_description_fa, article.excerpt_fa, article.full_article_fa,
    article.article_title_ar, article.seo_title_ar, article.slug_ar, article.meta_description_ar, article.excerpt_ar, article.full_article_ar,
    joined(article.keywords), joined(article.tags), article.image_prompt_16_9,
    featuredImageUrl, article.alt_text_en, article.alt_text_fa, article.alt_text_ar,
    JSON.stringify(article.sources ?? []), JSON.stringify(auditBundle),
    "", "Pending", "", "", discoveredAt, runId, "",
  ];
}

