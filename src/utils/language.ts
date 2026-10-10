import type { SupportedLanguage } from '../types/explanation'

const PYTHON_SIGNALS = [
  /^\s*(def|class)\s+\w+/m,
  /^\s*(from\s+\w+\s+import|import\s+\w+)/m,
  /^\s*(for|while|if|elif|else)\b.*:\s*$/m,
  /\bprint\s*\(/,
  /\bNone\b/,
]

const TYPESCRIPT_SIGNALS = [
  /\b(interface|type|enum)\s+\w+/,
  /:\s*(string|number|boolean|unknown|never)(?:\[\])?/,
  /\bimplements\s+\w+/,
  // Only TypeScript-specific casts: a bare `as name` also appears in Python imports and English comments.
  /\bas\s+(const|string|number|boolean|unknown|any)\b/,
]

const JAVASCRIPT_SIGNALS = [
  /\b(const|let|var)\s+\w+/,
  /=>/,
  /\b(function|console\.log|Promise|fetch)\b/,
  /[;}]/,
]

function score(code: string, signals: RegExp[]): number {
  return signals.reduce((total, signal) => total + (signal.test(code) ? 1 : 0), 0)
}

// Comments are prose, and words like "type of" in them should not count as code.
const stripComments = (code: string) =>
  code.replace(/\/\*[\s\S]*?\*\//g, '').replace(/(^|\s)(\/\/|#).*$/gm, '$1')

export function detectLanguage(source: string): SupportedLanguage {
  const code = stripComments(source)
  const scores: Record<SupportedLanguage, number> = {
    python: score(code, PYTHON_SIGNALS),
    typescript: score(code, TYPESCRIPT_SIGNALS),
    javascript: score(code, JAVASCRIPT_SIGNALS),
  }

  // TypeScript is a superset of JavaScript, so JavaScript signals count towards both.
  if (scores.python > scores.javascript + scores.typescript) return 'python'
  return scores.typescript > 0 ? 'typescript' : 'javascript'
}
