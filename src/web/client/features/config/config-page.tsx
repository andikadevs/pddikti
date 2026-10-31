// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { SettingsIcon } from 'lucide-react'
import { EmptyState } from '@/components/common/empty-state'
import { LoadingLines } from '@/components/common/loading-lines'
import { PageContainer } from '@/components/layout/page-container'
import { ConfigLoginForm } from './config-login-form'
import { ConfigUpstreamForm } from './config-upstream-form'
import { useConfigSession } from './use-config-session'

function ConfigContent() {
  const session = useConfigSession()
  const { state, notice } = session

  if (state === null) return <LoadingLines lines={4} />
  if (!state.enabled) {
    return (
      <EmptyState
        icon={SettingsIcon}
        title="Halaman konfigurasi nonaktif"
        description={
          <>
            Atur <code className="font-mono">CONFIG_PASSWORD</code> di environment untuk mengaktifkannya.
          </>
        }
      />
    )
  }
  if (!state.authed) return <ConfigLoginForm notice={notice} onLogin={session.login} />
  return (
    <ConfigUpstreamForm
      current={state.config}
      solverEnabled={state.solverEnabled ?? false}
      notice={notice}
      onSave={session.save}
      onTest={session.test}
      onLogout={session.logout}
    />
  )
}

/** Operator page for the upstream connection settings. */
export function ConfigPage() {
  return (
    <PageContainer className="pt-10 sm:pt-16">
      <ConfigContent />
    </PageContainer>
  )
}
