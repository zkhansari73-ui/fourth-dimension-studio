function joined(value) {
  return Array.isArray(value) ? value.join(" | ") : String(value ?? "");
}

export function buildWaitingApprovalRow({ itemId, discoveredAt, review, article, runId }) {
  return [
    itemId, discoveredAt, review.original_title, review.original_source, review.original_url,
    review.original_publication_date, discoveredAt, review.category,
    review.importance_score_1_to_10, review.relevance_score_1_to_10,
    "Waiting Approval", "",
    article.article_title_en, article.seo_title_en, article.slug_en, article.meta_description_en, article.excerpt_en, article.full_article_en,
    article.article_title_fa, article.seo_title_fa, article.slug_fa, article.meta_description_fa, article.excerpt_fa, article.full_article_fa,
    article.article_title_ar, article.seo_title_ar, article.slug_ar, article.meta_description_ar, article.excerpt_ar, article.full_article_ar,
    joined(article.keywords), joined(article.tags), article.image_prompt_16_9,
    "", article.alt_text_en, article.alt_text_fa, article.alt_text_ar,
    JSON.stringify(article.sources ?? []), JSON.stringify(article.fact_check_notes ?? []),
    "", "Pending", "", "", discoveredAt, runId, "",
  ];
}

