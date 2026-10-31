// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useEffect, useState } from 'react'
import { fetchJson } from '@/lib/fetch-json'

/** Loading, error, and data state of one endpoint request. */
export interface EndpointState<T> {
  loading: boolean
  error: string | null
  data: T | null
}

const IDLE = { loading: false, error: null, data: null } as const
const LOADING = { loading: true, error: null, data: null } as const

/** Fetch a JSON endpoint of this API. Pass `null` to skip the request. */
export function useEndpoint<T>(path: string | null): EndpointState<T> {
  const [state, setState] = useState<EndpointState<T>>(path === null ? IDLE : LOADING)

  useEffect(() => {
    if (path === null) {
      setState(IDLE)
      return
    }
    let active = true
    setState(LOADING)
    fetchJson<T>(path).then(
      (data) => active && setState({ loading: false, error: null, data }),
      (err: unknown) =>
        active &&
        setState({ loading: false, error: err instanceof Error ? err.message : 'Network error', data: null }),
    )
    return () => {
      active = false
    }
  }, [path])

  return state
}
