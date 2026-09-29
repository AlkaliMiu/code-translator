import { describe, expect, it } from 'vitest'
import { getCopy } from './i18n'

describe('interface locale', () => {
  it('provides complete Chinese and English interface copy', () => {
    const zh = getCopy('zh')
    const en = getCopy('en')

    expect(zh.brand).toBe('代码翻译器')
    expect(en.brand).toBe('Code Translator')
    expect(Object.keys(en)).toEqual(Object.keys(zh))
    expect(en.depth.beginner[0]).toBe('Beginner')
  })
})
