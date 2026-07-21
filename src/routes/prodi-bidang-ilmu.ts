import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { getUpstream } from '../lib/client.ts'
import { identityOf, proxyResponses, sendProxy } from '../lib/handler.ts'
import type { AppEnv } from '../types.ts'

const prodiBidangIlmu = new OpenAPIHono<AppEnv>()

/** Fixed scientific fields; upstream uses the capitalized Indonesian field name. */
export const FIELDS = [
  { slug: 'agama', field: 'Agama', label: 'religion' },
  { slug: 'ekonomi', field: 'Ekonomi', label: 'economics' },
  { slug: 'humaniora', field: 'Humaniora', label: 'humanities' },
  { slug: 'kesehatan', field: 'Kesehatan', label: 'health' },
  { slug: 'mipa', field: 'MIPA', label: 'science' },
  { slug: 'pendidikan', field: 'Pendidikan', label: 'education' },
  { slug: 'pertanian', field: 'Pertanian', label: 'agriculture' },
  { slug: 'seni', field: 'Seni', label: 'arts' },
  { slug: 'sosial', field: 'Sosial', label: 'social' },
  { slug: 'teknik', field: 'Teknik', label: 'engineering' },
] as const

for (const entry of FIELDS) {
  prodiBidangIlmu.openapi(
    createRoute({
      method: 'get',
      path: `/prodi-bidang-ilmu/${entry.slug}/`,
      tags: ['prodi-bidang-ilmu'],
      operationId: `prodiField${entry.field}`,
      summary: `Get study programs in ${entry.label} field`,
      responses: proxyResponses,
    }),
    async (c) => {
      const data = await getUpstream().get(
        `prodi/bidang-ilmu/${entry.field}`,
        undefined,
        identityOf(c),
      )
      return sendProxy(c, data)
    },
  )
}

export default prodiBidangIlmu
