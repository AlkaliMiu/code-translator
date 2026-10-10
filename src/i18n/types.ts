import type { ExampleId } from '../data/examples'
import type { Concept, ExplanationDepth } from '../types/explanation'

/** One sentence in its standard wording and in a simpler, more conversational wording. */
export type Variants = readonly [standard: string, simple: string]

export interface Callout {
  title: string
  detail: string
}

export interface StepCopy {
  title: string
  text: Variants
  concepts: readonly string[]
}

/**
 * Every string a locale must provide. TypeScript rejects a dictionary that
 * misses a key, so a new language cannot ship half-translated.
 */
export interface Messages {
  meta: {
    /** Name shown in the language menu, written in the language itself. */
    nativeName: string
    /** BCP 47 tag used for `<html lang>`, number formatting and font selection. */
    htmlLang: string
  }
  ui: {
    brand: string
    tagline: string
    brandHome: string
    languageLabel: string
    themeToDark: string
    themeToLight: string
    sourceCode: string
    heroLine1: string
    heroLine2: string
    heroIntro: string
    examplesLabel: string
    depthLabel: string
    depth: Record<ExplanationDepth, readonly [label: string, description: string]>
    codeTitle: string
    chooseLanguage: string
    clearCode: string
    editorLabel: string
    editorLoading: string
    charCount: (count: string, max: string) => string
    lineCount: (count: number) => string
    demoMode: string
    translate: string
    translating: string
    loadingTitle: string
    loadingBody: string
    errorTitle: string
    retry: string
    emptyTitle: string
    emptyBody: string
    /** Plain-language reading of `for item in cart:` in the empty-state illustration. */
    emptyIllustration: string
    stepHint: string
    neverRun: string
    resultTitle: string
    simplify: string
    demoNoticeTitle: string
    demoNoticeBody: string
    summaryTitle: string
    flowTitle: string
    stepsTitle: string
    lineRange: (start: number, end: number) => string
    conceptsTitle: string
    warningsTitle: string
    quizTitle: string
    checkAnswer: string
    correct: string
    incorrect: string
    privacyDemo: string
    privacyAi: string
    footerAbout: string
    footerNote: string
    license: string
    limit: (max: string) => string
  }
  errors: {
    notConfigured: string
    timeout: string
    network: string
    unavailable: (status: number) => string
    invalidResponse: string
    codeTooLong: (max: string) => string
    emptyCode: string
    unknown: string
  }
  /** Defaults used when an AI response leaves a field empty. */
  fallback: {
    summary: string
    stepTitle: (index: number) => string
    stepExplanation: string
    stepDetail: string
    conceptName: string
    conceptExplanation: string
    warningTitle: string
    warningDetail: string
    quizQuestion: string
    quizOption: string
    quizNoneOfTheAbove: string
    quizExplanation: string
    disclaimer: string
  }
  /** Text for the offline demo provider. */
  demo: {
    purpose: Record<'filterMap' | 'fetch' | 'typedShape' | 'comprehension' | 'loopFilter' | 'function' | 'generic', Variants>
    steps: {
      generic: { title: (index: number) => string; text: Variants }
      typeShape: StepCopy
      function: StepCopy & { asyncConcept: string }
      await: StepCopy
      condition: StepCopy
      map: StepCopy
      loop: StepCopy
      returnValue: StepCopy
      output: StepCopy
      variable: StepCopy
    }
    /** A line reference that fits inside the `detail` sentences, e.g. "lines 4–6". */
    lines: (start: number, end: number) => string
    detail: {
      simple: string
      beginner: (lines: string) => string
      intro: (lines: string) => string
      advanced: (lines: string) => string
    }
    concepts: Record<'variable' | 'loop' | 'condition' | 'function' | 'async' | 'type' | 'map' | 'filter' | 'comprehension' | 'returnValue', Concept>
    warnings: Record<'network' | 'index' | 'division' | 'staticOnly', Callout>
    flow: Record<'prepare' | 'iterate' | 'wait' | 'output' | 'finish', Variants>
    quiz: {
      question: string
      distractors: readonly [string, string]
      explanation: string
    }
    disclaimer: string
  }
  /** Titles and string literals for the built-in examples. */
  samples: {
    examples: Record<ExampleId, readonly [title: string, description: string]>
    products: readonly [string, string, string]
    requestFailed: string
    /** Body of a template literal; may use `${user.name}` and `${user.age}`. */
    greeting: string
    userName: string
  }
}
