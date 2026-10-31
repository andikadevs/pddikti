// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import type { ReactNode } from 'react'
import type { EndpointState } from '@/hooks/use-endpoint'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { LoadingLines } from '@/components/common/loading-lines'

interface AsyncContentProps<T> {
  state: EndpointState<T>
  children: (data: T) => ReactNode
  isEmpty?: (data: T) => boolean
  loading?: ReactNode
  empty?: ReactNode
}

/** Renders the loading, error, or empty state of a request, or its data when ready. */
export function AsyncContent<T>({ state, children, isEmpty, loading, empty }: AsyncContentProps<T>) {
  if (state.loading) return <>{loading ?? <LoadingLines />}</>
  if (state.error) return <ErrorState message={state.error} />
  if (state.data === null || isEmpty?.(state.data)) return <>{empty ?? <EmptyState title="Tidak ada data" />}</>
  return <>{children(state.data)}</>
}
