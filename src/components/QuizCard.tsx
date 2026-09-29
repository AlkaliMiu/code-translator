import { CheckCircle2, CircleHelp, XCircle } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { Quiz } from '../types/explanation'
import type { AppLocale } from '../types/explanation'
import { getCopy } from '../i18n'

export function QuizCard({ quiz, locale }: { quiz: Quiz; locale: AppLocale }) {
  const copy = getCopy(locale)
  const [selected, setSelected] = useState<number | null>(null)
  const [submitted, setSubmitted] = useState(false)

  useEffect(() => {
    setSelected(null)
    setSubmitted(false)
  }, [quiz])

  const correct = selected === quiz.answer

  return (
    <section className="result-card quiz-card" aria-labelledby="quiz-title">
      <div className="section-heading">
        <span className="section-icon lavender"><CircleHelp size={17} /></span>
        <div>
          <p className="section-kicker">{copy.quizKicker}</p>
          <h3 id="quiz-title">{copy.quizTitle}</h3>
        </div>
      </div>
      <p className="quiz-question">{quiz.question}</p>
      <div className="quiz-options" role="radiogroup" aria-label={quiz.question}>
        {quiz.options.map((option, index) => (
          <button
            key={`${option}-${index}`}
            className={`quiz-option ${selected === index ? 'selected' : ''} ${submitted && index === quiz.answer ? 'correct' : ''}`}
            role="radio"
            aria-checked={selected === index}
            onClick={() => {
              setSelected(index)
              setSubmitted(false)
            }}
          >
            <span>{String.fromCharCode(65 + index)}</span>
            {option}
          </button>
        ))}
      </div>
      {!submitted ? (
        <button className="secondary-button" disabled={selected === null} onClick={() => setSubmitted(true)}>
          {copy.checkAnswer}
        </button>
      ) : (
        <div className={correct ? 'quiz-feedback correct' : 'quiz-feedback incorrect'} role="status">
          {correct ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          <div>
            <strong>{correct ? copy.correct : copy.incorrect}</strong>
            <p>{quiz.explanation}</p>
          </div>
        </div>
      )}
    </section>
  )
}
