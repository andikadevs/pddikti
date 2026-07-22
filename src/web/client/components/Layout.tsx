import { BRAND, NAV_LINKS } from '../../nav.ts'
import { clearSelectedPt } from '../hooks/use-selected-pt.ts'

/** Shared page width used by the header, profile, and footer. */
export const CONTAINER = 'mx-auto max-w-[1080px] px-5'

/**
 * Top navigation bar, rendered on every SPA view so the nav is always present. Brand +
 * links come from the shared `web/nav.ts` spec so the server-rendered config page shows
 * an identical header. The brand returns to the search landing.
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
          {BRAND}
        </button>
        <nav className="flex gap-4 text-sm text-[#cdd9ee]">
          {NAV_LINKS.map((link) => (
            <a key={link.href} className="hover:text-white" href={link.href}>
              {link.label}
            </a>
          ))}
        </nav>
      </div>
    </div>
  )
}
