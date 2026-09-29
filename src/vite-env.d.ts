/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_AI_PROVIDER?: 'demo' | 'http'
  readonly VITE_AI_ENDPOINT?: string
  readonly VITE_AI_TIMEOUT_MS?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
