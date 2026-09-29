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
  /\bas\s+(const|\w+)/,
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

export function detectLanguage(code: string): SupportedLanguage {
  const scores: Record<SupportedLanguage, number> = {
    python: score(code, PYTHON_SIGNALS),
    typescript: score(code, TYPESCRIPT_SIGNALS),
    javascript: score(code, JAVASCRIPT_SIGNALS),
  }

  if (scores.typescript > 0 && scores.typescript >= scores.javascript) return 'typescript'
  if (scores.python > scores.javascript) return 'python'
  return 'javascript'
}
