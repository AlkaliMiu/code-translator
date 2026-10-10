import { ShieldCheck } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DepthPicker } from './components/DepthPicker'
import { EditorPanel } from './components/EditorPanel'
import { ExamplePicker } from './components/ExamplePicker'
import { ResultPanel } from './components/ResultPanel'
import { SiteFooter } from './components/SiteFooter'
import { SiteHeader } from './components/SiteHeader'
import { BRAND } from './config/brand'
import { EXAMPLES, getExampleCode, type CodeExample } from './data/examples'
import { DEFAULT_LOCALE, formatNumber, getMessages, isLocale } from './i18n'
import { explanationProvider, isDemoMode } from './providers'
import type {
  AppLocale,
  ExplanationDepth,
  ExplanationResult,
  SupportedLanguage,
} from './types/explanation'
import { detectLanguage } from './utils/language'

type Theme = 'light' | 'dark'

const THEME_KEY = 'code-translator-theme'
const LOCALE_KEY = 'code-translator-locale'
const firstExample = EXAMPLES[0]

// Storage can throw (private browsing, blocked cookies); the app then simply forgets preferences.
function readSetting(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function writeSetting(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    // Keep the choice for this visit only.
  }
}

function getInitialTheme(): Theme {
  const saved = readSetting(THEME_KEY)
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialLocale(): AppLocale {
  const saved = readSetting(LOCALE_KEY)
  return isLocale(saved) ? saved : DEFAULT_LOCALE
}

export default function App() {
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [code, setCode] = useState(() => getExampleCode(firstExample, locale))
  const [language, setLanguage] = useState<SupportedLanguage>(firstExample.language)
  const [depth, setDepth] = useState<ExplanationDepth>('beginner')
  const [selectedExample, setSelectedExample] = useState<string>(firstExample.id)
  const [result, setResult] = useState<ExplanationResult | null>(null)
  const [pinnedStepId, setPinnedStepId] = useState<string | null>(null)
  const [hoveredStepId, setHoveredStepId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const requestRef = useRef<AbortController | null>(null)
  const { ui, errors, meta } = getMessages(locale)
  const activeStepId = hoveredStepId ?? pinnedStepId

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = meta.htmlLang
    document.title = `${ui.brand} · ${ui.tagline}`
  }, [meta.htmlLang, ui.brand, ui.tagline])

  useEffect(() => () => requestRef.current?.abort(), [])

  const activeRange = useMemo(() => {
    const step = result?.steps.find((item) => item.id === activeStepId)
    return step ? { start: step.lineStart, end: step.lineEnd } : undefined
  }, [activeStepId, result])

  const cancelRequest = () => {
    requestRef.current?.abort()
    setIsLoading(false)
  }

  const clearResult = () => {
    setResult(null)
    setError(null)
    setPinnedStepId(null)
    setHoveredStepId(null)
  }

  const handleCodeChange = (nextCode: string) => {
    cancelRequest()
    const clamped = nextCode.slice(0, BRAND.maxCodeLength)
    setLimitMessage(nextCode.length > BRAND.maxCodeLength ? ui.limit(formatNumber(BRAND.maxCodeLength, locale)) : null)
    // A large jump in length means a paste: guess the language and drop the example selection.
    if (Math.abs(clamped.length - code.length) > 20 && clamped.trim()) {
      setLanguage(detectLanguage(clamped))
      setSelectedExample('')
    }
    setCode(clamped)
    clearResult()
  }

  const handleExample = (example: CodeExample) => {
    cancelRequest()
    setCode(getExampleCode(example, locale))
    setLanguage(example.language)
    setSelectedExample(example.id)
    setLimitMessage(null)
    clearResult()
  }

  const explain = useCallback(async (simplify = false) => {
    if (!code.trim()) return
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setIsLoading(true)
    setError(null)
    setPinnedStepId(null)
    setHoveredStepId(null)

    try {
      const nextResult = await explanationProvider.explain(
        { code, language, depth, locale, simplify },
        controller.signal,
      )
      if (!controller.signal.aborted) setResult(nextResult)
    } catch (caught) {
      if (controller.signal.aborted) return
      setError(caught instanceof Error ? caught.message : errors.unknown)
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [code, depth, errors.unknown, language, locale])

  const changeLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return
    cancelRequest()
    setLocale(nextLocale)
    writeSetting(LOCALE_KEY, nextLocale)
    clearResult()
    setLimitMessage(null)
    const example = EXAMPLES.find((item) => item.id === selectedExample)
    if (example) setCode(getExampleCode(example, nextLocale))
  }

  const toggleTheme = () => {
    const nextTheme = theme === 'light' ? 'dark' : 'light'
    setTheme(nextTheme)
    writeSetting(THEME_KEY, nextTheme)
  }

  const handleCursorLine = (line: number) => {
    const matchingStep = result?.steps.find((step) => line >= step.lineStart && line <= step.lineEnd)
    setPinnedStepId(matchingStep?.id ?? null)
  }

  return (
    <div className="app-shell">
      <SiteHeader
        locale={locale}
        theme={theme}
        isDemo={isDemoMode}
        onLocaleChange={changeLocale}
        onThemeToggle={toggleTheme}
      />

      <main>
        <section className="hero" aria-labelledby="page-title">
          <h1 id="page-title">{ui.heroLine1}<br /><em>{ui.heroLine2}</em></h1>
          <p>{ui.heroIntro}</p>
        </section>

        {limitMessage && <div className="limit-message" role="alert">{limitMessage}</div>}

        <div className="workspace">
          <EditorPanel
            code={code}
            language={language}
            theme={theme}
            activeRange={activeRange}
            isLoading={isLoading}
            locale={locale}
            examplePicker={<ExamplePicker selectedId={selectedExample} onSelect={handleExample} locale={locale} />}
            depthPicker={(
              <DepthPicker
                value={depth}
                locale={locale}
                onChange={(nextDepth) => {
                  cancelRequest()
                  setDepth(nextDepth)
                  clearResult()
                }}
              />
            )}
            onCodeChange={handleCodeChange}
            onLanguageChange={(nextLanguage) => {
              cancelRequest()
              setLanguage(nextLanguage)
              setSelectedExample('')
              clearResult()
            }}
            onRun={() => void explain(false)}
            onClear={() => {
              cancelRequest()
              setCode('')
              setSelectedExample('')
              setLimitMessage(null)
              clearResult()
            }}
            onCursorLine={handleCursorLine}
          />
          <ResultPanel
            result={result}
            isLoading={isLoading}
            error={error}
            activeStepId={activeStepId}
            pinnedStepId={pinnedStepId}
            isDemo={isDemoMode}
            locale={locale}
            onStepHover={setHoveredStepId}
            onStepSelect={(stepId) => setPinnedStepId((current) => (current === stepId ? null : stepId))}
            onSimplify={() => void explain(true)}
            onRetry={() => void explain(false)}
          />
        </div>

        <p className="privacy-note">
          <ShieldCheck size={16} aria-hidden="true" />
          <span>{isDemoMode ? ui.privacyDemo : ui.privacyAi}</span>
        </p>
      </main>

      <SiteFooter locale={locale} />
    </div>
  )
}
