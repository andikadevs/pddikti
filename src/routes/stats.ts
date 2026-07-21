import { createRoute, OpenAPIHono } from '@hono/zod-openapi'
import { getUpstream } from '../lib/client.ts'
import { identityOf, proxyResponses, sendProxy } from '../lib/handler.ts'
import type { AppEnv } from '../types.ts'

const stats = new OpenAPIHono<AppEnv>()

/** Aggregate/visualization endpoints — no params, one upstream call each. */
export const ROUTES = [
  { path: 'mhs-count', upstream: 'mahasiswa/count', summary: 'Get total student count', opId: 'mhsCount' },
  { path: 'mhs-count-active', upstream: 'mahasiswa/count-active', summary: 'Get active student count', opId: 'mhsCountActive' },
  { path: 'mhs-count-gender', upstream: 'visualisasi/mahasiswa-jenis-kelamin', summary: 'Get student count by gender', opId: 'mhsCountByGender' },
  { path: 'mhs-count-bidang-ilmu', upstream: 'visualisasi/mahasiswa-bidang', summary: 'Get student count by field', opId: 'mhsCountByField' },
  { path: 'mhs-count-status', upstream: 'visualisasi/mahasiswa-status', summary: 'Get student count by status', opId: 'mhsCountByStatus' },
  { path: 'mhs-count-jenjang', upstream: 'visualisasi/mahasiswa-jenjang', summary: 'Get student count by degree level', opId: 'mhsCountByDegree' },
  { path: 'mhs-count-kelompok-lembaga', upstream: 'visualisasi/mahasiswa-kelompok-lembaga', summary: 'Get student count by institution group', opId: 'mhsCountByInstitutionGroup' },

  { path: 'dosen-count', upstream: 'dosen/count', summary: 'Get total lecturer count', opId: 'dosenCount' },
  { path: 'dosen-count-active', upstream: 'dosen/count-active', summary: 'Get active lecturer count', opId: 'dosenCountActive' },
  { path: 'dosen-count-gender', upstream: 'visualisasi/dosen-jenis-kelamin', summary: 'Get lecturer count by gender', opId: 'dosenCountByGender' },
  { path: 'dosen-count-bidang', upstream: 'visualisasi/dosen-bidang', summary: 'Get lecturer count by field', opId: 'dosenCountByField' },
  { path: 'dosen-count-keaktifan', upstream: 'visualisasi/dosen-keaktifan', summary: 'Get lecturer count by activity', opId: 'dosenCountByActivity' },
  { path: 'dosen-count-jenjang', upstream: 'visualisasi/dosen-jenjang', summary: 'Get lecturer count by degree', opId: 'dosenCountByDegree' },
  { path: 'dosen-count-ikatan', upstream: 'visualisasi/dosen-ikatan', summary: 'Get lecturer count by affiliation', opId: 'dosenCountByAffiliation' },

  { path: 'pt-count', upstream: 'pt/count', summary: 'Get total university count', opId: 'ptCount' },
  { path: 'pt-count-province', upstream: 'visualisasi/pt-provinsi', summary: 'Get university count by province', opId: 'ptCountByProvince' },
  { path: 'pt-count-kelompok-pembina', upstream: 'visualisasi/pt-kelompok-pembina', summary: 'Get university count by supervising group', opId: 'ptCountBySupervisor' },
  { path: 'pt-count-akreditasi', upstream: 'visualisasi/pt-akreditasi', summary: 'Get university count by accreditation', opId: 'ptCountByAccreditation' },
  { path: 'pt-count-bentuk-pt', upstream: 'visualisasi/pt-bentuk', summary: 'Get university count by institution type', opId: 'ptCountByType' },

  { path: 'prodi-count', upstream: 'prodi/count', summary: 'Get total study program count', opId: 'prodiCount' },
  { path: 'prodi-count-bidang-ilmu-terbanyak', upstream: 'prodi/bidang-ilmu', summary: 'Get most common study program field', opId: 'prodiCountTopField' },
  { path: 'prodi-count-kelompok-pembina', upstream: 'visualisasi/prodi-kelompok-pembina', summary: 'Get study program count by supervising group', opId: 'prodiCountBySupervisor' },
  { path: 'prodi-count-bidang-ilmu', upstream: 'visualisasi/prodi-bidang-ilmu', summary: 'Get study program count by field', opId: 'prodiCountByField' },
  { path: 'prodi-count-akreditasi', upstream: 'visualisasi/prodi-akreditasi', summary: 'Get study program count by accreditation', opId: 'prodiCountByAccreditation' },
  { path: 'prodi-count-jenjang', upstream: 'visualisasi/prodi-jenjang', summary: 'Get study program count by degree level', opId: 'prodiCountByDegree' },
] as const

for (const route of ROUTES) {
  stats.openapi(
    createRoute({
      method: 'get',
      path: `/stats/${route.path}/`,
      tags: ['stats'],
      operationId: route.opId,
      summary: route.summary,
      responses: proxyResponses,
    }),
    async (c) => {
      const data = await getUpstream().get(route.upstream, undefined, identityOf(c))
      return sendProxy(c, data)
    },
  )
}

export default stats
