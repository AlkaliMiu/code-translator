import { describe, expect, it } from 'vitest'
import { normalizeExplanation } from './normalize'

describe('normalizeExplanation', () => {
  it('provides safe defaults for missing fields', () => {
    const result = normalizeExplanation({ summary: '测试', steps: [{ lineStart: 99 }] }, 4)
    expect(result.summary).toBe('测试')
    expect(result.steps[0]?.lineStart).toBe(4)
    expect(result.quiz.options).toHaveLength(2)
    expect(result.meta.provider).toBe('ai')
  })

  it('fixes reversed line ranges', () => {
    const result = normalizeExplanation({ steps: [{ lineStart: 3, lineEnd: 1 }] }, 6)
    expect(result.steps[0]?.lineEnd).toBe(3)
  })

  it('fills gaps with text in the requested language', () => {
    const result = normalizeExplanation({ steps: [{}] }, 2, 'ja')
    expect(result.summary).toBe('このコードはデータを処理するタスクを実行します。')
    expect(result.steps[0]?.title).toBe('ステップ 1')
  })
})
