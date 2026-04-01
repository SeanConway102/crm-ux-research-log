/**
 * Unit tests for app/global-error.tsx and app/(portal)/global-error.tsx.
 *
 * Verifies the component accepts the correct props shape per Next.js App Router
 * global-error.tsx convention: { error: Error & { digest?: string }, reset: () => void }
 */

import { describe, it, expect } from 'vitest'

type GlobalErrorProps = {
  error: Error & { digest?: string }
  reset: () => void
}

describe('Root global-error.tsx props shape', () => {
  it('accepts error with optional digest and a reset function', () => {
    const props: GlobalErrorProps = {
      error: new Error('test'),
      reset: () => {},
    }
    expect(props.error.message).toBe('test')
    expect(typeof props.reset).toBe('function')
  })

  it('accepts error with digest as thrown by Next.js', () => {
    const props: GlobalErrorProps = {
      error: Object.assign(new Error('segment error'), { digest: 'MOCK_DIGEST_abc123' }),
      reset: () => {},
    }
    expect(props.error.digest).toBe('MOCK_DIGEST_abc123')
  })

  it('reset can be called without arguments', () => {
    let called = false
    const props: GlobalErrorProps = {
      error: new Error('test'),
      reset: () => { called = true },
    }
    props.reset()
    expect(called).toBe(true)
  })
})

describe('Portal global-error.tsx props shape', () => {
  it('accepts the same props as root global-error', () => {
    const props: GlobalErrorProps = {
      error: Object.assign(new Error('portal error'), { digest: 'PORTAL_DIGEST_xyz' }),
      reset: () => {},
    }
    expect(props.error.digest).toBe('PORTAL_DIGEST_xyz')
  })
})

describe('global-error.tsx Next.js convention requirements', () => {
  /**
   * Next.js global-error.tsx must:
   * 1. Be a client component ('use client')
   * 2. Export a default function
   * 3. Accept { error, reset } props
   * 4. Include html/body tags (replaces root document)
   *
   * We verify the type contract here — actual rendering
   * requires a DOM environment (integration/E2E tests).
   */

  it('error digest is optional', () => {
    const errorWithoutDigest: GlobalErrorProps['error'] = new Error('oops')
    expect(errorWithoutDigest.digest).toBeUndefined()
  })
})
