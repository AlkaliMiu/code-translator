import { describe, expect, it } from 'vitest'
import { getMessages, LOCALES } from '../i18n'
import { detectLanguage } from '../utils/language'
import { EXAMPLES, getExampleCode } from './examples'

describe('examples', () => {
  it.each(LOCALES)('build in %s and are detected as their own language', (locale) => {
    for (const example of EXAMPLES) {
      const code = getExampleCode(example, locale)
      expect(code.trim(), example.id).not.toBe('')
      expect(detectLanguage(code), `${example.id} (${locale})`).toBe(example.language)
    }
  })

  it.each(LOCALES)('produce valid JavaScript in %s', (locale) => {
    for (const example of EXAMPLES.filter((item) => item.language === 'javascript')) {
      // Compiles the snippet without calling it.
      expect(() => new Function(getExampleCode(example, locale)), example.id).not.toThrow()
    }
  })

  it('uses the reader’s language for string literals', () => {
    const array = EXAMPLES.find((item) => item.id === 'javascript-array')!
    expect(getExampleCode(array, 'ja')).toContain("'マグカップ'")
    expect(getExampleCode(array, 'ru')).toContain("'Блокнот'")
  })

  it('escapes quotes inside translated strings', () => {
    const array = EXAMPLES.find((item) => item.id === 'javascript-array')!
    const samples = { ...getMessages('fr').samples, products: ['Sac d’été', "L'agenda", 'C:\\notes'] as const }
    const code = array.build(samples)
    expect(() => new Function(code)).not.toThrow()
    expect(code).toContain("'L\\'agenda'")
  })
})
