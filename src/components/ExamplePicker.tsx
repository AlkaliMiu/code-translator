import { EXAMPLES, type CodeExample } from '../data/examples'
import { getMessages } from '../i18n'
import type { AppLocale } from '../types/explanation'

interface ExamplePickerProps {
  selectedId: string
  onSelect: (example: CodeExample) => void
  locale: AppLocale
}

export function ExamplePicker({ selectedId, onSelect, locale }: ExamplePickerProps) {
  const { ui, samples } = getMessages(locale)
  return (
    <div className="example-picker" role="group" aria-labelledby="examples-label">
      <span id="examples-label" className="example-label">{ui.examplesLabel}</span>
      <div className="example-list">
        {EXAMPLES.map((example) => {
          const [title, description] = samples.examples[example.id]
          return (
            <button
              key={example.id}
              type="button"
              className="example-chip"
              aria-pressed={selectedId === example.id}
              title={description}
              onClick={() => onSelect(example)}
            >
              <span className={`language-dot ${example.language}`} aria-hidden="true" />
              {title}
              <span className="sr-only">: {description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
