import type { ExplanationProvider } from '../types/explanation'
import { normalizeExplanation } from '../utils/normalize'

const endpoint = (import.meta.env.VITE_AI_ENDPOINT as string | undefined)?.replace(/\/$/, '')
const timeoutMs = Number(import.meta.env.VITE_AI_TIMEOUT_MS) || 25_000

export const httpProvider: ExplanationProvider = {
  mode: 'ai',
  async explain(request, externalSignal) {
    const en = request.locale === 'en'
    if (!endpoint) throw new Error(en ? 'The AI service URL is not configured. Use Demo mode or set VITE_AI_ENDPOINT.' : '尚未配置 AI 服务地址，请改用 Demo 模式或设置 VITE_AI_ENDPOINT。')

    const controller = new AbortController()
    const timeout = window.setTimeout(() => controller.abort('timeout'), timeoutMs)
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
      if (!response.ok) {
        const message = body && typeof body === 'object' && 'error' in body
          ? String((body as { error: unknown }).error)
          : en ? `The AI service is unavailable (${response.status}).` : `AI 服务暂时不可用（${response.status}）`
        throw new Error(message)
      }
      return normalizeExplanation(body, request.code.split('\n').length, request.locale)
    } catch (error) {
      if (controller.signal.aborted && !externalSignal?.aborted) {
        throw new Error(en ? 'The AI service timed out. Please try again.' : 'AI 服务响应超时，请稍后重试。')
      }
      if (error instanceof Error) throw error
      throw new Error(en ? 'Could not reach the AI service. Check your connection or try again later.' : '无法连接 AI 服务，请检查网络或稍后重试。')
    } finally {
      window.clearTimeout(timeout)
      externalSignal?.removeEventListener('abort', abortFromOutside)
    }
  },
}
