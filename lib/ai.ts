import { LABEL_DEFINITIONS, detectLabelsByKeyword } from "./labels";

const VALID_KEYS = new Set(LABEL_DEFINITIONS.map((l) => l.key));

/**
 * Classifies a guest's free-text reply into one or more label keys.
 *
 * Uses Claude (Anthropic API) when ANTHROPIC_API_KEY is set, for better
 * multi-label and bilingual accuracy than plain keyword matching. Falls
 * back to the offline keyword matcher otherwise, or if the API call fails
 * for any reason -- labeling should never block an RSVP from saving.
 */
export async function classifyFreeText(text: string): Promise<string[]> {
  if (!text || !text.trim()) return [];

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return detectLabelsByKeyword(text);

  try {
    const labelList = LABEL_DEFINITIONS.filter((l) => l.key !== "other")
      .map((l) => `${l.key}: ${l.en} / ${l.es}`)
      .join("\n");

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01"
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 200,
        system:
          "You label short, informal party RSVP replies (English or Spanish) with one or more categories from a fixed list. " +
          "Never guess quantities. Respond with ONLY a JSON array of lowercase label keys, nothing else.",
        messages: [
          {
            role: "user",
            content:
              `Label keys:\n${labelList}\n\n` +
              `If nothing matches, use ["other"].\n\n` +
              `Guest reply: "${text.replace(/"/g, "'").slice(0, 500)}"`
          }
        ]
      })
    });

    if (!response.ok) return detectLabelsByKeyword(text);

    const data = await response.json();
    const raw = (data?.content ?? [])
      .map((block: { type: string; text?: string }) => (block.type === "text" ? block.text : ""))
      .join("");

    const cleaned = raw.replace(/```json|```/g, "").trim();
    const parsed = JSON.parse(cleaned);
    if (!Array.isArray(parsed)) return detectLabelsByKeyword(text);

    const filtered = parsed.filter((k: unknown): k is string => typeof k === "string" && VALID_KEYS.has(k as any));
    return filtered.length ? filtered : ["other"];
  } catch {
    return detectLabelsByKeyword(text);
  }
}
