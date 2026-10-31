// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { getUpstream } from '../lib/client.ts'
import { aggregateUniversityLecturers } from '../lib/aggregate.ts'
import { errorStatus, identityOf, isImage, proxyResponses, sendProxy } from '../lib/handler.ts'
import { withCredit } from '../lib/response.ts'
import { loadConfig } from '../config.ts'
import { PtIdParam, SemesterPathParam } from '../schemas/common.ts'
import type { AppEnv } from '../types.ts'

const pt = new OpenAPIHono<AppEnv>()

const IdParams = z.object({ id_pt: PtIdParam })

/** Simple `pt/{endpoint}/{id_pt}` keyword-style routes. */
export const BY_ID = [
  { path: 'detail', upstream: 'pt/detail', summary: 'Get university detail', opId: 'ptDetail' },
  { path: 'rasio', upstream: 'pt/rasio', summary: 'Get lecturer-student ratio by university', opId: 'ptRatio' },
  { path: 'mahasiswa', upstream: 'pt/mahasiswa', summary: 'Get university student metrics', opId: 'ptStudents' },
  { path: 'waktu-studi', upstream: 'pt/waktu-studi', summary: 'Get average study duration by university', opId: 'ptStudyDuration' },
  { path: 'riwayat', upstream: 'pt/name-histories', summary: 'Get university name history', opId: 'ptNameHistory' },
  { path: 'biaya-kuliah', upstream: 'pt/cost-range', summary: 'Get tuition range by university', opId: 'ptCostRange' },
  { path: 'fasilitas', upstream: 'pt/sarpras-file-name', summary: 'Get university facilities metadata', opId: 'ptFacilities' },
] as const

for (const route of BY_ID) {
  pt.openapi(
    createRoute({
      method: 'get',
      path: `/pt/${route.path}/{id_pt}/`,
      tags: ['pt'],
      operationId: route.opId,
      summary: route.summary,
      request: { params: IdParams },
      responses: proxyResponses,
    }),
    async (c) => {
      const { id_pt } = c.req.valid('param')
      const data = await getUpstream().getWithKeyword(route.upstream, id_pt, identityOf(c))
      return sendProxy(c, data)
    },
  )
}

// University study programs by semester (semester in path).
pt.openapi(
  createRoute({
    method: 'get',
    path: '/pt/prodi/{id_pt}/{id_thsmt}',
    tags: ['pt'],
    operationId: 'ptProdiBySemester',
    summary: 'Get university study programs by semester',
    request: { params: z.object({ id_pt: PtIdParam, id_thsmt: SemesterPathParam }) },
    responses: proxyResponses,
  }),
  async (c) => {
    const { id_pt, id_thsmt } = c.req.valid('param')
    const data = await getUpstream().getWithIdAndSemester('pt/prodi', id_pt, id_thsmt, identityOf(c))
    return sendProxy(c, data)
  },
)

// University logo (image bytes).
pt.openapi(
  createRoute({
    method: 'get',
    path: '/pt/logo/{id_pt}/',
    tags: ['pt'],
    operationId: 'ptLogo',
    summary: 'Get university logo',
    request: { params: IdParams },
    responses: {
      ...proxyResponses,
      200: { description: 'University logo image bytes.', content: { 'image/*': { schema: z.string() } } },
    },
  }),
  async (c) => {
    const { id_pt } = c.req.valid('param')
    const data = await getUpstream().getImage('pt/logo', id_pt, identityOf(c))
    if (isImage(data)) {
      c.header('Content-Type', data.contentType)
      return c.body(data.bytes, 200)
    }
    return c.json(withCredit(data, loadConfig().CREDIT_LINE), errorStatus(data))
  },
)

// University lecturers (aggregated across active study programs; see lib/aggregate.ts).
pt.openapi(
  createRoute({
    method: 'get',
    path: '/pt/lecturers/{id_pt}/{id_thsmt}/',
    tags: ['pt'],
    operationId: 'ptLecturers',
    summary: 'List all lecturers (aggregated across active study programs)',
    request: { params: z.object({ id_pt: PtIdParam, id_thsmt: SemesterPathParam }) },
    responses: proxyResponses,
  }),
  async (c) => {
    const { id_pt, id_thsmt } = c.req.valid('param')
    const data = await aggregateUniversityLecturers(id_pt, id_thsmt, identityOf(c))
    return sendProxy(c, data)
  },
)

export default pt
