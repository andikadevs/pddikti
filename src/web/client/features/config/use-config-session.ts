// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { useCallback, useEffect, useState } from 'react'
import { configApi } from './config-api'
import type { ConfigState, Notice, UpstreamInput } from './types'

function testNotice(code: number | null): Notice {
  if (code === 200) return { kind: 'success', text: 'Koneksi ke upstream berhasil (200).' }
  const hint = code === 403 ? 'cf_clearance kemungkinan kedaluwarsa, perbarui nilainya.' : 'Periksa base URL dan ketersediaan upstream.'
  return { kind: 'error', text: `Upstream mengembalikan ${code ?? 'galat'}. ${hint}` }
}

/** Config page session: server state, the latest notice, and the actions that change them. */
export function useConfigSession() {
  const [state, setState] = useState<ConfigState | null>(null)
  const [notice, setNotice] = useState<Notice | null>(null)

  const refresh = useCallback(async () => setState(await configApi.state()), [])
  useEffect(() => {
    void refresh()
  }, [refresh])

  const report = (error: string | null, success?: string) =>
    setNotice(error ? { kind: 'error', text: error } : success ? { kind: 'success', text: success } : null)

  return {
    state,
    notice,
    async login(password: string): Promise<boolean> {
      const error = await configApi.login(password)
      report(error)
      if (!error) await refresh()
      return !error
    },
    async save(input: UpstreamInput): Promise<boolean> {
      const error = await configApi.save(input)
      report(error, 'Konfigurasi tersimpan.')
      if (!error) await refresh()
      return !error
    },
    async test(): Promise<void> {
      setNotice(testNotice(await configApi.test()))
    },
    async logout(): Promise<void> {
      await configApi.logout()
      setNotice(null)
      await refresh()
    },
  }
}
