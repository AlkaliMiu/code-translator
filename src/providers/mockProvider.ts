import { getMessages, type Messages, type Variants } from '../i18n'
import type {
  Concept,
  ExplainRequest,
  ExplanationProvider,
  ExplanationResult,
  ExplanationStep,
  ExplanationWarning,
} from '../types/explanation'

type DemoCopy = Messages['demo']

interface CodeBlock {
  start: number
  end: number
  code: string
}

const wait = (milliseconds: number, signal?: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = setTimeout(resolve, milliseconds)
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(timer)
        reject(new DOMException('Request cancelled', 'AbortError'))
      },
      { once: true },
    )
  })

const pick = ([standard, simple]: Variants, simplify: boolean) => (simplify ? simple : standard)

function splitBlocks(code: string): CodeBlock[] {
  const lines = code.split('\n')
  const blocks: CodeBlock[] = []
  let start = -1

  const close = (end: number) => {
    if (start === -1) return
    blocks.push({ start: start + 1, end, code: lines.slice(start, end).join('\n') })
    start = -1
  }

  lines.forEach((current, index) => {
    if (current.trim() && start === -1) start = index
    if (!current.trim()) close(index)
  })
  close(lines.length)

  return blocks.flatMap((block) => {
    if (block.end - block.start < 7) return [block]
    const blockLines = block.code.split('\n')
    return blockLines.reduce<CodeBlock[]>((chunks, _, index) => {
      if (index % 4 === 0) {
        chunks.push({
          start: block.start + index,
          end: Math.min(block.start + index + 3, block.end),
          code: blockLines.slice(index, index + 4).join('\n'),
        })
      }
      return chunks
    }, [])
  }).slice(0, 8)
}

function getPurpose(code: string, simplify: boolean, copy: DemoCopy): string {
  const { purpose } = copy
  if (/\.filter\s*\(/.test(code) && /\.map\s*\(/.test(code)) return pick(purpose.filterMap, simplify)
  if (/\bfetch\s*\(/.test(code)) return pick(purpose.fetch, simplify)
  if (/\binterface\s+\w+/.test(code)) return pick(purpose.typedShape, simplify)
  if (/\[[^\]]+\bfor\b[^\]]+\bif\b[^\]]*\]/s.test(code)) return pick(purpose.comprehension, simplify)
  if (/\bfor\b[\s\S]*\bif\b/.test(code)) return pick(purpose.loopFilter, simplify)
  if (/\b(function|def)\s+\w+/.test(code)) return pick(purpose.function, simplify)
  return pick(purpose.generic, simplify)
}

