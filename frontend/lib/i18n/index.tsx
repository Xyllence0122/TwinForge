"use client";

/**
 * Lightweight, dependency-free i18n architecture.
 *
 * - `en.ts` defines the canonical dictionary shape; every locale must
 *   satisfy `Dictionary`, so missing keys are compile-time errors.
 * - Adding a language = add a file + one entry in `LOCALES`.
 * - `useI18n()` exposes the active dictionary (`dict`) for structured
 *   access and `t()` for dotted-path lookups with {param} interpolation.
 */

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import en from "./en";
import zhTW from "./zh-TW";

export type Dictionary = typeof en;
export type Locale = "en" | "zh-TW";

export const LOCALES: Record<Locale, { label: string; flag: string; dict: Dictionary }> = {
  en: { label: "English", flag: "🇺🇸", dict: en },
  "zh-TW": { label: "繁體中文", flag: "🇹🇼", dict: zhTW },
};

const STORAGE_KEY = "twinforge.locale";

interface I18nContextValue {
  locale: Locale;
  dict: Dictionary;
  setLocale: (locale: Locale) => void;
  /** Dotted-path translation with optional {param} interpolation. */
  t: (path: string, params?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

function resolvePath(dict: Dictionary, path: string): string {
  // Walk the object by dotted path; fall back to the path itself so a
  // missing key is visible (and greppable) instead of rendering blank.
  let node: unknown = dict;
  for (const part of path.split(".")) {
    if (node && typeof node === "object" && part in (node as Record<string, unknown>)) {
      node = (node as Record<string, unknown>)[part];
    } else {
      return path;
    }
  }
  return typeof node === "string" ? node : path;
}

export function interpolate(template: string, params?: Record<string, string | number>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    key in params ? String(params[key]) : `{${key}}`,
  );
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");

  // Hydrate persisted preference after mount (SSR-safe).
  useEffect(() => {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (stored && stored in LOCALES) setLocaleState(stored as Locale);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    window.localStorage.setItem(STORAGE_KEY, next);
    document.documentElement.lang = next;
  }, []);

  const value = useMemo<I18nContextValue>(() => {
    const dict = LOCALES[locale].dict;
    return {
      locale,
      dict,
      setLocale,
      t: (path, params) => interpolate(resolvePath(dict, path), params),
    };
  }, [locale, setLocale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useI18n must be used inside <I18nProvider>");
  return ctx;
}
