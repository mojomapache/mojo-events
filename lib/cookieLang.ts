import type { Lang } from "./i18n";

/**
 * Reads the `lang` cookie set by middleware.ts (based on visitor geo, or a
 * previous explicit choice from the in-app toggle). Returns null during SSR
 * or if the cookie isn't set yet, so callers should treat this as a
 * client-only enhancement layered on top of a safe default.
 */
export function getCookieLang(): Lang | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(/(?:^|; )lang=(en|es)/);
  return match ? (match[1] as Lang) : null;
}

/** Persists an explicit language choice so it sticks across visits and pages. */
export function setCookieLang(lang: Lang) {
  if (typeof document === "undefined") return;
  document.cookie = `lang=${lang}; max-age=${60 * 60 * 24 * 365}; path=/`;
}
