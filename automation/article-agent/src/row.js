function joined(value) { return Array.isArray(value) ? value.join(" | ") : String(value ?? ""); }

export const ARTICLE_HEADERS = Object.freeze([
  "Article ID", "Created At", "Trend Title", "Original Source", "Original URL", "Original Publication Date", "Fact Checked At", "Category",
  "Importance 1-10", "Relevance 1-10", "Workflow Status", "Editor Notes",
  "Article Title EN", "SEO Title EN", "Slug EN", "Meta Description EN", "Excerpt EN", "Full Article EN",
  "Article Title FA", "SEO Title FA", "Slug FA", "Meta Description FA", "Excerpt FA", "Full Article FA",
  "Article Title AR", "SEO Title AR", "Slug AR", "Meta Description AR", "Excerpt AR", "Full Article AR",
  "Keywords", "Tags", "Featured Image Prompt", "Featured Image URL", "Alt Text EN", "Alt Text FA", "Alt Text AR",
  "Sources", "Audit JSON", "Drive Folder URL", "Human Approval", "Approved By", "WordPress Draft URL", "Last Updated", "Run ID", "Publish Notes",
]);

export function articleRow({ articleId, createdAt, brief, article, featuredImageUrl, imageAssets, keywordResearch, qualityGate, runId }) {
  const audit = {
    workflow: "independent-article-agent", human_review_done: false, news_inbox_consumed: false,
    primary_source_url: brief.primary_source_url || brief.original_url, verified_facts: brief.verified_facts || [],
    claim_verification_notes: brief.claim_verification_notes || [], fact_check_notes: article.fact_check_notes || [],
    keyword_research: keywordResearch, quality_gate: qualityGate, image_assets: imageAssets,
    canonical_hreflang_plan: article.canonical_hreflang_plan || {},
    json_ld: { article: article.json_ld_article, breadcrumb: article.json_ld_breadcrumb, faq: article.json_ld_faq },
    indexing_plan: {
      language_versions: ["en", "fa", "ar"],
      sitemap_url: "https://fourth-dimension-studio.infinityfreeapp.com/wp-sitemap.xml",
      required_checks: ["public HTTP 200", "self canonical", "reciprocal hreflang", "Article and BreadcrumbList validation", "sitemap inclusion", "Search Console URL inspection after publication"],
      note: "Google does not provide a generic API to force-index ordinary articles. Sitemap discovery and Search Console monitoring are used instead.",
    },
  };
  return [
    articleId, createdAt, brief.original_title, brief.original_source, brief.original_url, brief.original_publication_date, createdAt, brief.category,
    brief.importance_score_1_to_10, brief.relevance_score_1_to_10, "Waiting Approval", "",
    article.article_title_en, article.seo_title_en, article.slug_en, article.meta_description_en, article.excerpt_en, article.full_article_en,
    article.article_title_fa, article.seo_title_fa, article.slug_fa, article.meta_description_fa, article.excerpt_fa, article.full_article_fa,
    article.article_title_ar, article.seo_title_ar, article.slug_ar, article.meta_description_ar, article.excerpt_ar, article.full_article_ar,
    joined(article.keywords), joined(article.tags), article.image_prompt_16_9, featuredImageUrl,
    article.alt_text_en, article.alt_text_fa, article.alt_text_ar, JSON.stringify(article.sources || []), JSON.stringify(audit), "", "Pending", "", "", createdAt, runId, "",
  ];
}
