import { useEffect, useState, type FormEvent } from 'react'
import { CONTAINER, Header } from './Layout.tsx'
import { Section } from './ui.tsx'

interface UpstreamView {
  baseUrl: string
  userAgent: string
  cfMasked: string
  timeoutMs: number
}
interface ConfigState {
  enabled: boolean
  authed?: boolean
  solverEnabled?: boolean
  config?: UpstreamView
}
type Msg = { kind: 'ok' | 'err'; text: string } | null

const INPUT = 'w-full border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-secondary'
const LABEL = 'mb-1.5 mt-4 block text-sm font-semibold'
const HINT = 'font-normal text-muted'

function postJson(path: string, body?: unknown): Promise<Response> {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
}

export function ConfigPage() {
  const [state, setState] = useState<ConfigState | null>(null)
  const [msg, setMsg] = useState<Msg>(null)

  const [password, setPassword] = useState('')
  const [baseUrl, setBaseUrl] = useState('')
  const [userAgent, setUserAgent] = useState('')
  const [cfClearance, setCfClearance] = useState('')
  const [timeoutMs, setTimeoutMs] = useState('')
  const [curl, setCurl] = useState('')

  async function refresh(): Promise<ConfigState> {
    const next = (await (await fetch('/config/state')).json()) as ConfigState
    setState(next)
    return next
  }
  useEffect(() => {
    void refresh()
  }, [])

  // Prefill the non-secret fields once, when authenticated data first arrives.
  useEffect(() => {
    if (state?.authed && state.config) {
      setBaseUrl(state.config.baseUrl)
      setUserAgent(state.config.userAgent)
      setTimeoutMs(String(state.config.timeoutMs))
    }
  }, [state?.authed])

  async function login(e: FormEvent): Promise<void> {
    e.preventDefault()
    const res = await postJson('/config/login', { password })
    if (res.ok) {
      setPassword('')
      setMsg(null)
      await refresh()
    } else {
      const j = (await res.json().catch(() => ({}))) as { error?: string }
      setMsg({ kind: 'err', text: j.error ?? 'Login gagal.' })
    }
  }

  async function save(e: FormEvent): Promise<void> {
    e.preventDefault()
    const res = await postJson('/config/save', { baseUrl, userAgent, cfClearance, timeoutMs, curl })
    const j = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string }
    if (res.ok && j.ok) {
      setCfClearance('')
      setCurl('')
      setMsg({ kind: 'ok', text: 'Konfigurasi tersimpan.' })
      await refresh()
    } else {
      setMsg({ kind: 'err', text: j.error ?? 'Gagal menyimpan.' })
    }
  }

  async function test(): Promise<void> {
    const j = (await (await postJson('/config/test')).json().catch(() => ({}))) as { ok?: boolean; code?: number }
    setMsg(
      j.ok
        ? { kind: 'ok', text: 'Koneksi upstream OK (200).' }
        : {
            kind: 'err',
            text: `Upstream mengembalikan ${j.code ?? '?'}. ${j.code === 403 ? 'cf_clearance kemungkinan kedaluwarsa — perbarui.' : 'Periksa base URL / ketersediaan.'}`,
          },
    )
  }

  async function logout(): Promise<void> {
    await postJson('/config/logout')
    setMsg(null)
    await refresh()
  }

  const banner = msg ? (
    <div
      className={`mb-4 border-l-[3px] px-3 py-2.5 text-sm ${msg.kind === 'ok' ? 'border-[#2e7d4f] bg-[#eefaf0] text-[#1c5233]' : 'border-[#9a3b2f] bg-[#fdecea] text-[#7a2b22]'}`}
    >
      {msg.text}
    </div>
  ) : null

  return (
    <>
      <Header />
      <main className="pb-16">
        <div className={`${CONTAINER} pt-8`}>
          {state === null ? (
            <Section title="Konfigurasi Upstream">
              <p className="py-2.5 text-sm text-muted">Memuat…</p>
            </Section>
          ) : !state.enabled ? (
            <Section title="Konfigurasi Upstream">
              <p className="py-2.5 text-sm text-muted">
                Halaman konfigurasi dinonaktifkan. Atur <code>CONFIG_PASSWORD</code> untuk mengaktifkan.
              </p>
            </Section>
          ) : !state.authed ? (
            <Section title="Masuk">
              <p className="mb-4 text-sm text-muted">Masukkan kata sandi untuk mengelola konfigurasi upstream.</p>
              {banner}
              <form onSubmit={login}>
                <label className={LABEL}>Kata sandi</label>
                <input
                  className={INPUT}
                  type="password"
                  autoFocus
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button className="mt-4 bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary" type="submit">
                  Masuk
                </button>
              </form>
            </Section>
          ) : (
            <Section title="Konfigurasi Upstream">
              <p className="mb-3 text-sm text-muted">
                Upstream PDDikti di balik Cloudflare. Kredensial biasanya diisi otomatis oleh solver
                {state.solverEnabled ? ' (aktif)' : ' (nonaktif)'}; isi manual hanya bila otomatis gagal. Nilai kosong = tidak diubah.
              </p>
              {banner}
              <form onSubmit={save}>
                <label className={LABEL}>
                  Base URL <span className={HINT}>(kosong = pakai default env)</span>
                </label>
                <input className={INPUT} type="text" value={baseUrl} onChange={(e) => setBaseUrl(e.target.value)} placeholder="https://pddikti.kemdiktisaintek.go.id/api" />

                <label className={LABEL}>User-Agent</label>
                <input className={INPUT} type="text" value={userAgent} onChange={(e) => setUserAgent(e.target.value)} placeholder="Mozilla/5.0 …" />

                <label className={LABEL}>
                  cf_clearance <span className={HINT}>(kosong = pertahankan yang tersimpan)</span>
                </label>
                <input
                  className={INPUT}
                  type="password"
                  autoComplete="off"
                  value={cfClearance}
                  onChange={(e) => setCfClearance(e.target.value)}
                  placeholder={state.config?.cfMasked || 'cf_clearance=… (belum diatur)'}
                />
                <div className="mt-1 text-xs text-muted">{state.config?.cfMasked || 'Belum ada token tersimpan.'}</div>

                <label className={LABEL}>Timeout (ms)</label>
                <input className={INPUT} type="text" value={timeoutMs} onChange={(e) => setTimeoutMs(e.target.value)} />

                <label className={LABEL}>
                  Atau tempel "Copy as cURL" <span className={HINT}>(otomatis ambil cf_clearance + UA)</span>
                </label>
                <textarea
                  className={`${INPUT} min-h-[90px] resize-y`}
                  value={curl}
                  onChange={(e) => setCurl(e.target.value)}
                  placeholder="curl 'https://pddikti.kemdiktisaintek.go.id/api/...' -b 'cf_clearance=…' -H 'user-agent: …'"
                />

                <button className="mt-5 bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-secondary" type="submit">
                  Simpan
                </button>
              </form>

              <div className="mt-4 flex gap-2">
                <button type="button" onClick={test} className="bg-secondary px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  Tes koneksi
                </button>
                <button type="button" onClick={logout} className="bg-muted px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
                  Keluar
                </button>
              </div>
            </Section>
          )}
        </div>
      </main>
    </>
  )
}
