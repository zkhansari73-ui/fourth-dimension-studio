function joined(value) {
  return Array.isArray(value) ? value.join(" | ") : String(value ?? "");
}

export function buildWaitingApprovalRow({ itemId, discoveredAt, review, article, featuredImageUrl = "", imageAssets = [], qualityGate = {}, runId }) {
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
    canonical_hreflang_plan: article.canonical_hreflang_plan ?? {},
    json_ld: { article: article.json_ld_article, breadcrumb: article.json_ld_breadcrumb, faq: article.json_ld_faq },
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

