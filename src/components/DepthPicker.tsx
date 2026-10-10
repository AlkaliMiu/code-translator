import { getMessages } from '../i18n'
import type { AppLocale, ExplanationDepth } from '../types/explanation'

interface DepthPickerProps {
  value: ExplanationDepth
  onChange: (depth: ExplanationDepth) => void
  locale: AppLocale
}

const depthOrder: ExplanationDepth[] = ['beginner', 'intro', 'advanced']

export function DepthPicker({ value, onChange, locale }: DepthPickerProps) {
  const { ui } = getMessages(locale)
  return (
    <fieldset className="depth-picker">
      <legend>
        {ui.depthLabel}
        <span className="depth-hint"> · {ui.depth[value][1]}</span>
      </legend>
      <div className="segmented">
        {depthOrder.map((key) => {
          const [label, description] = ui.depth[key]
          return (
            <label key={key} className={value === key ? 'segment active' : 'segment'} title={description}>
              <input
                type="radio"
                name="depth"
                value={key}
                checked={value === key}
                onChange={() => onChange(key)}
              />
              <span>{label}</span>
            </label>
          )
        })}
      </div>
    </fieldset>
  )
}
