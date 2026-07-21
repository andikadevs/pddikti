import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi'
import { loadConfig } from '../config.ts'
import type { AppEnv } from '../types.ts'

const overview = new OpenAPIHono<AppEnv>()

const OverviewResponse = z.unknown().openapi('OverviewResponse')

overview.openapi(
  createRoute({
    method: 'get',
    path: '/',
    tags: ['overview'],
    operationId: 'apiOverview',
    summary: 'API overview',
    description: 'Service metadata, documentation links, and availability status.',
    responses: {
      200: {
        description: 'Service metadata.',
        content: { 'application/json': { schema: OverviewResponse } },
      },
    },
  }),
  (c) => {
    const config = loadConfig()
    const apiBase = `${config.PUBLIC_BASE_URL}/api`

    const availability = config.API_AVAILABILITY
      ? {
          state: 'operational',
          code: 'SERVICE_AVAILABLE',
          http_code: 200,
          message: 'API service is operational. All endpoints are available.',
        }
      : {
          state: 'limited',
          code: 'API_TEMPORARILY_UNAVAILABLE',
          http_code: 503,
          message: 'Non-overview endpoints are temporarily limited. Retry later.',
        }

    return c.json({
      service: {
        name: 'PDDikti Public Data API',
        version: config.API_VERSION,
        base_url: `${apiBase}/`,
        description:
          'Structured public-data API for Indonesian higher-education entities: ' +
          'universities, study programs, lecturers, and students.',
        last_update: config.LAST_UPDATE,
        generated_at: new Date().toISOString(),
      },
      availability,
      documentation: {
        overview: `${apiBase}/`,
        swagger: `${apiBase}/docs`,
        redoc: `${apiBase}/redoc`,
        openapi: `${apiBase}/openapi.json`,
      },
      support: {
        email: config.SUPPORT_EMAIL,
        url: config.SUPPORT_URL,
      },
      credit: config.CREDIT_LINE,
    })
  },
)

export default overview
