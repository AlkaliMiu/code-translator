import { getCopy } from '../i18n'
import type { AppLocale, ExplanationDepth } from '../types/explanation'

interface DepthPickerProps {
  value: ExplanationDepth
  onChange: (depth: ExplanationDepth) => void
  locale: AppLocale
}

const depthOrder: ExplanationDepth[] = ['beginner', 'intro', 'advanced']

export function DepthPicker({ value, onChange, locale }: DepthPickerProps) {
  const copy = getCopy(locale)
  return (
    <fieldset className="depth-picker">
      <legend>{copy.depthLegend}</legend>
      <div className="depth-options">
        {depthOrder.map((key) => {
          const [label, description] = copy.depth[key]
          return (
            <label key={key} className={value === key ? 'depth-option active' : 'depth-option'}>
              <input
                type="radio"
                name="depth"
                value={key}
                checked={value === key}
                onChange={() => onChange(key)}
              />
              <span>{label}</span>
              <small>{description}</small>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
