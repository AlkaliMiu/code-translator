import { BookOpen, ChevronDown } from 'lucide-react'
import { EXAMPLES, type CodeExample } from '../data/examples'
import { getCopy } from '../i18n'
import type { AppLocale } from '../types/explanation'

interface ExamplePickerProps {
  selectedId: string
  onSelect: (example: CodeExample) => void
  locale: AppLocale
}

export function ExamplePicker({ selectedId, onSelect, locale }: ExamplePickerProps) {
  const copy = getCopy(locale)
  return (
    <label className="example-picker">
      <BookOpen size={16} aria-hidden="true" />
      <span>{copy.tryExample}</span>
      <select
        value={selectedId}
        onChange={(event) => {
          const example = EXAMPLES.find((item) => item.id === event.target.value)
          if (example) onSelect(example)
        }}
        aria-label={copy.tryExample}
      >
        {!selectedId && <option value="" disabled>{copy.selectExample}</option>}
        {EXAMPLES.map((example) => (
          <option key={example.id} value={example.id}>
            {locale === 'en' ? example.titleEn : example.title} · {locale === 'en' ? example.descriptionEn : example.description}
          </option>
        ))}
      </select>
      <ChevronDown size={15} aria-hidden="true" />
    </label>
  )
}
