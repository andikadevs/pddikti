// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LogOutIcon, PlugZapIcon, SaveIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { FormField } from '@/components/common/form-field'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ConfigNotice } from './config-notice'
import type { Notice, UpstreamInput, UpstreamView } from './types'

interface ConfigUpstreamFormProps {
  current?: UpstreamView
  solverEnabled: boolean
  notice: Notice | null
  onSave: (input: UpstreamInput) => Promise<boolean>
  onTest: () => Promise<void>
  onLogout: () => Promise<void>
}

function initialInput(current?: UpstreamView): UpstreamInput {
  return {
    baseUrl: current?.baseUrl ?? '',
    userAgent: current?.userAgent ?? '',
    cfClearance: '',
    timeoutMs: current ? String(current.timeoutMs) : '',
    curl: '',
  }
}

/** Form for the upstream base URL, Cloudflare credentials, and timeout. */
export function ConfigUpstreamForm({ current, solverEnabled, notice, onSave, onTest, onLogout }: ConfigUpstreamFormProps) {
  const [input, setInput] = useState(() => initialInput(current))
  const [pending, setPending] = useState(false)
  const set = (key: keyof UpstreamInput) => (e: { target: { value: string } }) => setInput((prev) => ({ ...prev, [key]: e.target.value }))

  async function submit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    // Secrets are write-only: clear them after a successful save.
    if (await onSave(input)) setInput((prev) => ({ ...prev, cfClearance: '', curl: '' }))
    setPending(false)
  }

  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Konfigurasi upstream</CardTitle>
        <CardDescription>
          Kredensial Cloudflare biasanya diperbarui otomatis oleh solver. Isi manual hanya jika otomatis gagal. Kolom kosong
          tidak mengubah nilai yang tersimpan.
        </CardDescription>
        <CardAction>
          <Badge variant={solverEnabled ? 'secondary' : 'ghost'}>Solver {solverEnabled ? 'aktif' : 'nonaktif'}</Badge>
        </CardAction>
      </CardHeader>
      <form onSubmit={submit}>
        <CardContent className="grid gap-5">
          <ConfigNotice notice={notice} />
          <FormField id="base-url" label="Base URL" hint="Kosongkan untuk memakai nilai dari environment.">
            <Input id="base-url" value={input.baseUrl} onChange={set('baseUrl')} placeholder="https://pddikti.kemdiktisaintek.go.id/api" />
          </FormField>
          <FormField id="user-agent" label="User-Agent" hint="Harus sama persis dengan browser yang menerbitkan cf_clearance.">
            <Input id="user-agent" value={input.userAgent} onChange={set('userAgent')} placeholder="Mozilla/5.0 …" />
          </FormField>
          <FormField id="cf-clearance" label="cf_clearance" hint={current?.cfMasked ? `Tersimpan: ${current.cfMasked}` : 'Belum ada token tersimpan.'}>
            <Input id="cf-clearance" type="password" autoComplete="off" value={input.cfClearance} onChange={set('cfClearance')} placeholder="Kosongkan untuk mempertahankan token" />
          </FormField>
          <FormField id="timeout" label="Timeout (ms)">
            <Input id="timeout" inputMode="numeric" value={input.timeoutMs} onChange={set('timeoutMs')} />
          </FormField>
          <FormField id="curl" label='Atau tempel "Copy as cURL"' hint="cf_clearance dan User-Agent diambil otomatis dari perintah cURL.">
            <Textarea id="curl" rows={4} value={input.curl} onChange={set('curl')} className="font-mono text-xs" placeholder="curl 'https://pddikti.kemdiktisaintek.go.id/api/…' -b 'cf_clearance=…' -H 'user-agent: …'" />
          </FormField>
        </CardContent>
        <CardFooter className="mt-5 flex-wrap justify-between gap-2">
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              <SaveIcon data-icon="inline-start" />
              {pending ? 'Menyimpan…' : 'Simpan'}
            </Button>
            <Button type="button" variant="secondary" onClick={() => void onTest()}>
              <PlugZapIcon data-icon="inline-start" />
              Tes koneksi
            </Button>
          </div>
          <Button type="button" variant="ghost" onClick={() => void onLogout()}>
            <LogOutIcon data-icon="inline-start" />
            Keluar
          </Button>
        </CardFooter>
      </form>
    </Card>
  )
}