function describeBlock(block: CodeBlock, request: ExplainRequest, index: number, copy: DemoCopy): Omit<ExplanationStep, 'id'> {
  const { code } = block
  const simple = Boolean(request.simplify) || request.depth === 'beginner'
  const { steps } = copy
  let title = steps.generic.title(index + 1)
  let explanation = pick(steps.generic.text, simple)
  let concepts: string[] = []

  const apply = (step: { title: string; text: Variants; concepts: readonly string[] }) => {
    title = step.title
    explanation = pick(step.text, simple)
    concepts = [...step.concepts]
  }

  if (/\b(interface|type)\s+/.test(code)) {
    apply(steps.typeShape)
  } else if (/\b(async\s+)?function\b|^\s*def\s+/m.test(code)) {
    apply(steps.function)
    if (code.includes('async')) concepts.push(steps.function.asyncConcept)
  } else if (/\bfetch\s*\(|\bawait\b/.test(code)) {
    apply(steps.await)
  } else if (/\.filter\s*\(|\bif\b/.test(code)) {
    apply(steps.condition)
    if (code.includes('.filter')) concepts = ['filter']
  } else if (/\.map\s*\(/.test(code)) {
    apply(steps.map)
  } else if (/\bfor\b|\.forEach\s*\(/.test(code)) {
    apply(steps.loop)
  } else if (/\b(return|print|console\.log)\b/.test(code)) {
    apply(code.includes('return') ? steps.returnValue : steps.output)
  } else if (/\b(const|let|var)\b|\w+\s*=/.test(code)) {
    apply(steps.variable)
  }

  const lines = copy.lines(block.start, block.end)
  return {
    title,
    explanation,
    detail: simple ? copy.detail.simple : copy.detail[request.depth](lines),
    lineStart: block.start,
    lineEnd: block.end,
    concepts,
  }
}

function collectConcepts(code: string, depth: ExplainRequest['depth'], copy: DemoCopy): Concept[] {
  const { concepts } = copy
  const definitions: Array<[RegExp, Concept]> = [
    [/\b(const|let|var)\b|\w+\s*=/, concepts.variable],
    [/\bfor\b|\.forEach\s*\(/, concepts.loop],
    [/\bif\b|\.filter\s*\(/, concepts.condition],
    [/\b(function|def)\b|=>/, concepts.function],
    [/\basync\b|\bawait\b/, concepts.async],
    [/\binterface\b|:\s*(string|number|boolean)/, concepts.type],
    [/\.map\s*\(/, concepts.map],
    [/\.filter\s*\(/, concepts.filter],
    [/\[[^\]]+\bfor\b[^\]]*\]/s, concepts.comprehension],
    [/\breturn\b/, concepts.returnValue],
  ]
  const limit = depth === 'beginner' ? 5 : depth === 'intro' ? 8 : 12
  return definitions.filter(([pattern]) => pattern.test(code)).map(([, concept]) => concept).slice(0, limit)
}

function findLine(code: string, pattern: RegExp): number | undefined {
  const index = code.split('\n').findIndex((item) => pattern.test(item))
  return index >= 0 ? index + 1 : undefined
}

function collectWarnings(code: string, copy: DemoCopy): ExplanationWarning[] {
  const { warnings: text } = copy
  const warnings: ExplanationWarning[] = []
  if (/\bfetch\s*\(/.test(code) && !/\btry\b[\s\S]*\bcatch\b/.test(code)) {
    const lineStart = findLine(code, /fetch\s*\(/)
    warnings.push({ ...text.network, severity: 'caution', lineStart, lineEnd: lineStart })
  }
  if (/\[[^\]]+\]/.test(code) && /\[[a-zA-Z_$][\w$]*\]/.test(code)) {
    warnings.push({ ...text.index, severity: 'caution' })
  }
  if (/\s\/\s/.test(code)) {
    warnings.push({ ...text.division, severity: 'note' })
  }
  if (!warnings.length) {
    warnings.push({ ...text.staticOnly, severity: 'note' })
  }
  return warnings
}

function buildFlow(code: string, simplify: boolean, copy: DemoCopy): string[] {
  const { flow } = copy
  const steps = [pick(flow.prepare, simplify)]
  if (/\bfor\b|\.filter\s*\(|\.map\s*\(/.test(code)) steps.push(pick(flow.iterate, simplify))
  if (/\bfetch\s*\(/.test(code)) steps.push(pick(flow.wait, simplify))
  steps.push(pick(/\b(return|print|console\.log)\b/.test(code) ? flow.output : flow.finish, simplify))
  return steps
}

/** Builds a rule-based explanation entirely in the browser; nothing is sent anywhere. */
export function buildDemoExplanation(request: ExplainRequest): ExplanationResult {
  const copy = getMessages(request.locale).demo
  const simple = Boolean(request.simplify) || request.depth === 'beginner'
  const summary = getPurpose(request.code, simple, copy)
  return {
    summary,
    flow: buildFlow(request.code, simple, copy),
    steps: splitBlocks(request.code).map((block, index) => ({
      id: `step-${index + 1}`,
      ...describeBlock(block, request, index, copy),
    })),
    concepts: collectConcepts(request.code, request.depth, copy),
    warnings: collectWarnings(request.code, copy),
    quiz: {
      question: copy.quiz.question,
      options: [summary, ...copy.quiz.distractors],
      answer: 0,
      explanation: copy.quiz.explanation,
    },
    meta: {
      provider: 'demo',
      generatedAt: new Date().toISOString(),
      disclaimer: copy.disclaimer,
    },
  }
}

export const mockProvider: ExplanationProvider = {
  mode: 'demo',
  async explain(request, signal) {
    // A short pause keeps the loading state visible, like a real request would.
    await wait(650, signal)
    return buildDemoExplanation(request)
  },
}
