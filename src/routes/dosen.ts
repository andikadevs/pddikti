// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getUpstream } from '../lib/client.ts'
import { identityOf, proxyResponses, sendProxy } from '../lib/handler.ts'
import { DosenIdParam } from '../schemas/common.ts'
import type { AppEnv } from '../types.ts'

const dosen = new OpenAPIHono<AppEnv>()

const IdParams = z.object({ id_dosen: DosenIdParam })

export const ROUTES = [
  { path: 'profile', upstream: 'dosen/profile', summary: 'Get lecturer profile', opId: 'dosenProfile' },
  { path: 'study-history', upstream: 'dosen/study-history', summary: 'Get lecturer education history', opId: 'dosenStudyHistory' },
  { path: 'teaching-history', upstream: 'dosen/teaching-history', summary: 'Get lecturer teaching history', opId: 'dosenTeachingHistory' },
  { path: 'penelitian', upstream: 'dosen/portofolio/penelitian', summary: 'Get lecturer research portfolio', opId: 'dosenResearch' },
  { path: 'pengabdian', upstream: 'dosen/portofolio/pengabdian', summary: 'Get lecturer service portfolio', opId: 'dosenService' },
  { path: 'karya', upstream: 'dosen/portofolio/karya', summary: 'Get lecturer works portfolio', opId: 'dosenWorks' },
  { path: 'paten', upstream: 'dosen/portofolio/paten', summary: 'Get lecturer patents portfolio', opId: 'dosenPatents' },
] as const

for (const route of ROUTES) {
  dosen.openapi(
    createRoute({
      method: 'get',
      path: `/dosen/${route.path}/{id_dosen}/`,
      tags: ['dosen'],
      operationId: route.opId,
      summary: route.summary,
      request: { params: IdParams },
      responses: proxyResponses,
    }),
    async (c) => {
      const { id_dosen } = c.req.valid('param')
      const data = await getUpstream().getWithKeyword(route.upstream, id_dosen, identityOf(c))
      return sendProxy(c, data)
    },
  )
}

export default dosen
