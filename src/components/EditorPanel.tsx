import Editor, { type Monaco, type OnMount } from '@monaco-editor/react'
import { Braces, Play, RotateCcw, Sparkles, Trash2 } from 'lucide-react'
import { useEffect, useRef } from 'react'
import type { editor } from 'monaco-editor'
import { BRAND, LANGUAGE_LABELS } from '../config/brand'
import { getCopy } from '../i18n'
import type { AppLocale, SupportedLanguage } from '../types/explanation'

interface EditorPanelProps {
  code: string
  language: SupportedLanguage
  theme: 'light' | 'dark'
  activeRange?: { start: number; end: number }
  isLoading: boolean
  isDemo: boolean
  locale: AppLocale
  onCodeChange: (code: string) => void
  onLanguageChange: (language: SupportedLanguage) => void
  onRun: () => void
  onClear: () => void
  onCursorLine: (line: number) => void
}

export function EditorPanel({
  code,
  language,
  theme,
  activeRange,
  isLoading,
  isDemo,
  locale,
  onCodeChange,
  onLanguageChange,
  onRun,
  onClear,
  onCursorLine,
}: EditorPanelProps) {
  const copy = getCopy(locale)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null)

  const handleMount: OnMount = (instance, monaco: Monaco) => {
    editorRef.current = instance
    monaco.editor.defineTheme('translator-light', {
      base: 'vs',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7a817e', fontStyle: 'italic' },
        { token: 'keyword', foreground: '4f46e5' },
        { token: 'string', foreground: 'a84b13' },
      ],
      colors: {
        'editor.background': '#fbfcff',
        'editorLineNumber.foreground': '#9aa3b2',
        'editorLineNumber.activeForeground': '#4f46e5',
        'editor.lineHighlightBackground': '#f0f2ff',
        'editorCursor.foreground': '#4f46e5',
        'editor.selectionBackground': '#dfe3ff',
      },
    })
    monaco.editor.defineTheme('translator-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '8d9993', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c4b5fd' },
        { token: 'string', foreground: 'fdba74' },
      ],
      colors: {
        'editor.background': '#171922',
        'editorLineNumber.foreground': '#667085',
        'editorLineNumber.activeForeground': '#a5b4fc',
        'editor.lineHighlightBackground': '#212537',
        'editorCursor.foreground': '#a5b4fc',
        'editor.selectionBackground': '#353b66',
      },
    })
    instance.onDidChangeCursorPosition(({ position }) => onCursorLine(position.lineNumber))
  }

  useEffect(() => {
    if (!editorRef.current) return
    decorationsRef.current?.clear()
    if (!activeRange) return

    decorationsRef.current = editorRef.current.createDecorationsCollection([
      {
        range: {
          startLineNumber: activeRange.start,
          startColumn: 1,
          endLineNumber: activeRange.end,
          endColumn: 1,
        },
        options: {
          isWholeLine: true,
          className: 'explanation-line-highlight',
          linesDecorationsClassName: 'explanation-line-marker',
          overviewRuler: {
            color: theme === 'dark' ? '#a5b4fc' : '#4f46e5',
            position: 4,
          },
        },
      },
    ])
    editorRef.current.revealLinesInCenterIfOutsideViewport(activeRange.start, activeRange.end)
  }, [activeRange, theme])

  return (
    <section className="workspace-panel editor-panel" aria-labelledby="editor-title">
      <div className="panel-toolbar">
        <div>
          <div className="eyebrow"><Braces size={14} /> {copy.inputEyebrow}</div>
          <h2 id="editor-title">{copy.codeTitle}</h2>
        </div>
        <div className="toolbar-actions">
          <label className="select-wrap">
            <span className="sr-only">{copy.chooseLanguage}</span>
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
            >
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <button className="icon-button" onClick={onClear} disabled={!code || isLoading} title={copy.clearCode}>
            <Trash2 size={17} />
            <span className="sr-only">{copy.clearCode}</span>
          </button>
        </div>
      </div>

      <div className="editor-shell">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme === 'dark' ? 'translator-dark' : 'translator-light'}
          onMount={handleMount}
          onChange={(value) => onCodeChange(value ?? '')}
          loading={<div className="editor-loading">{copy.editorLoading}</div>}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 23,
            fontFamily: "'SFMono-Regular', Consolas, 'Liberation Mono', monospace",
            padding: { top: 18, bottom: 18 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            renderLineHighlight: 'all',
            accessibilityPageSize: 20,
            ariaLabel: copy.editorLabel,
          }}
        />
      </div>

      <div className="editor-footer">
        <div className="code-meta">
          <span>{code.length.toLocaleString()} / {BRAND.maxCodeLength.toLocaleString()} {copy.chars}</span>
          <span>{code ? code.split('\n').length : 0} {copy.lines}</span>
          {isDemo && <span className="demo-badge"><Sparkles size={12} /> {copy.demoMode}</span>}
        </div>
        <button className="primary-button" onClick={onRun} disabled={!code.trim() || isLoading}>
          {isLoading ? <RotateCcw className="spin" size={17} /> : <Play size={17} fill="currentColor" />}
          {isLoading ? copy.translating : copy.translate}
        </button>
      </div>
    </section>
  )
}
