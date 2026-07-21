import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'

const config = loadConfig()
const app = buildApp()

export default {
  port: config.PORT,
  fetch: app.fetch,
}
