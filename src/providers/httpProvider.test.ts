import { describe, expect, it } from 'vitest'
import { getMessages } from '../i18n'
import { describeServiceError } from './httpProvider'

describe('describeServiceError', () => {
  it('maps backend error codes to the reader’s language', () => {
    const { errors } = getMessages('es')
    expect(describeServiceError({ code: 'timeout', error: 'The AI service timed out.' }, 504, 'es')).toBe(errors.timeout)
    expect(describeServiceError({ code: 'invalid_output' }, 502, 'es')).toBe(errors.invalidResponse)
    expect(describeServiceError({ code: 'code_too_long' }, 413, 'de')).toBe(getMessages('de').errors.codeTooLong('12.000'))
  })

  it('falls back to a status message for unknown or missing codes', () => {
    expect(describeServiceError(null, 503, 'ja')).toBe(getMessages('ja').errors.unavailable(503))
    expect(describeServiceError({ code: 'something_new' }, 500, 'ru')).toBe(getMessages('ru').errors.unavailable(500))
  })
})
