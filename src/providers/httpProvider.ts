import { BRAND } from '../config/brand'
import { formatNumber, getMessages } from '../i18n'
import type { AppLocale, ExplanationProvider } from '../types/explanation'
import { normalizeExplanation } from '../utils/normalize'

const endpoint = (import.meta.env.VITE_AI_ENDPOINT as string | undefined)?.replace(/\/$/, '')
const timeoutMs = Number(import.meta.env.VITE_AI_TIMEOUT_MS) || 25_000

/**
 * Turns a failed response into a message in the reader's language. The backend
 * sends a machine-readable `code`; its English `error` text is only for logs.
 */
export function describeServiceError(body: unknown, status: number, locale: AppLocale): string {
  const { errors } = getMessages(locale)
  const code = body && typeof body === 'object' && 'code' in body ? (body as { code: unknown }).code : undefined
  switch (code) {
    case 'timeout':
      return errors.timeout
    case 'empty_code':
      return errors.emptyCode
    case 'code_too_long':
      return errors.codeTooLong(formatNumber(BRAND.maxCodeLength, locale))
    case 'empty_output':
    case 'invalid_output':
      return errors.invalidResponse
    default:
      return errors.unavailable(status)
  }
}

class ServiceError extends Error {}

export const httpProvider: ExplanationProvider = {
  mode: 'ai',
  async explain(request, externalSignal) {
    const { errors } = getMessages(request.locale)
    if (!endpoint) throw new Error(errors.notConfigured)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort('timeout'), timeoutMs)
    const abortFromOutside = () => controller.abort('cancelled')
    externalSignal?.addEventListener('abort', abortFromOutside, { once: true })

    try {
      const response = await fetch(`${endpoint}/explain`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
        signal: controller.signal,
      })
      const body = (await response.json().catch(() => null)) as unknown
      if (!response.ok) throw new ServiceError(describeServiceError(body, response.status, request.locale))
      if (!body || typeof body !== 'object' || !Array.isArray((body as { steps?: unknown }).steps)) {
        throw new ServiceError(errors.invalidResponse)
      }
      return normalizeExplanation(body, request.code.split('\n').length, request.locale)
    } catch (error) {
      if (controller.signal.aborted && !externalSignal?.aborted) throw new Error(errors.timeout)
      if (error instanceof ServiceError) throw error
      if (externalSignal?.aborted) throw error
      // fetch rejects with a TypeError when the network or CORS fails.
      throw new Error(errors.network)
    } finally {
      clearTimeout(timeout)
      externalSignal?.removeEventListener('abort', abortFromOutside)
    }
  },
}
