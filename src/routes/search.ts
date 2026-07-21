import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getUpstream } from '../lib/client.ts'
import { identityOf, proxyResponses, sendProxy } from '../lib/handler.ts'
import { KeywordParam } from '../schemas/common.ts'
import type { AppEnv } from '../types.ts'

const search = new OpenAPIHono<AppEnv>()

const ParamsSchema = z.object({ keyword: KeywordParam })

/** Each entry maps a public path suffix to an upstream `pencarian/*` endpoint. */
export const ENTITIES = [
  { suffix: 'all', upstream: 'pencarian/all', label: 'all entities', opId: 'searchAll' },
  { suffix: 'pt', upstream: 'pencarian/pt', label: 'universities', opId: 'searchPt' },
  { suffix: 'prodi', upstream: 'pencarian/prodi', label: 'study programs', opId: 'searchProdi' },
  { suffix: 'dosen', upstream: 'pencarian/dosen', label: 'lecturers', opId: 'searchDosen' },
  { suffix: 'mhs', upstream: 'pencarian/mhs', label: 'students', opId: 'searchMhs' },
] as const

for (const entity of ENTITIES) {
  search.openapi(
    createRoute({
      method: 'get',
      path: `/search/${entity.suffix}/{keyword}/`,
      tags: ['search'],
      operationId: entity.opId,
      summary: `Search ${entity.label}`,
      request: { params: ParamsSchema },
      responses: proxyResponses,
    }),
    async (c) => {
      const { keyword } = c.req.valid('param')
      const data = await getUpstream().getWithKeyword(entity.upstream, keyword, identityOf(c))
      return sendProxy(c, data)
    },
  )
}

export default search
