import { describe, expect, it } from 'vitest'
import { detectLanguage } from './language'

describe('detectLanguage', () => {
  it('recognizes Python indentation and keywords', () => {
    expect(detectLanguage('for item in items:\n    print(item)')).toBe('python')
  })

  it('prefers TypeScript when it sees type annotations', () => {
    expect(detectLanguage('interface User { name: string }\nconst user: User = { name: "Lin" }')).toBe('typescript')
  })

  it('recognizes JavaScript arrow functions', () => {
    expect(detectLanguage('const doubled = values.map(value => value * 2);')).toBe('javascript')
  })

  it('still picks TypeScript when JavaScript signals outnumber it', () => {
    const code = 'function greet(user: User): string {\n  return user.name;\n}\nconsole.log(greet(lin));'
    expect(detectLanguage(code)).toBe('typescript')
  })

  it('ignores type words inside comments', () => {
    expect(detectLanguage('// check the type of each value\nconst total = values.reduce((sum, value) => sum + value, 0);')).toBe('javascript')
  })

  it('does not mistake Python `import … as` for TypeScript', () => {
    expect(detectLanguage('import numpy as np\nvalues = np.arange(10)\nprint(values)')).toBe('python')
  })
})
