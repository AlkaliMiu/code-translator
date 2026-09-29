import type { ExplanationProvider } from '../types/explanation'
import { httpProvider } from './httpProvider'
import { mockProvider } from './mockProvider'

const configuredProvider = import.meta.env.VITE_AI_PROVIDER

export const explanationProvider: ExplanationProvider =
  configuredProvider === 'http' ? httpProvider : mockProvider

export const isDemoMode = explanationProvider.mode === 'demo'
