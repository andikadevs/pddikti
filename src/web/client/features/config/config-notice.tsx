// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { CircleAlertIcon, CircleCheckIcon } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import type { Notice } from './types'

/** Success or error message after a config action. */
export function ConfigNotice({ notice }: { notice: Notice | null }) {
  if (!notice) return null
  const error = notice.kind === 'error'
  return (
    <Alert variant={error ? 'destructive' : 'default'}>
      {error ? <CircleAlertIcon /> : <CircleCheckIcon className="text-success" />}
      <AlertDescription>{notice.text}</AlertDescription>
    </Alert>
  )
}
