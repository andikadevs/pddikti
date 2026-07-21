import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getUpstream } from '../lib/client.ts'
import { identityOf, proxyResponses, sendProxy } from '../lib/handler.ts'
import { MhsIdParam } from '../schemas/common.ts'
import type { AppEnv } from '../types.ts'

const mahasiswa = new OpenAPIHono<AppEnv>()

mahasiswa.openapi(
  createRoute({
    method: 'get',
    path: '/mhs/detail/{id_mhs}/',
    tags: ['mahasiswa'],
    operationId: 'mhsDetail',
    summary: 'Get student detail',
    request: { params: z.object({ id_mhs: MhsIdParam }) },
    responses: proxyResponses,
  }),
  async (c) => {
    const { id_mhs } = c.req.valid('param')
    const data = await getUpstream().getWithKeyword('detail/mhs', id_mhs, identityOf(c))
    return sendProxy(c, data)
  },
)

export default mahasiswa
