import type {
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

export function normalizeExplanation(input: unknown, maxLine: number, locale: 'zh' | 'en' = 'zh'): ExplanationResult {
  const en = locale === 'en'
  const source = object(input)
  const rawSteps = array(source.steps)

  const steps: ExplanationStep[] = rawSteps.slice(0, 12).map((item, index) => {
    const step = object(item)
    const lineStart = line(step.lineStart, index + 1, maxLine)
    const lineEnd = Math.max(lineStart, line(step.lineEnd, lineStart, maxLine))
    return {
      id: text(step.id, `step-${index + 1}`),
      title: text(step.title, en ? `Step ${index + 1}` : `第 ${index + 1} 步`),
      explanation: text(step.explanation, en ? 'This part handles one task in the code.' : '这一部分处理了代码中的一项任务。'),
      detail: text(step.detail, en ? 'Compare it with the highlighted code on the left.' : '可以对照左侧高亮的代码阅读。'),
      lineStart,
      lineEnd,
      concepts: array(step.concepts).map((value) => text(value, '')).filter(Boolean).slice(0, 6),
    }
  })

  const concepts: Concept[] = array(source.concepts).slice(0, 16).map((item) => {
    const concept = object(item)
    return {
      name: text(concept.name, en ? 'Coding concept' : '代码概念'),
      explanation: text(concept.explanation, en ? 'This is a useful programming concept to explore further.' : '这是一项值得继续了解的编程概念。'),
    }
  })

  const warnings: ExplanationWarning[] = array(source.warnings).slice(0, 10).map((item) => {
    const warning = object(item)
    const normalized: ExplanationWarning = {
      title: text(warning.title, en ? 'Something to notice' : '值得留意'),
      detail: text(warning.detail, en ? 'Check this code with real inputs.' : '请结合真实输入检查这段代码。'),
      severity: warning.severity === 'caution' ? 'caution' : 'note',
    }
    if (warning.lineStart !== undefined) normalized.lineStart = line(warning.lineStart, 1, maxLine)
    if (warning.lineEnd !== undefined) normalized.lineEnd = line(warning.lineEnd, normalized.lineStart ?? 1, maxLine)
    return normalized
  })

  const rawQuiz = object(source.quiz)
  const options = array(rawQuiz.options).map((value) => text(value, '')).filter(Boolean).slice(0, 4)
  while (options.length < 2) options.push(options.length ? (en ? 'None of the above' : '以上都不对') : (en ? 'It processes a group of data' : '它会处理一组数据'))
  const rawAnswer = typeof rawQuiz.answer === 'number' ? rawQuiz.answer : Number(rawQuiz.answer)
  const answer = Number.isInteger(rawAnswer) && rawAnswer >= 0 && rawAnswer < options.length ? rawAnswer : 0
  const quiz: Quiz = {
    question: text(rawQuiz.question, en ? 'What is the main purpose of this code?' : '这段代码最主要的目的是什么？'),
    options,
    answer,
    explanation: text(rawQuiz.explanation, en ? 'Return to the overview and say it again in your own words.' : '回到概览卡片，再用自己的话复述一次。'),
  }

  return {
    summary: text(source.summary, en ? 'This code performs a data-processing task.' : '这段代码完成了一项数据处理任务。'),
    flow: array(source.flow).map((value) => text(value, '')).filter(Boolean).slice(0, 8),
    steps,
    concepts,
    warnings,
    quiz,
    meta: {
      provider: 'ai',
      generatedAt: new Date().toISOString(),
      disclaimer: en ? 'This AI-generated explanation may contain mistakes or omissions. Verify important code with documentation and tests.' : '解释由 AI 生成，可能有遗漏或错误；重要代码请结合文档与实际测试核对。',
    },
  }
}
