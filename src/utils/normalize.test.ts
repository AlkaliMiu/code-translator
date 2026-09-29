import { describe, expect, it } from 'vitest'
import { normalizeExplanation } from './normalize'

describe('normalizeExplanation', () => {
  it('为缺失字段提供安全默认值', () => {
    const result = normalizeExplanation({ summary: '测试', steps: [{ lineStart: 99 }] }, 4)
    expect(result.summary).toBe('测试')
    expect(result.steps[0]?.lineStart).toBe(4)
    expect(result.quiz.options).toHaveLength(2)
    expect(result.meta.provider).toBe('ai')
  })

  it('修正反向的代码行范围', () => {
    const result = normalizeExplanation({ steps: [{ lineStart: 3, lineEnd: 1 }] }, 6)
    expect(result.steps[0]?.lineEnd).toBe(3)
  })
})
