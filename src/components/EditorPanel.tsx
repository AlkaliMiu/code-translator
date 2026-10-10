import Editor, { type BeforeMount, type OnMount } from '@monaco-editor/react'
import { ChevronDown, LoaderCircle, Play, Trash2 } from 'lucide-react'
import { useEffect, useRef, type ReactNode } from 'react'
import type { editor } from 'monaco-editor'
import { BRAND, LANGUAGE_LABELS } from '../config/brand'
import { formatNumber, getMessages } from '../i18n'
import type { AppLocale, SupportedLanguage } from '../types/explanation'

interface EditorPanelProps {
  code: string
  language: SupportedLanguage
  theme: 'light' | 'dark'
  activeRange?: { start: number; end: number }
  isLoading: boolean
  locale: AppLocale
  examplePicker: ReactNode
  depthPicker: ReactNode
  onCodeChange: (code: string) => void
  onLanguageChange: (language: SupportedLanguage) => void
  onRun: () => void
  onClear: () => void
  onCursorLine: (line: number) => void
}

const isMac = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.userAgent)

const defineThemes: BeforeMount = (monaco) => {
  monaco.editor.defineTheme('translator-light', {
    base: 'vs',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '8a8f87', fontStyle: 'italic' },
      { token: 'keyword', foreground: '1b6f73' },
      { token: 'string', foreground: 'a0522d' },
      { token: 'number', foreground: '8a5a00' },
      { token: 'type', foreground: '6a4fb3' },
    ],
    colors: {
      'editor.background': '#fdfcfa',
      'editorLineNumber.foreground': '#b0aea6',
      'editorLineNumber.activeForeground': '#1f6f5c',
      'editor.lineHighlightBackground': '#f5f3ee',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#1f6f5c',
      'editor.selectionBackground': '#d6ebe3',
      'editorIndentGuide.background1': '#ebe8e1',
    },
  })
  monaco.editor.defineTheme('translator-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '7d8590', fontStyle: 'italic' },
      { token: 'keyword', foreground: '7fd1c7' },
      { token: 'string', foreground: 'e5a87b' },
      { token: 'number', foreground: 'e3c17c' },
      { token: 'type', foreground: 'c3a6f2' },
    ],
    colors: {
      'editor.background': '#1b1e21',
      'editorLineNumber.foreground': '#5c636a',
      'editorLineNumber.activeForeground': '#6fd0b0',
      'editor.lineHighlightBackground': '#22262a',
      'editor.lineHighlightBorder': '#00000000',
      'editorCursor.foreground': '#6fd0b0',
      'editor.selectionBackground': '#2c4a41',
      'editorIndentGuide.background1': '#2a2e33',
    },
  })
}

export function EditorPanel({
  code,
  language,
  theme,
  activeRange,
  isLoading,
  locale,
  examplePicker,
  depthPicker,
  onCodeChange,
  onLanguageChange,
  onRun,
  onClear,
  onCursorLine,
}: EditorPanelProps) {
  const { ui } = getMessages(locale)
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null)
  const decorationsRef = useRef<editor.IEditorDecorationsCollection | null>(null)
  // Monaco keeps the listeners registered on mount, so they read the latest callbacks through refs.
  const runRef = useRef(onRun)
  const cursorLineRef = useRef(onCursorLine)
  const canRun = Boolean(code.trim()) && !isLoading
  const canRunRef = useRef(canRun)

  useEffect(() => {
    runRef.current = onRun
    cursorLineRef.current = onCursorLine
    canRunRef.current = canRun
  })

  const handleMount: OnMount = (instance, monaco) => {
    editorRef.current = instance
    instance.onDidChangeCursorPosition(({ position, source }) => {
      if (source === 'mouse' || source === 'keyboard') cursorLineRef.current(position.lineNumber)
    })
    instance.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      if (canRunRef.current) runRef.current()
    })
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
          overviewRuler: { color: theme === 'dark' ? '#e3c15a' : '#d4a72c', position: 4 },
        },
      },
    ])
    editorRef.current.revealLinesInCenterIfOutsideViewport(activeRange.start, activeRange.end)
  }, [activeRange, theme])

  const lineCount = code ? code.split('\n').length : 0

  return (
    <section className="panel editor-panel" aria-labelledby="editor-title">
      <div className="panel-header">
        <div className="panel-heading">
          <h2 id="editor-title">{ui.codeTitle}</h2>
          <p className="panel-meta">
            {ui.charCount(formatNumber(code.length, locale), formatNumber(BRAND.maxCodeLength, locale))}
            <span aria-hidden="true"> · </span>
            {ui.lineCount(lineCount)}
          </p>
        </div>
        <div className="toolbar-actions">
          <label className="select-control">
            <span className="sr-only">{ui.chooseLanguage}</span>
            <select
              value={language}
              onChange={(event) => onLanguageChange(event.target.value as SupportedLanguage)}
            >
              {Object.entries(LANGUAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
            <ChevronDown size={14} aria-hidden="true" />
          </label>
          <button
            type="button"
            className="icon-button"
            onClick={onClear}
            disabled={!code || isLoading}
            aria-label={ui.clearCode}
            title={ui.clearCode}
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>

      {examplePicker}

      <div className="editor-shell">
        <Editor
          height="100%"
          language={language}
          value={code}
          theme={theme === 'dark' ? 'translator-dark' : 'translator-light'}
          beforeMount={defineThemes}
          onMount={handleMount}
          onChange={(value) => onCodeChange(value ?? '')}
          loading={<div className="editor-loading">{ui.editorLoading}</div>}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineHeight: 23,
            fontFamily: "ui-monospace, 'SF Mono', 'Cascadia Code', 'JetBrains Mono', Menlo, Consolas, 'Liberation Mono', monospace",
            padding: { top: 16, bottom: 16 },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            automaticLayout: true,
            tabSize: 2,
            wordWrap: 'on',
            lineNumbersMinChars: 3,
            renderLineHighlight: 'line',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            accessibilityPageSize: 20,
            ariaLabel: ui.editorLabel,
          }}
        />
      </div>

      <div className="editor-footer">
        {depthPicker}
        <button type="button" className="primary-button" onClick={onRun} disabled={!canRun} title={`${ui.translate} (${isMac ? '⌘' : 'Ctrl'} + Enter)`}>
          {isLoading ? <LoaderCircle className="spin" size={17} /> : <Play size={16} fill="currentColor" />}
          <span>{isLoading ? ui.translating : ui.translate}</span>
          <kbd aria-hidden="true">{isMac ? '⌘' : 'Ctrl'} ↵</kbd>
        </button>
      </div>
    </section>
  )
}
