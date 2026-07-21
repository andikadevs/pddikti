import { useState, type ReactNode } from 'react'
import type { EndpointState } from '../hooks/use-endpoint.ts'

/**
 * A titled content block with an accent marker. Flat card body. Collapsible:
 * the title toggles the body open/closed like an accordion (open by default).
 */
export function Section({
  title,
  children,
  defaultOpen = true,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <section className="mt-7">
      <h2 className="mb-3">
        <button
          type="button"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2.5 text-left text-base font-semibold text-primary"
        >
          <span className="inline-block h-[18px] w-1 bg-accent" />
          <span className="flex-1">{title}</span>
          <span
            className={`text-muted transition-transform ${open ? 'rotate-90' : ''}`}
            aria-hidden
          >
            ▸
          </span>
        </button>
      </h2>
      {open ? <div className="border border-line bg-surface p-5">{children}</div> : null}
    </section>
  )
}

export function Skeleton({ className = 'h-4 w-full' }: { className?: string }) {
  return <div className={`animate-pulse bg-line ${className}`} aria-hidden />
}

export function ErrorNote({ message }: { message: string }) {
  return <p className="py-2.5 text-sm text-[#9a3b2f]">Tidak dapat memuat data: {message}</p>
}

export function EmptyNote({ message = 'Tidak ada data.' }: { message?: string }) {
  return <p className="py-2.5 text-sm text-muted">{message}</p>
}

/** Render loading/error/empty states for an endpoint. */
export function Async<T>({
  state,
  isEmpty,
  children,
}: {
  state: EndpointState<T>
  isEmpty?: (data: T) => boolean
  children: (data: T) => ReactNode
}) {
  if (state.loading) {
    return (
      <div className="grid gap-2.5">
        <Skeleton className="h-4 w-3/5" />
        <Skeleton className="h-4 w-4/5" />
        <Skeleton className="h-4 w-2/5" />
      </div>
    )
  }
  if (state.error) return <ErrorNote message={state.error} />
  if (state.data === null || (isEmpty && isEmpty(state.data))) return <EmptyNote />
  return <>{children(state.data)}</>
}

export function StatCard({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) {
  return (
    <div className="border border-line bg-surface p-5">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div className="mt-1 text-[26px] font-bold text-primary">{value}</div>
      {hint ? <div className="mt-0.5 text-xs text-muted">{hint}</div> : null}
    </div>
  )
}

export function InfoRow({ k, v }: { k: string; v: ReactNode }) {
  return (
    <div className="flex justify-between gap-4 border-b border-dashed border-line py-2.5 last:border-b-0">
      <span className="text-sm text-muted">{k}</span>
      <span className="text-right font-semibold">{v}</span>
    </div>
  )
}

const BADGE_TONES = {
  plain: 'border border-white/25 bg-white/15 text-white',
  good: 'bg-accent text-[#3a2600]',
  solid: 'bg-white text-primary',
} as const

export function Badge({
  children,
  tone = 'plain',
}: {
  children: ReactNode
  tone?: keyof typeof BADGE_TONES
}) {
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold ${BADGE_TONES[tone]}`}>
      {children}
    </span>
  )
}

/** Flat table primitives shared by prodi/lecturers/students. */
export function Table({ head, children }: { head: ReactNode; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr>{head}</tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  )
}

export function Th({ children, right = false }: { children: ReactNode; right?: boolean }) {
  return (
    <th
      className={`border-b-2 border-line px-3 py-2.5 text-xs uppercase tracking-wide text-muted ${right ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}

export function Td({ children, right = false }: { children: ReactNode; right?: boolean }) {
  return <td className={`border-b border-line px-3 py-2.5 ${right ? 'text-right' : ''}`}>{children}</td>
}

export function Pill({ children, tone = 'plain' }: { children: ReactNode; tone?: 'plain' | 'good' }) {
  const cls = tone === 'good' ? 'bg-accent/20 text-ink' : 'bg-secondary/10 text-secondary'
  return <span className={`px-2 py-0.5 text-xs font-semibold ${cls}`}>{children}</span>
}

export function Chip({ children }: { children: ReactNode }) {
  return <span className="bg-secondary/10 px-2.5 py-1.5 text-[13px] text-secondary">{children}</span>
}
