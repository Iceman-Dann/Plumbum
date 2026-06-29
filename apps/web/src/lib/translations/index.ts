export { translations as en } from "./en";
export { translations as es } from "./es";
export type { Language, Translations } from "./types";

import { translations as en } from "./en";
import { translations as es } from "./es";
import type { Language, Translations } from "./types";

export const translationsByLang: Record<Language, Translations> = { en, es };

export function interpolate(template: string, vars: Record<string, string | number>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => String(vars[key] ?? ""));
}

export const STORAGE_KEY = "plumbum-lang";

export function getStoredLanguage(): Language {
  if (typeof window === "undefined") return "en";
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored === "es" ? "es" : "en";
}
