const ROLES = ["featured", "workflow-context", "technical-detail", "future-impact"];
const PLACEMENTS = ["article hero", "after the introduction", "beside the practical workflow section", "before the conclusion"];
const PILLAR_VISUALS = {
  architecture_bim: ["a premium editorial architecture hero composition", "architects collaborating around a credible BIM coordination workflow", "a precise close-up of building information models, materials, and construction details", "a forward-looking built-environment scenario showing practical project impact"],
  ai_content: ["a premium editorial composition about human-directed artificial intelligence and creative production", "a creative team directing an ethical generative image and video workflow", "a precise visual study of prompts, iterations, and multimodal creative assets without readable interface text", "a forward-looking responsible AI production scenario with clear human oversight"],
  motion_video: ["a cinematic editorial composition for motion design and visual storytelling", "a production team planning a storyboard, camera movement, animation, and sound", "a detailed studio scene with lighting, compositing, editing, and motion-design craft", "a future-facing branded video production scenario across international media formats"],
  web_app: ["a premium editorial digital-product composition for web and app experience design", "a multidisciplinary team mapping information architecture and responsive user journeys", "a detailed abstract study of accessible components, interaction, multilingual design, and performance without readable UI text", "a forward-looking immersive and inclusive digital experience across devices"],
  automation_agents: ["a premium editorial composition showing connected automation and AI-agent orchestration", "a studio team mapping triggers, approvals, data flows, and human checkpoints", "a detailed abstract workflow of reliable integrations, audit trails, and structured data without readable UI text", "a responsible future-of-work scenario where agents assist a creative business under human control"],
  editorial_books: ["a premium editorial composition about research, publishing, books, and visual storytelling", "editors and designers developing a multilingual evidence-based publication", "a detailed study of typography, page structure, illustration, and accessible reading without readable text", "a forward-looking interactive publishing experience spanning print and digital formats"]
};
function list(value) { return Array.isArray(value) ? value.filter(Boolean) : value ? [value] : []; }
function sourceMetadata(article, current) {
  const references = list(current.reference_sources).length ? list(current.reference_sources) : list(article.sources);
  const normalized = references.map((item) => typeof item === "string" ? { name: item, url: "" } : { name: item.name || item.source || item.title || "Primary source", url: item.url || item.source_url || "" });
  const first = normalized[0] || { name: article.original_source || "Fourth Dimension Studio research", url: article.primary_source_url || article.original_url || "" };
  return { source_name: current.source_name || first.name, source_url: current.source_url || first.url, reference_sources: normalized };
}
function imageKeywords(article, current, language) {
  const specific = current["keywords_" + language];
  if (Array.isArray(specific) && specific.length) return specific;
  const primary = article["primary_keyword_" + language];
  const related = article["related_keywords_" + language];
  return [...new Set([primary, ...list(related), ...list(article.keywords), ...list(article.tags)].filter(Boolean))].slice(0, 10);
}
export function detectContentPillar(article = {}) {
  const explicit = String(article.content_pillar || "").toLowerCase();
  if (PILLAR_VISUALS[explicit]) return explicit;
  const text = [article.editorial_angle, article.article_title_en, article.primary_keyword_en, ...list(article.tags)].filter(Boolean).join(" ").toLowerCase();
  if (/(motion|video|film|cinema|animation|storyboard|logo.?motion|sound design|teaser)/.test(text)) return "motion_video";
  if (/(web|website|wordpress|ecommerce|app|mobile|ux|ui|user experience|digital product|accessibility)/.test(text)) return "web_app";
  if (/(automation|agent|workflow|composio|make\.com|n8n|zapier|integration|orchestration)/.test(text)) return "automation_agents";
  if (/(book|publishing|editorial|article|writing|typography|page layout|interactive story)/.test(text)) return "editorial_books";
  if (/(architecture|architect|bim|revit|building|interior|rhino|grasshopper|parametric|render|aec)/.test(text)) return "architecture_bim";
  return "ai_content";
}
function fallbackPrompt(article, index) {
  const subject = article.editorial_angle || article.article_title_en || "creative technology and design";
  const pillar = detectContentPillar(article);
  const scene = PILLAR_VISUALS[pillar][index] || PILLAR_VISUALS[pillar][0];
  return scene + ", focused on " + subject + ", credible international professional context, sophisticated editorial realism, cinematic controlled lighting, culturally neutral, no text, no logo, no watermark, no copyrighted character, no user interface screenshot, original composition, 16:9";
}
export function ensureImagePackage(article, required = 4) {
  const supplied = Array.isArray(article.image_package) ? article.image_package : [];
  const packageItems = [];
  for (let index = 0; index < required; index += 1) {
    const current = supplied[index] && typeof supplied[index] === "object" ? supplied[index] : {};
    const role = current.role || ROLES[index] || "context-" + index;
    const source = sourceMetadata(article, current);
    packageItems.push({
      ...current, role,
      prompt: current.prompt || fallbackPrompt(article, index),
      dimensions: current.dimensions || (index === 0 ? "1200x630" : "1280x720"),
      aspect_ratio: current.aspect_ratio || (index === 0 ? "1.91:1" : "16:9"),
      filename: current.filename || (article.slug_en || "fourth-dimension-article") + "-" + role + ".webp",
      placement_hint: current.placement_hint || PLACEMENTS[index] || "within the article body",
      caption: current.caption || article.article_title_en || article.editorial_angle || "Fourth Dimension Studio editorial illustration",
      credit: current.credit || "Original AI-generated editorial image by Fourth Dimension Studio; references listed in image metadata.",
      source_name: source.source_name,
      source_url: source.source_url,
      reference_sources: source.reference_sources,
      keywords_en: imageKeywords(article, current, "en"),
      keywords_fa: imageKeywords(article, current, "fa"),
      keywords_ar: imageKeywords(article, current, "ar"),
      alt_text_en: current.alt_text_en || article.alt_text_en || (article.article_title_en || "Creative technology") + " — " + role + " editorial illustration",
      alt_text_fa: current.alt_text_fa || article.alt_text_fa || (article.article_title_fa || "فناوری خلاق") + " — تصویر تحریریه " + role,
      alt_text_ar: current.alt_text_ar || article.alt_text_ar || (article.article_title_ar || "التكنولوجيا الإبداعية") + " — رسم تحريري " + role
    });
  }
  return packageItems;
}
