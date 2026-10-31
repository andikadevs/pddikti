// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from '@hono/zod-openapi'

/** Build a required, non-empty string path parameter with OpenAPI metadata. */
function pathParam(name: string, description: string, example: string) {
  return z
    .string()
    .min(1)
    .openapi({ param: { name, in: 'path' }, description, example })
}

export const KeywordParam = pathParam(
  'keyword',
  'Search keyword used to match PDDikti entities.',
  'informatika',
)

export const PtIdParam = pathParam('id_pt', 'University (PT) identifier.', 'PT-id')
export const ProdiIdParam = pathParam('id_prodi', 'Study program (Prodi) identifier.', 'PRODI-id')
export const DosenIdParam = pathParam('id_dosen', 'Lecturer (Dosen) identifier.', 'DOSEN-id')
export const MhsIdParam = pathParam('id_mhs', 'Student (Mahasiswa) identifier.', 'MHS-id')

export const SemesterPathParam = pathParam(
  'id_thsmt',
  'Semester code for period-based queries.',
  '20241',
)

/** Semester as a query parameter (`?semester=`). */
export const SemesterQuery = z.object({
  semester: z
    .string()
    .min(1)
    .openapi({ param: { name: 'semester', in: 'query' }, description: 'Semester code.', example: '20241' }),
})

/**
 * Arbitrary upstream JSON payload. This proxy must not constrain upstream shapes,
 * so the body is intentionally opaque (the single sanctioned `unknown`).
 */
export const ProxyResponse = z.unknown().openapi('ProxyResponse', {
  description: 'Upstream JSON payload with an injected `credit` field.',
})

/** Normalized error envelope emitted by the proxy. */
export const ErrorResponse = z
  .object({
    code: z.number().openapi({ example: 503 }),
    error: z.string().openapi({ example: 'Connection error' }),
    message: z.unknown(),
    credit: z.string().optional(),
  })
  .openapi('ErrorResponse')
