import { Code2, Globe2, Moon, ShieldCheck, Sun } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { DepthPicker } from './components/DepthPicker'
import { EditorPanel } from './components/EditorPanel'
import { ExamplePicker } from './components/ExamplePicker'
import { ResultPanel } from './components/ResultPanel'
import { BRAND } from './config/brand'
import { EXAMPLES, type CodeExample } from './data/examples'
import { getCopy } from './i18n'
import { explanationProvider, isDemoMode } from './providers'
import type {
  ExplanationDepth,
  ExplanationResult,
  AppLocale,
  SupportedLanguage,
} from './types/explanation'
import { detectLanguage } from './utils/language'

type Theme = 'light' | 'dark'

const firstExample = EXAMPLES[0]

function getInitialTheme(): Theme {
  const saved = localStorage.getItem('code-translator-theme')
  if (saved === 'light' || saved === 'dark') return saved
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function getInitialLocale(): AppLocale {
  const saved = localStorage.getItem('code-translator-locale')
  if (saved === 'zh' || saved === 'en') return saved
  return navigator.language.toLowerCase().startsWith('zh') ? 'zh' : 'en'
}

export default function App() {
  const [code, setCode] = useState(firstExample.code)
  const [language, setLanguage] = useState<SupportedLanguage>(firstExample.language)
  const [depth, setDepth] = useState<ExplanationDepth>('beginner')
  const [selectedExample, setSelectedExample] = useState(firstExample.id)
  const [result, setResult] = useState<ExplanationResult | null>(null)
  const [activeStepId, setActiveStepId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [limitMessage, setLimitMessage] = useState<string | null>(null)
  const [theme, setTheme] = useState<Theme>(getInitialTheme)
  const [locale, setLocale] = useState<AppLocale>(getInitialLocale)
  const requestRef = useRef<AbortController | null>(null)
  const copy = getCopy(locale)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    localStorage.setItem('code-translator-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.lang = copy.htmlLang
    document.title = copy.brand
    localStorage.setItem('code-translator-locale', locale)
  }, [copy, locale])

  useEffect(() => () => requestRef.current?.abort(), [])

  const activeRange = useMemo(() => {
    const step = result?.steps.find((item) => item.id === activeStepId)
    return step ? { start: step.lineStart, end: step.lineEnd } : undefined
  }, [activeStepId, result])

  const handleCodeChange = (nextCode: string) => {
    requestRef.current?.abort()
    setIsLoading(false)
    const clamped = nextCode.slice(0, BRAND.maxCodeLength)
    if (nextCode.length > BRAND.maxCodeLength) {
      setLimitMessage(copy.limit(BRAND.maxCodeLength.toLocaleString()))
    } else {
      setLimitMessage(null)
    }
    if (Math.abs(clamped.length - code.length) > 20 && clamped.trim()) {
      setLanguage(detectLanguage(clamped))
      setSelectedExample('')
    }
    setCode(clamped)
    setResult(null)
    setError(null)
    setActiveStepId(null)
  }

  const handleExample = (example: CodeExample) => {
    requestRef.current?.abort()
    setIsLoading(false)
    setCode(locale === 'en' ? example.codeEn : example.code)
    setLanguage(example.language)
    setSelectedExample(example.id)
    setResult(null)
    setError(null)
    setActiveStepId(null)
    setLimitMessage(null)
  }

  const explain = useCallback(async (simplify = false) => {
    if (!code.trim()) return
    requestRef.current?.abort()
    const controller = new AbortController()
    requestRef.current = controller
    setIsLoading(true)
    setError(null)
    setActiveStepId(null)

    try {
      const nextResult = await explanationProvider.explain(
        { code, language, depth, locale, simplify },
        controller.signal,
      )
      if (!controller.signal.aborted) setResult(nextResult)
    } catch (caught) {
      if (controller.signal.aborted) return
      setError(caught instanceof Error ? caught.message : copy.httpError)
    } finally {
      if (!controller.signal.aborted) setIsLoading(false)
    }
  }, [code, copy.httpError, depth, language, locale])

  const changeLocale = (nextLocale: AppLocale) => {
    if (nextLocale === locale) return
    requestRef.current?.abort()
    setIsLoading(false)
    setLocale(nextLocale)
    setResult(null)
    setError(null)
    setActiveStepId(null)
    const example = EXAMPLES.find((item) => item.id === selectedExample)
    if (example) setCode(nextLocale === 'en' ? example.codeEn : example.code)
  }

  const handleCursorLine = (line: number) => {
    const matchingStep = result?.steps.find((step) => line >= step.lineStart && line <= step.lineEnd)
    setActiveStepId(matchingStep?.id ?? null)
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="./" aria-label={copy.brandHome}>
          <span className="brand-mark"><Code2 size={21} /></span>
          <span>
            <strong>{copy.brand}</strong>
            <small>Code, explained.</small>
          </span>
        </a>
        <div className="header-actions">
          <div className="locale-switcher" role="group" aria-label={copy.languageLabel}>
            <Globe2 size={15} aria-hidden="true" />
            <button className={locale === 'zh' ? 'active' : ''} onClick={() => changeLocale('zh')} aria-pressed={locale === 'zh'}>{copy.chinese}</button>
            <span aria-hidden="true">/</span>
            <button className={locale === 'en' ? 'active' : ''} onClick={() => changeLocale('en')} aria-pressed={locale === 'en'}>{copy.english}</button>
          </div>
          <span className="privacy-pill"><ShieldCheck size={15} /> {copy.noExecution}</span>
          <button
            className="icon-button theme-toggle"
            onClick={() => setTheme((current) => current === 'light' ? 'dark' : 'light')}
            aria-label={theme === 'light' ? (locale === 'en' ? 'Switch to dark theme' : '切换到深色主题') : (locale === 'en' ? 'Switch to light theme' : '切换到浅色主题')}
            title={theme === 'light' ? (locale === 'en' ? 'Switch to dark theme' : '切换到深色主题') : (locale === 'en' ? 'Switch to light theme' : '切换到浅色主题')}
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>
        </div>
      </header>

      <main>
        <section className="hero" aria-labelledby="page-title">
          <div>
            <p className="hero-kicker">{copy.heroKicker}</p>
            <h1 id="page-title">{copy.heroLine1}<br /><em>{copy.heroLine2}</em></h1>
          </div>
          <p className="hero-intro">{copy.heroIntro}</p>
        </section>

        <section className="control-bar" aria-label="翻译设置">
          <ExamplePicker selectedId={selectedExample} onSelect={handleExample} locale={locale} />
          <DepthPicker
            value={depth}
            locale={locale}
            onChange={(nextDepth) => {
              requestRef.current?.abort()
              setIsLoading(false)
              setDepth(nextDepth)
              setResult(null)
              setError(null)
            }}
          />
        </section>

        {limitMessage && <div className="limit-message" role="alert">{limitMessage}</div>}

        <div className="workspace-grid">
          <EditorPanel
            code={code}
            language={language}
            theme={theme}
            activeRange={activeRange}
            isLoading={isLoading}
            isDemo={isDemoMode}
            locale={locale}
            onCodeChange={handleCodeChange}
            onLanguageChange={(nextLanguage) => {
              requestRef.current?.abort()
              setIsLoading(false)
              setLanguage(nextLanguage)
              setSelectedExample('')
              setResult(null)
            }}
            onRun={() => void explain(false)}
            onClear={() => {
              requestRef.current?.abort()
              setIsLoading(false)
              setCode('')
              setResult(null)
              setError(null)
              setSelectedExample('')
            }}
            onCursorLine={handleCursorLine}
          />
          <ResultPanel
            result={result}
            isLoading={isLoading}
            error={error}
            activeStepId={activeStepId}
            isDemo={isDemoMode}
            locale={locale}
            onStepActive={setActiveStepId}
            onSimplify={() => void explain(true)}
            onRetry={() => void explain(false)}
          />
        </div>

        <aside className="privacy-note">
          <ShieldCheck size={18} />
          <div>
            <strong>{copy.privacyTitle}</strong>
            <p>{isDemoMode
              ? copy.privacyDemo
              : copy.privacyAi}</p>
          </div>
        </aside>
      </main>

      <footer>
        <span>{copy.footerLeft}</span>
        <span>{copy.footerRight}</span>
      </footer>
    </div>
  )
}
