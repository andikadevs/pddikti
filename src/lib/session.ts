import { createHmac, timingSafeEqual } from 'node:crypto'

/**
 * Stateless session tokens for the web SPA. The server mints an HMAC-signed,
 * time-limited token when it serves the SPA shell; the browser returns it in an
 * httpOnly cookie on `/api/*` requests. No server-side store — the signature is
 * the proof. The API key itself is the HMAC secret, so the raw key never reaches
 * the browser and rotating the key invalidates outstanding sessions.
 */

/** Constant-time string comparison (length-safe; unequal lengths short-circuit). */
export function constantTimeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a, 'utf8')
  const bb = Buffer.from(b, 'utf8')
  if (ab.length !== bb.length) return false
  return timingSafeEqual(ab, bb)
}

function sign(message: string, secret: string): string {
  return createHmac('sha256', secret).update(message).digest('hex')
}

/** Build a token `"<expEpochS>.<hmacHex>"` that expires at the given epoch second. */
export function signSession(expEpochS: number, secret: string): string {
  const exp = String(expEpochS)
  return `${exp}.${sign(exp, secret)}`
}

/** Verify a token's signature and that it has not expired at `nowS`. */
export function verifySession(token: string, secret: string, nowS: number): boolean {
  const dot = token.indexOf('.')
  if (dot <= 0) return false
  const exp = token.slice(0, dot)
  const mac = token.slice(dot + 1)
  if (!constantTimeEqual(mac, sign(exp, secret))) return false
  const expNum = Number(exp)
  return Number.isFinite(expNum) && expNum > nowS
}
