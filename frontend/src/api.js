export class ApiError extends Error {
  constructor(status, data) {
    super((data && data.error) || 'Request failed')
    this.status = status
    this.data = data || {}
    this.errors = this.data.errors || {}
  }
}

function csrfToken() {
  const m = document.cookie.match(/(?:^|; )csrftoken=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

/** JSON helper for the Django API. Pass `body` for JSON or `form` for FormData. */
export async function api(path, { method = 'GET', body, form } = {}) {
  const headers = {}
  let payload
  if (form) payload = form
  else if (body !== undefined) {
    headers['Content-Type'] = 'application/json'
    payload = JSON.stringify(body)
  }
  if (method !== 'GET') headers['X-CSRFToken'] = csrfToken()
  const res = await fetch('/api' + path, { method, headers, body: payload, credentials: 'same-origin' })
  let data = null
  try { data = await res.json() } catch { /* empty body */ }
  if (!res.ok) throw new ApiError(res.status, data)
  return data
}

export const SECTIONS = [
  { value: 'quant', label: 'Quantitative' },
  { value: 'logical', label: 'Logical' },
  { value: 'verbal', label: 'Verbal' },
  { value: 'technical', label: 'Technical' },
]

export function fmtDate(iso) {
  return new Date(iso).toLocaleString([], { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}
