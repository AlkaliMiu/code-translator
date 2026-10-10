import { describe, expect, it } from 'vitest'
import { DEFAULT_LOCALE, formatNumber, getMessages, isLocale, LOCALES } from '.'

type Leaf = { path: string; value: unknown }

/** Flattens a dictionary into `path → value` pairs so locales can be compared key by key. */
function leaves(value: unknown, path = ''): Leaf[] {
  if (value && typeof value === 'object') {
    return Object.entries(value).flatMap(([key, child]) => leaves(child, path ? `${path}.${key}` : key))
  }
  return [{ path, value }]
}

describe('locales', () => {
  it('supports seven languages and defaults to English', () => {
    expect(LOCALES).toEqual(['en', 'zh', 'fr', 'de', 'es', 'ja', 'ru'])
    expect(DEFAULT_LOCALE).toBe('en')
    expect(isLocale('ja')).toBe(true)
    expect(isLocale('it')).toBe(false)
    expect(isLocale('toString')).toBe(false)
  })

  it.each(LOCALES)('%s has the same keys as English and no empty strings', (locale) => {
    const reference = leaves(getMessages('en'))
    const current = leaves(getMessages(locale))
    expect(current.map((leaf) => leaf.path)).toEqual(reference.map((leaf) => leaf.path))

    for (const { path, value } of current) {
      const text = typeof value === 'function' ? (value as (...args: unknown[]) => unknown)(3, 5) : value
      expect(typeof text, path).toBe('string')
      expect((text as string).trim(), path).not.toBe('')
    }
  })

  it.each(LOCALES.filter((locale) => locale !== 'en'))('%s translates every interface string', (locale) => {
    const english = new Map(leaves(getMessages('en').ui).map(({ path, value }) => [path, value]))
    const untranslated = leaves(getMessages(locale).ui)
      .filter(({ path, value }) => typeof value === 'string' && value === english.get(path))
      .map(({ path }) => path)
    // The product name is the only string allowed to stay in English.
    expect(untranslated.filter((path) => path !== 'brand')).toEqual([])
  })

  it('keeps the existing Chinese and English copy', () => {
    expect(getMessages('zh').ui.brand).toBe('代码翻译器')
    expect(getMessages('en').ui.brand).toBe('Code Translator')
    expect(getMessages('en').ui.depth.beginner[0]).toBe('Beginner')
  })

  it('uses each language’s plural rules', () => {
    expect(getMessages('en').ui.lineCount(1)).toBe('1 line')
    expect(getMessages('en').ui.lineCount(8)).toBe('8 lines')
    expect(getMessages('fr').ui.lineCount(0)).toBe('0 ligne')
    expect(getMessages('ru').ui.lineCount(1)).toBe('1 строка')
    expect(getMessages('ru').ui.lineCount(3)).toBe('3 строки')
    expect(getMessages('ru').ui.lineCount(5)).toBe('5 строк')
    expect(getMessages('ru').ui.lineCount(21)).toBe('21 строка')
  })

  it('formats numbers for the reader’s locale', () => {
    expect(formatNumber(12_000, 'en')).toBe('12,000')
    expect(formatNumber(12_000, 'de')).toBe('12.000')
    expect(formatNumber(12_000, 'fr')).toMatch(/^12\s000$/u)
  })
})
