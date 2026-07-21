import { useEffect, useState } from 'react'

/** State returned by useEndpoint. */
export interface EndpointState<T> {
  loading: boolean
  error: string | null
  data: T | null
  status: number | null
}

function isErrorEnvelope(value: unknown): value is { code: number; error?: string; message?: unknown } {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { code?: unknown }).code === 'number' &&
    (value as { code: number }).code >= 400
  )
}

function messageOf(envelope: { error?: string; message?: unknown }): string {
  if (typeof envelope.message === 'string') return envelope.message
  if (envelope.error) return envelope.error
  return 'Request failed'
}

/** Fetch a proxy JSON endpoint and expose loading/error/data. Pass null to skip. */
export function useEndpoint<T>(path: string | null): EndpointState<T> {
  const [state, setState] = useState<EndpointState<T>>({
    loading: path !== null,
    error: null,
    data: null,
    status: null,
  })

  useEffect(() => {
    if (path === null) return
    let active = true
    setState({ loading: true, error: null, data: null, status: null })

    fetch(path)
      .then(async (res) => {
        const body: unknown = await res.json().catch(() => null)
        if (!active) return
        if (!res.ok || isErrorEnvelope(body)) {
          setState({
            loading: false,
            error: isErrorEnvelope(body) ? messageOf(body) : `HTTP ${res.status}`,
            data: null,
            status: res.status,
          })
          return
        }
        setState({ loading: false, error: null, data: body as T, status: res.status })
      })
      .catch((err: unknown) => {
        if (!active) return
        setState({
          loading: false,
          error: err instanceof Error ? err.message : 'Network error',
          data: null,
          status: null,
        })
      })

    return () => {
      active = false
    }
  }, [path])

  return state
}
