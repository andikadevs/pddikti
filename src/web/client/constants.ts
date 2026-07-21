/** Client-side constants and path builders for the PT profile explorer. */

export const API_BASE = '/api'

/** Latest semester with data for the study-program list (YYYYS: 2025 ganjil). */
export const LATEST_SEMESTER = '20251'

/** `/api/pt/{endpoint}/{id}/` for single-id endpoints. */
export function ptPath(id: string, endpoint: string): string {
  return `${API_BASE}/pt/${endpoint}/${encodeURIComponent(id)}/`
}

/** `/api/pt/prodi/{id}/{semester}` study-program list. */
export function prodiPath(id: string, semester: string = LATEST_SEMESTER): string {
  return `${API_BASE}/pt/prodi/${encodeURIComponent(id)}/${semester}`
}

/** `/api/pt/logo/{id}/` image URL (used directly as an <img> src). */
export function logoUrl(id: string): string {
  return ptPath(id, 'logo')
}

/** `/api/pt/lecturers/{id}/{semester}/` aggregated lecturer list. */
export function lecturersPath(id: string, semester: string = LATEST_SEMESTER): string {
  return `${API_BASE}/pt/lecturers/${encodeURIComponent(id)}/${semester}/`
}

/** `/api/search/pt/{keyword}/` university keyword search. */
export function searchPtPath(keyword: string): string {
  return `${API_BASE}/search/pt/${encodeURIComponent(keyword)}/`
}

/** `/api/search/mhs/{keyword}/` student keyword search. */
export function searchMhsPath(keyword: string): string {
  return `${API_BASE}/search/mhs/${encodeURIComponent(keyword)}/`
}
