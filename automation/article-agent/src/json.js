export function parseGeminiJson(value) {
  const text = String(value).replace(/^```json\s*|\s*```$/g, "");
  try {
    return JSON.parse(text);
  } catch (error) {
    // Gemini occasionally writes LaTeX-like sequences such as \lambda inside
    // JSON strings. Preserve unsupported escapes as literal backslashes.
    const repaired = text.replace(/\\(?!["\\/bfnrtu])/g, "\\\\");
    if (repaired === text) throw error;
    return JSON.parse(repaired);
  }
}
