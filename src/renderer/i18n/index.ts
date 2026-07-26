import zh from './zh';
import type { TranslationKey } from './en';
import { useStore } from '../store';
import { create } from 'zustand';
import React from 'react';

// zh is always available synchronously; en is loaded on demand to reduce initial bundle
const translations: Record<string, Record<string, string>> = { zh };

// Lightweight store to trigger re-renders when a locale finishes loading
const useI18nVersion = create<{ v: number }>(() => ({ v: 0 }));

/** Pre-load a locale (zh is always available; en is loaded on demand). */
export async function loadLocale(locale: 'zh' | 'en'): Promise<void> {
  if (locale === 'en' && !translations.en) {
    const mod = await import('./en');
    translations.en = mod.default;
    useI18nVersion.setState((s) => ({ v: s.v + 1 }));
  }
}

function resolveLocale(lang: string): 'zh' | 'en' {
  return lang.startsWith('zh') ? 'zh' : 'en';
}

/** Direct translation (non-reactive). Fine for one-off calls. */
export function t(key: TranslationKey, lang?: string): string {
  const locale = lang ? resolveLocale(lang) : resolveLocale(useStore.getState().appSettings.language ?? 'zh-CN');
  return (translations[locale] ?? zh)[key] ?? key;
}

/** React hook — re-renders when language changes. */
export function useT(key: TranslationKey): string {
  const lang = useStore((s) => s.appSettings.language);
  useI18nVersion((s) => s.v);
  const locale = resolveLocale(lang ?? 'zh-CN');
  return (translations[locale] ?? zh)[key] ?? key;
}

/** Batch-translation hook for multiple keys. */
export function useTBatch(keys: TranslationKey[]): Record<TranslationKey, string> {
  const lang = useStore((s) => s.appSettings.language);
  useI18nVersion((s) => s.v);
  const locale = resolveLocale(lang ?? 'zh-CN');
  const dict = translations[locale] ?? zh;
  const result = {} as Record<TranslationKey, string>;
  for (const k of keys) result[k] = dict[k] ?? k;
  return result;
}

/** Returns the active locale string ('zh' | 'en') reactively. */
export function useLocale(): 'zh' | 'en' {
  const lang = useStore((s) => s.appSettings.language);
  useI18nVersion((s) => s.v);
  return resolveLocale(lang ?? 'zh-CN');
}

export type { TranslationKey };
