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

const idArg = (entity: string) => z.string().min(1).describe(`${entity} identifier.`)
const semesterArg = z.string().min(1).describe('Semester code, e.g. "20241".')

/** Register every PDDikti tool on the given MCP server. */
export function registerTools(server: McpServer): void {
  server.registerTool(
    'search_pddikti',
    {
      title: 'Search PDDikti',
      description:
        'Full-text search of Indonesian higher-education entities (universities, study ' +
        `programs, lecturers, students) by keyword. ${search.description}`,
      inputSchema: { entity: search.enum, keyword: z.string().min(1).describe('Search keyword.') },
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
      description: `Fetch one aspect of a university (PT) by its id. ${university.description}`,
      inputSchema: { id_pt: idArg('University (PT)'), aspect: university.enum },
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
      description: 'List a university’s study programs (prodi) for a given semester.',
      inputSchema: { id_pt: idArg('University (PT)'), semester: semesterArg },
    },
    async ({ id_pt, semester }) =>
      toToolResult(await getUpstream().getWithIdAndSemester('pt/prodi', id_pt, semester)),
  )

  server.registerTool(
    'get_university_lecturers',
    {
      title: 'Get university lecturers',
      description:
        'List all lecturers of a university for a semester, aggregated across its active ' +
        'study programs and deduplicated.',
      inputSchema: { id_pt: idArg('University (PT)'), semester: semesterArg },
    },
    async ({ id_pt, semester }) =>
      toToolResult(await aggregateUniversityLecturers(id_pt, semester)),
  )

  server.registerTool(
    'get_study_program',
    {
      title: 'Get study program info',
      description: `Fetch one aspect of a study program (prodi) by its id. ${studyProgram.description}`,
      inputSchema: { id_prodi: idArg('Study program (Prodi)'), aspect: studyProgram.enum },
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
      description: `List a study program’s lecturers for a semester. ${studyProgramLecturers.description}`,
      inputSchema: {
        id_prodi: idArg('Study program (Prodi)'),
        semester: semesterArg,
        kind: studyProgramLecturers.enum,
      },
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
      description: `Fetch one aspect of a lecturer (dosen) by its id. ${lecturer.description}`,
      inputSchema: { id_dosen: idArg('Lecturer (Dosen)'), aspect: lecturer.enum },
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
      description: 'Fetch a student (mahasiswa) detail record by its id.',
      inputSchema: { id_mhs: idArg('Student (Mahasiswa)') },
    },
    async ({ id_mhs }) => toToolResult(await getUpstream().getWithKeyword('detail/mhs', id_mhs)),
  )

  server.registerTool(
    'get_statistics',
    {
      title: 'Get aggregate statistics',
      description: `National PDDikti aggregate statistics. ${statistics.description}`,
      inputSchema: { metric: statistics.enum },
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
      description: `List study programs grouped by field of study. ${field.description}`,
      inputSchema: { field: field.enum },
    },
    async (args) => {
      const upstream = field.lookup.get(args.field)!.upstream
      return toToolResult(await getUpstream().get(upstream))
    },
  )
}
