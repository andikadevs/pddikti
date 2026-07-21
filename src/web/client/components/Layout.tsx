import { clearSelectedPt } from '../hooks/use-selected-pt.ts'

/** Shared page width used by the header, profile, and footer. */
export const CONTAINER = 'mx-auto max-w-[1080px] px-5'

/**
 * Top navigation bar, rendered on every SPA view so the nav is always present. The
 * brand returns to the search landing; the links reach the API docs and config page.
 */
export function Header() {
  return (
    <div className="bg-primary text-white">
      <div className={`${CONTAINER} flex h-14 items-center justify-between`}>
        <button
          type="button"
          onClick={() => clearSelectedPt()}
          className="font-bold tracking-wide hover:opacity-90"
        >
          PDDikti <span className="text-accent">·</span> Profil PT
        </button>
        <nav className="flex gap-4 text-sm text-[#cdd9ee]">
          <a className="hover:text-white" href="/api/docs">API Docs</a>
          <a className="hover:text-white" href="/api/">Overview</a>
          <a className="hover:text-white" href="/config">Konfigurasi</a>
        </nav>
      </div>
    </div>
  )
}
