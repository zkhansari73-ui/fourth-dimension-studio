const TOPICS = "architecture, interior design, Revit, BIM, parametric/computational design, AI in architecture, artificial intelligence, AI agents, automation, generative AI, image/video/3D AI, and important technology for architecture and design";

export function reviewPrompt(item, today) {
  return `You are the fact-checking editor for Fourth Dimension Studio. Evaluate one candidate news item. Topics: ${TOPICS}. Today is ${today}. Prefer the original official source. Reject stale, duplicate-looking, promotional, weak, unverifiable, or low-relevance items. Do not write an article. Return strict JSON only with: decision (SELECT or REJECT), rejection_reason, primary_source_verified (boolean), is_recent (boolean), category, importance_score_1_to_10, relevance_score_1_to_10, original_title, original_source, original_url, original_publication_date, verified_facts (array), caveats (array). Candidate: ${JSON.stringify(item)}`;
}

export function articlePrompt(review) {
  return `Create an original, independent, professional multilingual news article package for Fourth Dimension Studio from the verified facts below. Do not copy or closely paraphrase source sentences. Clearly separate announced facts from analysis. Do not invent access, pricing, dates, rollout, capabilities, quotations, or sources. Produce natural localized English, Persian, and Arabic. Return strict JSON only with these keys: article_title_en, seo_title_en, slug_en, meta_description_en, excerpt_en, full_article_en, article_title_fa, seo_title_fa, slug_fa, meta_description_fa, excerpt_fa, full_article_fa, article_title_ar, seo_title_ar, slug_ar, meta_description_ar, excerpt_ar, full_article_ar, keywords (array), tags (array), image_prompt_16_9, alt_text_en, alt_text_fa, alt_text_ar, sources (array), fact_check_notes (array). The image prompt must require an original 16:9 editorial image with no text, logos, screenshots, or watermark. Verified review: ${JSON.stringify(review)}`;
}

