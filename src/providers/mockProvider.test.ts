import { describe, expect, it } from 'vitest'
import { EXAMPLES, getExampleCode } from '../data/examples'
import { getMessages, LOCALES } from '../i18n'
import type { ExplanationDepth } from '../types/explanation'
import { buildDemoExplanation } from './mockProvider'

const depths: ExplanationDepth[] = ['beginner', 'intro', 'advanced']

describe('buildDemoExplanation', () => {
  it.each(LOCALES)('explains every example in %s', (locale) => {
    for (const example of EXAMPLES) {
      for (const depth of depths) {
        const code = getExampleCode(example, locale)
        const result = buildDemoExplanation({ code, language: example.language, depth, locale })
        const lineCount = code.split('\n').length

        expect(result.summary).not.toBe('')
        expect(result.steps.length).toBeGreaterThan(0)
        for (const step of result.steps) {
          expect(step.lineStart).toBeGreaterThanOrEqual(1)
          expect(step.lineEnd).toBeLessThanOrEqual(lineCount)
          expect(step.lineEnd).toBeGreaterThanOrEqual(step.lineStart)
        }
        expect(result.quiz.options).toHaveLength(3)
        expect(result.quiz.options[result.quiz.answer]).toBe(result.summary)
        expect(result.meta.disclaimer).toBe(getMessages(locale).demo.disclaimer)
      }
    }
  })

  it('writes the explanation in the requested language', () => {
    const example = EXAMPLES.find((item) => item.id === 'javascript-async')!
    const explain = (locale: 'en' | 'de') =>
      buildDemoExplanation({ code: getExampleCode(example, locale), language: 'javascript', depth: 'intro', locale })

    expect(explain('en').summary).toBe(getMessages('en').demo.purpose.fetch[0])
    expect(explain('de').summary).toBe(getMessages('de').demo.purpose.fetch[0])
    expect(explain('de').warnings[0]?.title).toBe(getMessages('de').demo.warnings.network.title)
  })

  it('switches to simpler wording on request', () => {
    const example = EXAMPLES[0]
    const request = { code: getExampleCode(example, 'ja'), language: example.language, depth: 'advanced' as const, locale: 'ja' as const }
    expect(buildDemoExplanation(request).summary).not.toBe(buildDemoExplanation({ ...request, simplify: true }).summary)
  })
})
