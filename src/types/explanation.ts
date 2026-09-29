export type SupportedLanguage = 'python' | 'javascript' | 'typescript'

export type ExplanationDepth = 'beginner' | 'intro' | 'advanced'

export type ProviderMode = 'demo' | 'ai'

export type AppLocale = 'zh' | 'en'

export interface ExplainRequest {
  code: string
  language: SupportedLanguage
  depth: ExplanationDepth
  locale: AppLocale
  simplify?: boolean
}

export interface ExplanationStep {
  id: string
  title: string
  explanation: string
  detail: string
  lineStart: number
  lineEnd: number
  concepts: string[]
}

export interface Concept {
  name: string
  explanation: string
}

export interface ExplanationWarning {
  title: string
  detail: string
  severity: 'note' | 'caution'
  lineStart?: number
  lineEnd?: number
}

export interface Quiz {
  question: string
  options: string[]
  answer: number
  explanation: string
}

export interface ExplanationResult {
  summary: string
  flow: string[]
  steps: ExplanationStep[]
  concepts: Concept[]
  warnings: ExplanationWarning[]
  quiz: Quiz
  meta: {
    provider: ProviderMode
    generatedAt: string
    disclaimer: string
  }
}

export interface ExplanationProvider {
  readonly mode: ProviderMode
  explain(request: ExplainRequest, signal?: AbortSignal): Promise<ExplanationResult>
}
