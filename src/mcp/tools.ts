// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { z } from 'zod'
import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js'
import { loadConfig } from '../config.ts'
import { getUpstream } from '../lib/client.ts'
import { aggregateUniversityLecturers } from '../lib/aggregate.ts'
import { isImage } from '../lib/handler.ts'
import { resolveStatus, withCredit } from '../lib/response.ts'
import { ENTITIES } from '../routes/search.ts'
import { BY_ID as PT_BY_ID } from '../routes/pt.ts'
import { BY_ID as PRODI_BY_ID, BY_ID_SEMESTER as PRODI_BY_SEMESTER } from '../routes/prodi.ts'
import { ROUTES as DOSEN_ROUTES } from '../routes/dosen.ts'
import { ROUTES as STATS_ROUTES } from '../routes/stats.ts'
import { FIELDS } from '../routes/prodi-bidang-ilmu.ts'

/** One selectable upstream call behind an enum value. */
interface Choice {
  value: string
  upstream: string
  desc: string
}

/** Build a Zod enum + value→Choice lookup + a human description listing every option. */
function selector(label: string, choices: readonly Choice[]) {
  const values = choices.map((c) => c.value) as [string, ...string[]]
  const lookup = new Map(choices.map((c) => [c.value, c]))
  const description = `${label} ${choices.map((c) => `"${c.value}" — ${c.desc}`).join('; ')}.`
  return { enum: z.enum(values), lookup, description }
}

const search = selector(
  'Entity to search.',
  ENTITIES.map((e) => ({ value: e.suffix, upstream: e.upstream, desc: e.label })),
)

const university = selector('University aspect.', [
  ...PT_BY_ID.map((r) => ({ value: r.path, upstream: r.upstream, desc: r.summary })),
  { value: 'logo', upstream: 'pt/logo', desc: 'University logo (image bytes)' },
])

const studyProgram = selector(
  'Study-program aspect.',
  PRODI_BY_ID.map((r) => ({ value: r.path, upstream: r.upstream, desc: r.summary })),
)

const studyProgramLecturers = selector(
  'Which lecturer set.',
  PRODI_BY_SEMESTER.map((r) => ({ value: r.path, upstream: r.upstream, desc: r.summary })),
)

const lecturer = selector(
  'Lecturer aspect.',
  DOSEN_ROUTES.map((r) => ({ value: r.path, upstream: r.upstream, desc: r.summary })),
)

const statistics = selector(
  'Statistic metric.',
  STATS_ROUTES.map((r) => ({ value: r.path, upstream: r.upstream, desc: r.summary })),
)

const field = selector(
  'Field of study (bidang ilmu).',
  FIELDS.map((f) => ({ value: f.slug, upstream: `prodi/bidang-ilmu/${f.field}`, desc: f.label })),
)

/**
 * Normalize an upstream proxy result into an MCP tool result. Mirrors the HTTP
 * layer: inject the credit line, flag error envelopes (`code >= 400`) via
 * `isError`, and return image fetches as base64 image content.
 */
function toToolResult(data: unknown): CallToolResult {
  if (isImage(data)) {
    return {
      content: [
        {
          type: 'image',
          data: Buffer.from(data.bytes).toString('base64'),
          mimeType: data.contentType,
        },
      ],
    }
  }
  const body = withCredit(data, loadConfig().CREDIT_LINE)
  return {
    content: [{ type: 'text', text: JSON.stringify(body, null, 2) }],
    isError: resolveStatus(data) !== 200,
  }
}

/** Shared hints: every tool is a read-only lookup against an external, live data source. */
const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const

const idArg = (entity: string, from: string) =>
  z
    .string()
    .min(1)
    .describe(
      `Opaque ${entity} id, copied exactly from a search_pddikti result ` +
        `(entity "${from}"). Do not guess or construct it.`,
    )
const semesterArg = z
  .string()
  .regex(/^\d{4}[12]$/, 'Semester must be YYYYS with S = 1 or 2, e.g. "20241".')
  .describe('Semester code YYYYS: year plus 1 (odd/ganjil) or 2 (even/genap), e.g. "20241".')

