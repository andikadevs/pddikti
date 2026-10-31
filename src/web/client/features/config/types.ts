// SPDX-FileCopyrightText: 2026 Andika Dwi Saputra <hello@andikadevs.space>
// SPDX-License-Identifier: AGPL-3.0-or-later

/** Upstream settings as the server reports them (the cookie is masked). */
export interface UpstreamView {
  baseUrl: string
  userAgent: string
  cfMasked: string
  timeoutMs: number
}

/** `GET /config/state`: whether the page is enabled, and the settings once logged in. */
export interface ConfigState {
  enabled: boolean
  authed?: boolean
  solverEnabled?: boolean
  config?: UpstreamView
}

/** Values submitted by the upstream form. Empty strings leave a setting unchanged. */
export interface UpstreamInput {
  baseUrl: string
  userAgent: string
  cfClearance: string
  timeoutMs: string
  curl: string
}

/** Outcome message shown after an action. */
export interface Notice {
  kind: 'success' | 'error'
  text: string
}
