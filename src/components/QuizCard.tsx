import { CircleCheck, CircleX } from 'lucide-react'
import { useId, useState } from 'react'
import { getMessages } from '../i18n'
import type { AppLocale, Quiz } from '../types/explanation'
import { InlineText } from './InlineText'

/** Remount with a new `key` for each explanation to reset the answer. */
export function QuizCard({ quiz, locale }: { quiz: Quiz; locale: AppLocale }) {
  const { ui } = getMessages(locale)
  const name = useId()
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)
  const correct = selected === quiz.answer

  return (
    <section className="result-section quiz" aria-labelledby={`${name}-title`}>
      <h3 id={`${name}-title`} className="section-title">{ui.quizTitle}</h3>
      <fieldset className="quiz-options">
        <legend className="quiz-question"><InlineText text={quiz.question} /></legend>
        {quiz.options.map((option, index) => {
          const state = submitted && index === quiz.answer ? 'correct' : submitted && index === selected ? 'wrong' : ''
          return (
            <label key={`${option}-${index}`} className={['quiz-option', selected === index && 'selected', state].filter(Boolean).join(' ')}>
              <input
                type="radio"
                name={name}
                checked={selected === index}
                onChange={() => {
                  setSelected(index)
                  setSubmitted(false)
                }}
              />
              <span className="quiz-letter" aria-hidden="true">{String.fromCharCode(65 + index)}</span>
              <span><InlineText text={option} /></span>
            </label>
          )
        })}
      </fieldset>
      {!submitted ? (
        <button type="button" className="secondary-button" disabled={selected === null} onClick={() => setSubmitted(true)}>
          {ui.checkAnswer}
        </button>
      ) : (
        <div className={correct ? 'quiz-feedback correct' : 'quiz-feedback incorrect'} role="status">
          {correct ? <CircleCheck size={18} aria-hidden="true" /> : <CircleX size={18} aria-hidden="true" />}
          <div>
            <strong>{correct ? ui.correct : ui.incorrect}</strong>
            <p><InlineText text={quiz.explanation} /></p>
          </div>
        </div>
      )}
    </section>
  )
}
