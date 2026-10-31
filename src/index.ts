// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

import { buildApp } from './app.ts'
import { loadConfig } from './config.ts'

const config = loadConfig()
const app = buildApp()

export default {
  port: config.PORT,
  fetch: app.fetch,
}
