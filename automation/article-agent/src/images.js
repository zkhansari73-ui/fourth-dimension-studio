const ROLES = ["featured", "workflow-context", "technical-detail", "future-impact"];
const PLACEMENTS = ["article hero", "after the introduction", "beside the practical workflow section", "before the conclusion"];

function fallbackPrompt(article, index) {
  const subject = article.editorial_angle || article.article_title_en || "architecture and design technology";
  const scenes = [
    "a premium editorial architectural hero composition",
    "architects collaborating in a realistic digital design workflow",
    "a precise close-up of computational design and building systems",
    "a forward-looking built-environment scenario showing practical impact",
  ];
  return `${scenes[index]}, focused on ${subject}, contemporary international architecture photography, refined natural materials, credible professional context, cinematic daylight, editorial realism, no text, no logo, no watermark, no user interface, original composition, 16:9`;
}

export function ensureImagePackage(article, required = 4) {
  const supplied = Array.isArray(article.image_package) ? article.image_package : [];
  const packageItems = [];
  for (let index = 0; index < required; index += 1) {
    const current = supplied[index] && typeof supplied[index] === "object" ? supplied[index] : {};
    const role = current.role || ROLES[index] || `context-${index}`;
    packageItems.push({
      ...current,
      role,
      prompt: current.prompt || fallbackPrompt(article, index),
      dimensions: current.dimensions || (index === 0 ? "1200x630" : "1280x720"),
      aspect_ratio: current.aspect_ratio || (index === 0 ? "1.91:1" : "16:9"),
      filename: current.filename || `${article.slug_en || "fourth-dimension-article"}-${role}.webp`,
      placement_hint: current.placement_hint || PLACEMENTS[index] || "within the article body",
      caption: current.caption || article.article_title_en || article.editorial_angle || "Fourth Dimension Studio editorial illustration",
      alt_text_en: current.alt_text_en || article.alt_text_en || `${article.article_title_en || "Architecture technology"} — ${role} editorial illustration`,
      alt_text_fa: current.alt_text_fa || article.alt_text_fa || `${article.article_title_fa || "فناوری معماری"} — تصویر تحریریه ${role}`,
      alt_text_ar: current.alt_text_ar || article.alt_text_ar || `${article.article_title_ar || "تكنولوجيا العمارة"} — رسم تحريري ${role}`,
    });
  }
  return packageItems;
}
