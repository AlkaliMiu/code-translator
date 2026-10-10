import { DEFAULT_LOCALE, getMessages } from '../i18n'
import type {
  AppLocale,
  Concept,
  ExplanationResult,
  ExplanationStep,
  ExplanationWarning,
  Quiz,
} from '../types/explanation'

const text = (value: unknown, fallback: string) =>
  typeof value === 'string' && value.trim() ? value.trim() : fallback

const object = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}

const array = (value: unknown): unknown[] => (Array.isArray(value) ? value : [])

const line = (value: unknown, fallback: number, maxLine: number) => {
  const parsed = typeof value === 'number' ? value : Number(value)
  return Math.min(Math.max(Number.isFinite(parsed) ? Math.round(parsed) : fallback, 1), maxLine)
}

export function normalizeExplanation(input: unknown, maxLine: number, locale: AppLocale = DEFAULT_LOCALE): ExplanationResult {
  const fallback = getMessages(locale).fallback
  const source = object(input)
  const rawSteps = array(source.steps)

  const steps: ExplanationStep[] = rawSteps.slice(0, 12).map((item, index) => {
    const step = object(item)
    const lineStart = line(step.lineStart, index + 1, maxLine)
    const lineEnd = Math.max(lineStart, line(step.lineEnd, lineStart, maxLine))
    return {
      id: text(step.id, `step-${index + 1}`),
      title: text(step.title, fallback.stepTitle(index + 1)),
      explanation: text(step.explanation, fallback.stepExplanation),
      detail: text(step.detail, fallback.stepDetail),
      lineStart,
      lineEnd,
      concepts: array(step.concepts).map((value) => text(value, '')).filter(Boolean).slice(0, 6),
    }
  })

  const concepts: Concept[] = array(source.concepts).slice(0, 16).map((item) => {
    const concept = object(item)
    return {
      name: text(concept.name, fallback.conceptName),
      explanation: text(concept.explanation, fallback.conceptExplanation),
    }
  })

  const warnings: ExplanationWarning[] = array(source.warnings).slice(0, 10).map((item) => {
    const warning = object(item)
    const normalized: ExplanationWarning = {
      title: text(warning.title, fallback.warningTitle),
      detail: text(warning.detail, fallback.warningDetail),
      severity: warning.severity === 'caution' ? 'caution' : 'note',
    }
    if (warning.lineStart !== undefined) normalized.lineStart = line(warning.lineStart, 1, maxLine)
    if (warning.lineEnd !== undefined) normalized.lineEnd = line(warning.lineEnd, normalized.lineStart ?? 1, maxLine)
    return normalized
  })

  const rawQuiz = object(source.quiz)
  const options = array(rawQuiz.options).map((value) => text(value, '')).filter(Boolean).slice(0, 4)
  while (options.length < 2) options.push(options.length ? fallback.quizNoneOfTheAbove : fallback.quizOption)
  const rawAnswer = typeof rawQuiz.answer === 'number' ? rawQuiz.answer : Number(rawQuiz.answer)
  const answer = Number.isInteger(rawAnswer) && rawAnswer >= 0 && rawAnswer < options.length ? rawAnswer : 0
  const quiz: Quiz = {
    question: text(rawQuiz.question, fallback.quizQuestion),
    options,
    answer,
    explanation: text(rawQuiz.explanation, fallback.quizExplanation),
  }

  return {
    summary: text(source.summary, fallback.summary),
    flow: array(source.flow).map((value) => text(value, '')).filter(Boolean).slice(0, 8),
    steps,
    concepts,
    warnings,
    quiz,
    meta: {
      provider: 'ai',
      generatedAt: new Date().toISOString(),
      disclaimer: fallback.disclaimer,
    },
  }
}
