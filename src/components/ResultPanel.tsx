import { CloudOff, Info, RefreshCw, Sparkles, TriangleAlert } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { getMessages } from '../i18n'
import type { AppLocale, ExplanationResult } from '../types/explanation'
import { InlineText } from './InlineText'
import { QuizCard } from './QuizCard'

interface ResultPanelProps {
  result: ExplanationResult | null
  isLoading: boolean
  error: string | null
  activeStepId: string | null
  pinnedStepId: string | null
  isDemo: boolean
  locale: AppLocale
  onStepHover: (stepId: string | null) => void
  onStepSelect: (stepId: string) => void
  onSimplify: () => void
  onRetry: () => void
}

export function ResultPanel({
  result,
  isLoading,
  error,
  activeStepId,
  pinnedStepId,
  isDemo,
  locale,
  onStepHover,
  onStepSelect,
  onSimplify,
  onRetry,
}: ResultPanelProps) {
  const { ui } = getMessages(locale)
  const bodyRef = useRef<HTMLDivElement>(null)

  // Follow the pinned step (e.g. after clicking a code line) without jumping around on hover.
  useEffect(() => {
    if (!pinnedStepId) return
    const card = bodyRef.current?.querySelector<HTMLElement>(`[data-step-id="${CSS.escape(pinnedStepId)}"]`)
    card?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [pinnedStepId])

  if (isLoading) {
    return (
      <section className="panel result-panel state-panel" aria-live="polite" aria-busy="true">
        <div className="state-copy">
          <h2>{ui.loadingTitle}</h2>
          <p>{ui.loadingBody}</p>
        </div>
        <div className="skeleton" aria-hidden="true">
          <span className="skeleton-heading" />
          <span /><span /><span className="short" />
          <span className="skeleton-heading" />
          <span /><span className="short" />
        </div>
      </section>
    )
  }

  if (error) {
    return (
      <section className="panel result-panel state-panel centered" role="alert">
        <span className="state-icon"><CloudOff size={24} /></span>
        <h2>{ui.errorTitle}</h2>
        <p>{error}</p>
        <button type="button" className="secondary-button" onClick={onRetry}><RefreshCw size={15} /> {ui.retry}</button>
      </section>
    )
  }

  if (!result) {
    return (
      <section className="panel result-panel state-panel centered empty-state">
        <div className="empty-illustration" aria-hidden="true">
          <code>for item in cart:</code>
          <span className="empty-arrow">→</span>
          <span className="empty-words">{ui.emptyIllustration}</span>
        </div>
        <h2>{ui.emptyTitle}</h2>
        <p>{ui.emptyBody}</p>
        <ul className="empty-tips">
          <li>{ui.stepHint}</li>
          <li>{ui.neverRun}</li>
        </ul>
      </section>
    )
  }

  return (
    <section className="panel result-panel" aria-labelledby="result-title">
      <div className="panel-header">
        <h2 id="result-title">{ui.resultTitle}</h2>
        <button type="button" className="ghost-button" onClick={onSimplify}>
          <Sparkles size={15} /> {ui.simplify}
        </button>
      </div>

      <div className="result-body" ref={bodyRef}>
        {isDemo && (
          <p className="demo-notice" role="status">
            <Info size={15} aria-hidden="true" />
            <span><strong>{ui.demoNoticeTitle}</strong> · {ui.demoNoticeBody}</span>
          </p>
        )}

        <section className="result-section" aria-labelledby="summary-title">
          <h3 id="summary-title" className="section-title">{ui.summaryTitle}</h3>
          <p className="summary"><InlineText text={result.summary} /></p>
        </section>

        {!!result.flow.length && (
          <section className="result-section" aria-labelledby="flow-title">
            <h3 id="flow-title" className="section-title">{ui.flowTitle}</h3>
            <ol className="flow-list">
              {result.flow.map((item, index) => (
                <li key={`${item}-${index}`}><InlineText text={item} /></li>
              ))}
            </ol>
          </section>
        )}

        <section className="result-section" aria-labelledby="steps-title">
          <div className="section-title-row">
            <h3 id="steps-title" className="section-title">{ui.stepsTitle}</h3>
            <span className="section-hint">{ui.stepHint}</span>
          </div>
          <ol className="step-list">
            {result.steps.map((step) => {
              const pinned = pinnedStepId === step.id
              return (
                <li key={step.id}>
                  <article
                    data-step-id={step.id}
                    className={['step', activeStepId === step.id && 'active', pinned && 'pinned'].filter(Boolean).join(' ')}
                    tabIndex={0}
                    role="button"
                    aria-pressed={pinned}
                    onMouseEnter={() => onStepHover(step.id)}
                    onMouseLeave={() => onStepHover(null)}
                    onFocus={() => onStepHover(step.id)}
                    onBlur={() => onStepHover(null)}
                    onClick={() => onStepSelect(step.id)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onStepSelect(step.id)
                      }
                    }}
                  >
                    <div className="step-heading">
                      <h4>{step.title}</h4>
                      <span className="line-ref">{ui.lineRange(step.lineStart, step.lineEnd)}</span>
                    </div>
                    <p><InlineText text={step.explanation} /></p>
                    <p className="step-detail"><InlineText text={step.detail} /></p>
                    {!!step.concepts.length && (
                      <ul className="tag-list">
                        {step.concepts.map((concept) => <li key={concept}>{concept}</li>)}
                      </ul>
                    )}
                  </article>
                </li>
              )
            })}
          </ol>
        </section>

        {!!result.concepts.length && (
          <section className="result-section" aria-labelledby="concepts-title">
            <h3 id="concepts-title" className="section-title">{ui.conceptsTitle}</h3>
            <dl className="concept-list">
              {result.concepts.map((concept) => (
                <div key={concept.name}>
                  <dt>{concept.name}</dt>
                  <dd><InlineText text={concept.explanation} /></dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        {!!result.warnings.length && (
          <section className="result-section" aria-labelledby="warnings-title">
            <h3 id="warnings-title" className="section-title">{ui.warningsTitle}</h3>
            <ul className="callout-list">
              {result.warnings.map((warning, index) => (
                <li key={`${warning.title}-${index}`} className={`callout ${warning.severity}`}>
                  {warning.severity === 'caution'
                    ? <TriangleAlert size={16} aria-hidden="true" />
                    : <Info size={16} aria-hidden="true" />}
                  <div>
                    <strong>{warning.title}</strong>
                    {warning.lineStart !== undefined && (
                      <span className="line-ref">{ui.lineRange(warning.lineStart, warning.lineEnd ?? warning.lineStart)}</span>
                    )}
                    <p><InlineText text={warning.detail} /></p>
                  </div>
                </li>
              ))}
            </ul>
          </section>
        )}

        <QuizCard key={result.meta.generatedAt} quiz={result.quiz} locale={locale} />

        <p className="disclaimer">{result.meta.disclaimer}</p>
      </div>
    </section>
  )
}
