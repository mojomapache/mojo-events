import { customAlphabet } from "nanoid";

// Lowercase letters + digits, no ambiguous characters (0/O, 1/l/I removed).
const alphabet = "23456789abcdefghjkmnpqrstuvwxyz";

const slugId = customAlphabet(alphabet, 8);
const hostKeyId = customAlphabet(alphabet + "23456789abcdefghjkmnpqrstuvwxyz".toUpperCase(), 32);

export function slugify(title: string) {
  const base = title
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 40);
  return `${base || "gathering"}-${slugId()}`;
}

export function generateHostKey() {
  return hostKeyId();
}
