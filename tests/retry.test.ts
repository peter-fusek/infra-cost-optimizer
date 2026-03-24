import { describe, it, expect, vi } from 'vitest'
import { withRetry } from '../server/utils/retry'

describe('withRetry', () => {
  it('returns result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('ok')
    const result = await withRetry(fn, { attempts: 3 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('retries on retryable errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, { attempts: 3, baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('retries on 5xx status errors', async () => {
    const fn = vi.fn()
      .mockRejectedValueOnce(Object.assign(new Error('HTTP 503'), { status: 503 }))
      .mockResolvedValue('ok')

    const result = await withRetry(fn, { attempts: 3, baseDelayMs: 1 })
    expect(result).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry on non-retryable errors', async () => {
    const fn = vi.fn().mockRejectedValue(new Error('Bad input'))

    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow('Bad input')
    expect(fn).toHaveBeenCalledTimes(1)
  })

  it('throws after all attempts exhausted', async () => {
    const fn = vi.fn().mockRejectedValue(new TypeError('fetch failed'))

    await expect(withRetry(fn, { attempts: 2, baseDelayMs: 1 })).rejects.toThrow('fetch failed')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  it('does not retry on AbortError (timeout)', async () => {
    const fn = vi.fn().mockRejectedValue(new DOMException('Aborted', 'AbortError'))

    await expect(withRetry(fn, { attempts: 3, baseDelayMs: 1 })).rejects.toThrow()
    expect(fn).toHaveBeenCalledTimes(1)
  })
})
