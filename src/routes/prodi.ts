import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getUpstream } from '../lib/client.ts'
import { identityOf, proxyResponses, sendProxy } from '../lib/handler.ts'
import { ProdiIdParam, SemesterPathParam } from '../schemas/common.ts'
import type { AppEnv } from '../types.ts'

const prodi = new OpenAPIHono<AppEnv>()

const IdParams = z.object({ id_prodi: ProdiIdParam })

/** Simple `prodi/{endpoint}/{id_prodi}` keyword-style routes. */
export const BY_ID = [
  { path: 'detail', upstream: 'prodi/detail', summary: 'Get study program detail', opId: 'prodiDetail' },
  { path: 'desc', upstream: 'prodi/desc', summary: 'Get study program description', opId: 'prodiDesc' },
  { path: 'num-students-lecturers', upstream: 'prodi/num-students-lecturers', summary: 'Get student and lecturer counts', opId: 'prodiCounts' },
  { path: 'riwayat', upstream: 'prodi/name-histories', summary: 'Get study program name history', opId: 'prodiNameHistory' },
  { path: 'biaya-kuliah', upstream: 'prodi/cost-range', summary: 'Get study program tuition range', opId: 'prodiCostRange' },
] as const

for (const route of BY_ID) {
  prodi.openapi(
    createRoute({
      method: 'get',
      path: `/prodi/${route.path}/{id_prodi}/`,
      tags: ['prodi'],
      operationId: route.opId,
      summary: route.summary,
      request: { params: IdParams },
      responses: proxyResponses,
    }),
    async (c) => {
      const { id_prodi } = c.req.valid('param')
      const data = await getUpstream().getWithKeyword(route.upstream, id_prodi, identityOf(c))
      return sendProxy(c, data)
    },
  )
}

/** Routes taking the semester as a `?semester=` query param. */
export const BY_ID_SEMESTER = [
  { path: 'dosen-homebase', upstream: 'dosen/homebase', summary: 'Get homebase lecturers by semester', opId: 'prodiDosenHomebase' },
  { path: 'dosen-penghitung-ratio', upstream: 'dosen/penghitung-ratio', summary: 'Get lecturers used for ratio calculations', opId: 'prodiDosenRatio' },
] as const

const SemesterParams = z.object({ id_prodi: ProdiIdParam, id_thsmt: SemesterPathParam })

for (const route of BY_ID_SEMESTER) {
  prodi.openapi(
    createRoute({
      method: 'get',
      path: `/prodi/${route.path}/{id_prodi}/{id_thsmt}/`,
      tags: ['prodi'],
      operationId: route.opId,
      summary: route.summary,
      request: { params: SemesterParams },
      responses: proxyResponses,
    }),
    async (c) => {
      const { id_prodi, id_thsmt } = c.req.valid('param')
      const data = await getUpstream().getWithIdAndParamSemester(
        route.upstream,
        id_prodi,
        id_thsmt,
        identityOf(c),
      )
      return sendProxy(c, data)
    },
  )
}

export default prodi
