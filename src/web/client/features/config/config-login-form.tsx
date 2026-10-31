// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { LockIcon } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { FormField } from '@/components/common/form-field'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { ConfigNotice } from './config-notice'
import type { Notice } from './types'

interface ConfigLoginFormProps {
  notice: Notice | null
  onLogin: (password: string) => Promise<boolean>
}

/** Password prompt that unlocks the config page. */
export function ConfigLoginForm({ notice, onLogin }: ConfigLoginFormProps) {
  const [password, setPassword] = useState('')
  const [pending, setPending] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setPending(true)
    if (await onLogin(password)) setPassword('')
    setPending(false)
  }

  return (
    <Card className="mx-auto w-full max-w-sm">
      <CardHeader>
        <span className="mb-2 flex size-10 items-center justify-center rounded-full bg-secondary text-secondary-foreground">
          <LockIcon className="size-5" />
        </span>
        <CardTitle>Masuk ke konfigurasi</CardTitle>
        <CardDescription>Masukkan kata sandi operator untuk mengelola akses upstream.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={submit} className="grid gap-4">
          <ConfigNotice notice={notice} />
          <FormField id="config-password" label="Kata sandi">
            <Input id="config-password" type="password" autoComplete="current-password" autoFocus required value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <Button type="submit" disabled={pending || password === ''}>
            {pending ? 'Memeriksa…' : 'Masuk'}
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
