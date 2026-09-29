import { describe, expect, it } from 'vitest'
import { detectLanguage } from './language'

describe('detectLanguage', () => {
  it('识别 Python 的缩进和关键字', () => {
    expect(detectLanguage('for item in items:\n    print(item)')).toBe('python')
  })

  it('优先识别 TypeScript 类型标注', () => {
    expect(detectLanguage('interface User { name: string }\nconst user: User = { name: "Lin" }')).toBe('typescript')
  })

  it('识别 JavaScript 箭头函数', () => {
    expect(detectLanguage('const doubled = values.map(value => value * 2);')).toBe('javascript')
  })
})
