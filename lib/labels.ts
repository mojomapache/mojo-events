// Editable label set. Each label has a display name in both languages and a
// list of keywords used by the fallback (non-AI) matcher.
export const LABEL_DEFINITIONS = [
  { key: "drinks", en: "Drinks", es: "Bebidas", kw: ["soda", "juice", "water", "drink", "refresco", "agua", "jugo", "bebida"] },
  { key: "alcohol", en: "Alcohol", es: "Alcohol", kw: ["beer", "wine", "cerveza", "vino", "tequila", "alcohol", "six-pack", "seltzer"] },
  { key: "protein", en: "Protein / meat", es: "Proteína / carne", kw: ["chicken", "beef", "carne", "pollo", "burger", "steak", "carnitas", "meat"] },
  { key: "veg", en: "Vegetarian option", es: "Opción vegetariana", kw: ["vegetarian", "vegan", "vegetariano", "vegano", "salad", "veggie"] },
  { key: "sides", en: "Sides", es: "Guarniciones", kw: ["sides", "rice", "arroz", "beans", "frijoles", "potatoes", "papas"] },
  { key: "snacks", en: "Snacks / munchies", es: "Botanas", kw: ["chips", "papitas", "snack", "botana", "nachos"] },
  { key: "dessert", en: "Dessert", es: "Postre", kw: ["cake", "pastel", "dessert", "postre", "cookies", "galletas", "ice cream"] },
  { key: "bread", en: "Bread / salad", es: "Pan / ensalada", kw: ["bread", "pan", "salad", "ensalada", "tortillas"] },
  { key: "paper", en: "Paper goods / utensils", es: "Desechables / cubiertos", kw: ["plates", "platos", "cups", "vasos", "napkins", "servilletas", "utensils", "cubiertos"] },
  { key: "takeout", en: "Already ordered / takeout", es: "Ya pedido / para llevar", kw: ["ordered", "pedido", "takeout", "delivery", "uber eats", "doordash"] },
  { key: "other", en: "Other", es: "Otro", kw: [] }
] as const;

export type LabelKey = (typeof LABEL_DEFINITIONS)[number]["key"];

export function labelName(key: string, lang: "en" | "es") {
  const def = LABEL_DEFINITIONS.find((l) => l.key === key);
  return def ? def[lang] : key;
}

// Simple, dependency-free keyword matcher. Works fully offline and is the
// permanent fallback whenever ANTHROPIC_API_KEY isn't configured.
export function detectLabelsByKeyword(text: string): string[] {
  if (!text || !text.trim()) return [];
  const lower = text.toLowerCase();
  const hits = LABEL_DEFINITIONS.filter((l) => l.kw.some((k) => lower.includes(k)));
  return hits.length ? hits.map((h) => h.key) : ["other"];
}
