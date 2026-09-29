import {
  AlertTriangle,
  ArrowDown,
  BookMarked,
  BrainCircuit,
  ChevronRight,
  CloudOff,
  Footprints,
  Lightbulb,
  LoaderCircle,
  MousePointer2,
  RefreshCw,
  Sparkles,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { getCopy } from '../i18n'
import type { AppLocale, ExplanationResult } from '../types/explanation'
import { QuizCard } from './QuizCard'

interface ResultPanelProps {
  result: ExplanationResult | null
  isLoading: boolean
  error: string | null
  activeStepId: string | null
  isDemo: boolean
  locale: AppLocale
  onStepActive: (stepId: string | null) => void
  onSimplify: () => void
  onRetry: () => void
}

export function ResultPanel({
  result,
  isLoading,
  error,
  activeStepId,
  isDemo,
  locale,
  onStepActive,
  onSimplify,
  onRetry,
}: ResultPanelProps) {
  const copy = getCopy(locale)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!activeStepId) return
    const activeCard = panelRef.current?.querySelector<HTMLElement>(`[data-step-id="${activeStepId}"]`)
    activeCard?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [activeStepId])

  if (isLoading) {
    return (
      <section className="workspace-panel result-panel state-panel" aria-live="polite">
        <div className="loading-orbit"><LoaderCircle size={30} /></div>
        <h2>{copy.loadingTitle}</h2>
        <p>{copy.loadingBody}</p>
        <div className="skeleton-stack" aria-hidden="true">
          <span /><span /><span />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="workspace-panel result-panel state-panel" role="alert">
        <span className="state-icon error"><CloudOff size={26} /></span>
        <h2>{copy.errorTitle}</h2>
        <p>{error}</p>
        <button className="secondary-button" onClick={onRetry}><RefreshCw size={16} /> {copy.retry}</button>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="workspace-panel result-panel state-panel empty-state">
        <div className="empty-illustration" aria-hidden="true">
          <span className="code-chip">for item</span>
          <ArrowDown size={20} />
          <span className="words-chip">{locale === 'en' ? 'check each item' : '逐个查看'}</span>
        </div>
        <h2>{copy.emptyCodeTitle}</h2>
        <p>{copy.emptyCodeBody}</p>
        <div className="empty-tips">
          <span><MousePointer2 size={15} /> {copy.clickTip}</span>
          <span><BookMarked size={15} /> {copy.staticTip}</span>
        </div>
      </section>
    )
  }

  return (
    <section className="workspace-panel result-panel" aria-labelledby="result-title" ref={panelRef}>
      <div className="result-toolbar">
        <div>
          <div className="eyebrow"><BookMarked size={14} /> {copy.explanationEyebrow}</div>
          <h2 id="result-title">{copy.resultTitle}</h2>
        </div>
        <button className="simplify-button" onClick={onSimplify}>
          <Sparkles size={15} /> {copy.simplify}
        </button>
      </div>

      {isDemo && (
        <div className="demo-notice" role="status">
          <Sparkles size={15} />
          <span><strong>{copy.demoNoticeTitle}</strong> · {copy.demoNoticeBody}</span>
        </div>
      )}

      <div className="result-content">
        <section className="result-card overview-card">
          <p className="section-kicker">{copy.conclusion}</p>
          <h3>{result.summary}</h3>
        </section>

        <section className="result-card flow-card">
          <div className="section-heading">
            <span className="section-icon mint"><Footprints size={17} /></span>
            <div>
              <p className="section-kicker">{copy.overallFlow}</p>
              <h3>{copy.dataFlow}</h3>
            </div>
          </div>
          <ol className="flow-list">
            {result.flow.map((item, index) => (
              <li key={`${item}-${index}`}>
                <span>{index + 1}</span>
                <p>{item}</p>
                {index < result.flow.length - 1 && <ChevronRight size={16} aria-hidden="true" />}
              </li>
            ))}
          </ol>
        </section>

        <section className="steps-section" aria-labelledby="steps-title">
          <div className="section-heading standalone">
            <span className="section-icon yellow"><BrainCircuit size={17} /></span>
            <div>
              <p className="section-kicker">{copy.breakdown}</p>
              <h3 id="steps-title">{copy.walkthrough}</h3>
            </div>
            <span className="interaction-hint">{copy.interactionHint}</span>
          </div>
          <div className="step-list">
            {result.steps.map((step, index) => (
              <article
                key={step.id}
                data-step-id={step.id}
                className={`step-card ${activeStepId === step.id ? 'active' : ''}`}
                tabIndex={0}
                role="button"
                aria-pressed={activeStepId === step.id}
                onMouseEnter={() => onStepActive(step.id)}
                onMouseLeave={() => onStepActive(null)}
                onFocus={() => onStepActive(step.id)}
                onBlur={() => onStepActive(null)}
                onClick={() => onStepActive(step.id)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onStepActive(step.id)
                  }
                }}
              >
                <div className="step-number">{String(index + 1).padStart(2, '0')}</div>
                <div className="step-body">
                  <div className="step-title-row">
                    <h4>{step.title}</h4>
                    <span className="line-badge">{copy.linePrefix} {step.lineStart}{step.lineEnd > step.lineStart ? `–${step.lineEnd}` : ''} {copy.lineSuffix}</span>
                  </div>
                  <p>{step.explanation}</p>
                  <small>{step.detail}</small>
                  {!!step.concepts.length && (
                    <div className="inline-tags">
                      {step.concepts.map((concept) => <span key={concept}>{concept}</span>)}
                    </div>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        {!!result.concepts.length && (
          <section className="result-card concepts-card">
            <div className="section-heading">
              <span className="section-icon blue"><Lightbulb size={17} /></span>
              <div>
                <p className="section-kicker">{copy.conceptsKicker}</p>
                <h3>{copy.conceptsTitle}</h3>
              </div>
            </div>
            <div className="concept-grid">
              {result.concepts.map((concept) => (
                <details key={concept.name}>
                  <summary>{concept.name}<span>＋</span></summary>
                  <p>{concept.explanation}</p>
                </details>
              ))}
            </div>
          </section>
        )}

        <section className="result-card warnings-card">
          <div className="section-heading">
            <span className="section-icon coral"><AlertTriangle size={17} /></span>
            <div>
              <p className="section-kicker">{copy.warningsKicker}</p>
              <h3>{copy.warningsTitle}</h3>
            </div>
          </div>
          <div className="warning-list">
            {result.warnings.map((warning, index) => (
              <div key={`${warning.title}-${index}`} className={`warning-item ${warning.severity}`}>
                <strong>{warning.title}</strong>
                <p>{warning.detail}</p>
              </div>
            ))}
          </div>
        </section>

        <QuizCard quiz={result.quiz} locale={locale} />

        <p className="result-disclaimer">{result.meta.disclaimer}</p>
      </div>
    </section>
  )
}
