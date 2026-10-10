import type { AppLocale } from '../types/explanation'
import { de } from './locales/de'
import { en } from './locales/en'
import { es } from './locales/es'
import { fr } from './locales/fr'
import { ja } from './locales/ja'
import { ru } from './locales/ru'
import { zh } from './locales/zh'
import type { Messages } from './types'

export type { Messages, Variants } from './types'

const MESSAGES: Record<AppLocale, Messages> = { en, zh, fr, de, es, ja, ru }

export const DEFAULT_LOCALE: AppLocale = 'en'

/** Locales in the order they appear in the language menu. */
export const LOCALES = Object.keys(MESSAGES) as AppLocale[]

export function isLocale(value: unknown): value is AppLocale {
  return typeof value === 'string' && Object.hasOwn(MESSAGES, value)
}

export function getMessages(locale: AppLocale): Messages {
  return MESSAGES[locale] ?? MESSAGES[DEFAULT_LOCALE]
}

export function formatNumber(value: number, locale: AppLocale): string {
  return new Intl.NumberFormat(getMessages(locale).meta.htmlLang).format(value)
}
