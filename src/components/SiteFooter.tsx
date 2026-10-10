import { Github, Scale } from 'lucide-react'
import { BRAND } from '../config/brand'
import { getMessages } from '../i18n'
import type { AppLocale } from '../types/explanation'

export function SiteFooter({ locale }: { locale: AppLocale }) {
  const { ui } = getMessages(locale)
  return (
    <footer className="site-footer">
      <div>
        <p><strong>{ui.brand}</strong> · {ui.footerAbout}</p>
        <p>{ui.footerNote}</p>
      </div>
      <nav className="footer-links" aria-label={ui.sourceCode}>
        <a href={`${BRAND.repoUrl}/blob/main/LICENSE`} target="_blank" rel="noreferrer">
          <Scale size={14} aria-hidden="true" /> {ui.license}
        </a>
        <a href={BRAND.repoUrl} target="_blank" rel="noreferrer">
          <Github size={14} aria-hidden="true" /> GitHub
        </a>
      </nav>
    </footer>
  )
}