/** Register every PDDikti tool on the given MCP server. */
export function registerTools(server: McpServer): void {
  server.registerTool(
    'search_pddikti',
    {
      title: 'Search PDDikti',
      description:
        'Search Indonesian higher-education records by keyword and return matching entries ' +
        'with their opaque ids. Start here: every other tool needs an id from this search. ' +
        'Returns a JSON list (empty when nothing matches). ' +
        search.description,
      inputSchema: {
        entity: search.enum,
        keyword: z
          .string()
          .min(1)
          .describe('Name, NIM (student number), NIDN (lecturer number), or code to search for.'),
      },
      annotations: { title: 'Search PDDikti', ...READ_ONLY },
    },
    async ({ entity, keyword }) => {
      const upstream = search.lookup.get(entity)!.upstream
      return toToolResult(await getUpstream().getWithKeyword(upstream, keyword))
    },
  )

  server.registerTool(
    'get_university',
    {
      title: 'Get university info',
      description:
        'Fetch one aspect of a single university (perguruan tinggi, PT) as JSON, or its logo ' +
        'as an image. Use for profile, accreditation, and history questions about one ' +
        'university; for its study programs or lecturers use get_university_study_programs ' +
        `or get_university_lecturers. ${university.description}`,
      inputSchema: { id_pt: idArg('university (PT)', 'pt'), aspect: university.enum },
      annotations: { title: 'Get university info', ...READ_ONLY },
    },
    async ({ id_pt, aspect }) => {
      if (aspect === 'logo') {
        return toToolResult(await getUpstream().getImage('pt/logo', id_pt))
      }
      const upstream = university.lookup.get(aspect)!.upstream
      return toToolResult(await getUpstream().getWithKeyword(upstream, id_pt))
    },
  )

  server.registerTool(
    'get_university_study_programs',
    {
      title: 'Get university study programs',
      description:
        'List every study program (prodi) a university offered in one semester, with each ' +
        'program’s id. Pass a returned prodi id to ' +
        'get_study_program for details. Returns a JSON list.',
      inputSchema: { id_pt: idArg('university (PT)', 'pt'), semester: semesterArg },
      annotations: { title: 'Get university study programs', ...READ_ONLY },
    },
    async ({ id_pt, semester }) =>
      toToolResult(await getUpstream().getWithIdAndSemester('pt/prodi', id_pt, semester)),
  )

  server.registerTool(
    'get_university_lecturers',
    {
      title: 'Get university lecturers',
      description:
        'List all lecturers of one university for a semester, merged across its active ' +
        'study programs and deduplicated. Slower than other tools because it fans out one ' +
        'request per program; prefer get_study_program_lecturers when one program is ' +
        'enough. Returns a JSON list.',
      inputSchema: { id_pt: idArg('university (PT)', 'pt'), semester: semesterArg },
      annotations: { title: 'Get university lecturers', ...READ_ONLY },
    },
    async ({ id_pt, semester }) =>
      toToolResult(await aggregateUniversityLecturers(id_pt, semester)),
  )

  server.registerTool(
    'get_study_program',
    {
      title: 'Get study program info',
      description:
        'Fetch one aspect of a single study program (program studi, prodi) as JSON. ' +
        'For its lecturer roster use get_study_program_lecturers. ' +
        studyProgram.description,
      inputSchema: { id_prodi: idArg('study program (prodi)', 'prodi'), aspect: studyProgram.enum },
      annotations: { title: 'Get study program info', ...READ_ONLY },
    },
    async ({ id_prodi, aspect }) => {
      const upstream = studyProgram.lookup.get(aspect)!.upstream
      return toToolResult(await getUpstream().getWithKeyword(upstream, id_prodi))
    },
  )

  server.registerTool(
    'get_study_program_lecturers',
    {
      title: 'Get study program lecturers',
      description:
        'List the lecturers attached to one study program in a semester. Pass a returned ' +
        `lecturer id to get_lecturer for their profile. Returns a JSON list. ${studyProgramLecturers.description}`,
      inputSchema: {
        id_prodi: idArg('study program (prodi)', 'prodi'),
        semester: semesterArg,
        kind: studyProgramLecturers.enum,
      },
      annotations: { title: 'Get study program lecturers', ...READ_ONLY },
    },
    async ({ id_prodi, semester, kind }) => {
      const upstream = studyProgramLecturers.lookup.get(kind)!.upstream
      return toToolResult(
        await getUpstream().getWithIdAndParamSemester(upstream, id_prodi, semester),
      )
    },
  )

  server.registerTool(
    'get_lecturer',
    {
      title: 'Get lecturer info',
      description:
        'Fetch one aspect of a single lecturer (dosen) as JSON: profile, teaching, ' +
        `research, or other records. ${lecturer.description}`,
      inputSchema: { id_dosen: idArg('lecturer (dosen)', 'dosen'), aspect: lecturer.enum },
      annotations: { title: 'Get lecturer info', ...READ_ONLY },
    },
    async ({ id_dosen, aspect }) => {
      const upstream = lecturer.lookup.get(aspect)!.upstream
      return toToolResult(await getUpstream().getWithKeyword(upstream, id_dosen))
    },
  )

  server.registerTool(
    'get_student',
    {
      title: 'Get student detail',
      description:
        'Fetch the public PDDikti record of one student (mahasiswa), such as university, ' +
        'study program, and enrollment status. There is no student list; find the ' +
        'id with search_pddikti (entity "mhs") by name or NIM. Returns JSON.',
      inputSchema: { id_mhs: idArg('student (mahasiswa)', 'mhs') },
      annotations: { title: 'Get student detail', ...READ_ONLY },
    },
    async ({ id_mhs }) => toToolResult(await getUpstream().getWithKeyword('detail/mhs', id_mhs)),
  )

  server.registerTool(
    'get_statistics',
    {
      title: 'Get aggregate statistics',
      description:
        'Fetch one national aggregate statistic for Indonesian higher education as JSON. ' +
        'Needs no id; use it for country-wide counts, not for a single institution. ' +
        statistics.description,
      inputSchema: { metric: statistics.enum },
      annotations: { title: 'Get aggregate statistics', ...READ_ONLY },
    },
    async ({ metric }) => {
      const upstream = statistics.lookup.get(metric)!.upstream
      return toToolResult(await getUpstream().get(upstream))
    },
  )

  server.registerTool(
    'list_study_programs_by_field',
    {
      title: 'List study programs by field',
      description:
        'List study programs nationwide for one field of study (bidang ilmu), for ' +
        'discovering which programs exist in a discipline. Needs no id. Returns a JSON list. ' +
        field.description,
      inputSchema: { field: field.enum },
      annotations: { title: 'List study programs by field', ...READ_ONLY },
    },
    async (args) => {
      const upstream = field.lookup.get(args.field)!.upstream
      return toToolResult(await getUpstream().get(upstream))
    },
  )
}
