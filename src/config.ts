import { z } from '@hono/zod-openapi'

/**
 * Single source of truth for environment configuration.
 * Nothing else in the codebase may read `process.env` / `Bun.env` directly.
 */

const booleanFromEnv = z
  .string()
  .transform((v) => v.trim().toLowerCase())
  .pipe(z.enum(['1', 'true', 'yes', 'on', '0', 'false', 'no', 'off']))
  .transform((v) => ['1', 'true', 'yes', 'on'].includes(v))

const headersFromEnv = z
  .string()
  .transform((raw, ctx): Record<string, string> => {
    const trimmed = raw.trim()
    if (trimmed === '') return {}
    try {
      const parsed = JSON.parse(trimmed) as unknown
      if (
        typeof parsed !== 'object' ||
        parsed === null ||
        Array.isArray(parsed) ||
        Object.values(parsed).some((v) => typeof v !== 'string')
      ) {
        throw new Error('not a string→string map')
      }
      return parsed as Record<string, string>
    } catch (err) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `UPSTREAM_HEADERS must be a JSON object of string values: ${(err as Error).message}`,
      })
      return z.NEVER
    }
  })

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  DEBUG: booleanFromEnv.default('false'),
  PUBLIC_BASE_URL: z
    .string()
    .url()
    .default('http://localhost:3000')
    .transform((v) => v.replace(/\/+$/, '')),

  UPSTREAM_BASE_URL: z
    .string()
    .default('')
    .transform((v) => v.replace(/\/+$/, '')),
  UPSTREAM_HEADERS: headersFromEnv.default('{}'),
  UPSTREAM_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),

  API_AVAILABILITY: booleanFromEnv.default('true'),
  API_VERSION: z.string().default('1.0.0'),
  LAST_UPDATE: z.string().default('2026-06-19T00:00:00+07:00'),

  CREDIT_LINE: z.string().default('Data © PDDikti'),
  SUPPORT_EMAIL: z.string().default(''),
  SUPPORT_URL: z.string().default(''),

  // Inbound API-key auth (optional). Empty API_KEY disables the gate (public).
  API_KEY: z.string().default(''),
  SESSION_TTL_S: z.coerce.number().int().positive().default(86400),

  // Operator config page (/config). Empty CONFIG_PASSWORD disables the page (404).
  // Saved values persist to CONFIG_STORE_PATH and override UPSTREAM_* at runtime.
  CONFIG_PASSWORD: z.string().default(''),
  CONFIG_STORE_PATH: z.string().default('./runtime-config.json'),

  // Redis cache (optional). When disabled, the cache layer is a no-op passthrough.
  CACHE_ENABLED: booleanFromEnv.default('false'),
  CACHE_TTL_S: z.coerce.number().int().positive().default(600),
  REDIS_URL: z.string().default(''),
  REDIS_HOST: z.string().default('localhost'),
  REDIS_PORT: z.coerce.number().int().positive().default(6379),
  REDIS_USERNAME: z.string().default(''),
  REDIS_PASSWORD: z.string().default(''),
  REDIS_DB: z.coerce.number().int().min(0).default(0),
})

export type Config = z.infer<typeof envSchema>

let cached: Config | undefined

/** Parse and cache configuration from the process environment. */
export function loadConfig(): Config {
  if (cached) return cached
  const parsed = envSchema.safeParse(process.env)
  if (!parsed.success) {
    const issues = parsed.error.issues
      .map((i) => `  - ${i.path.join('.') || '(root)'}: ${i.message}`)
      .join('\n')
    throw new Error(`Invalid environment configuration:\n${issues}`)
  }
  cached = parsed.data
  return cached
}

/** Reset the cache. Test-only. */
export function resetConfig(): void {
  cached = undefined
}
