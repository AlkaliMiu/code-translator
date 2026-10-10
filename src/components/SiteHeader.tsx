import { ChevronDown, Github, Languages, Moon, Sun } from 'lucide-react'
import { BRAND } from '../config/brand'
import { getMessages, isLocale, LOCALES } from '../i18n'
import type { AppLocale } from '../types/explanation'

interface SiteHeaderProps {
  locale: AppLocale
  theme: 'light' | 'dark'
  isDemo: boolean
  onLocaleChange: (locale: AppLocale) => void
  onThemeToggle: () => void
}

export function SiteHeader({ locale, theme, isDemo, onLocaleChange, onThemeToggle }: SiteHeaderProps) {
  const { ui } = getMessages(locale)
  const themeLabel = theme === 'light' ? ui.themeToDark : ui.themeToLight

  return (
    <header className="site-header">
      <a className="brand" href="./" aria-label={ui.brandHome}>
        <svg className="brand-mark" viewBox="0 0 32 32" aria-hidden="true">
          <rect width="32" height="32" rx="9" />
          <path d="M11.5 10.5 6.5 16l5 5.5M20.5 10.5l5 5.5-5 5.5" />
          <path d="M14.5 21.5h3" />
        </svg>
        <span>{ui.brand}</span>
      </a>

      <div className="header-actions">
        {isDemo && <span className="mode-badge" title={ui.privacyDemo}>{ui.demoMode}</span>}
        <label className="select-control language-select">
          <Languages size={16} aria-hidden="true" />
          <span className="sr-only">{ui.languageLabel}</span>
          <select
            value={locale}
            onChange={(event) => {
              if (isLocale(event.target.value)) onLocaleChange(event.target.value)
            }}
          >
            {LOCALES.map((code) => {
              const { meta } = getMessages(code)
              return <option key={code} value={code} lang={meta.htmlLang}>{meta.nativeName}</option>
            })}
          </select>
          <ChevronDown size={14} aria-hidden="true" />
        </label>
        <button type="button" className="icon-button" onClick={onThemeToggle} aria-label={themeLabel} title={themeLabel}>
          {theme === 'light' ? <Moon size={17} /> : <Sun size={17} />}
        </button>
        <a
          className="icon-button"
          href={BRAND.repoUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={ui.sourceCode}
          title={ui.sourceCode}
        >
          <Github size={17} />
        </a>
      </div>
    </header>
  )
}
