/**
 * Thin fetch helpers for the education portal.
 * Session cookies are sent with every request.
 */

import { getCsrfToken } from './csrf'

export async function apiGet(path, params = null) {
  let url = path

  if (params && Object.keys(params).length) {
    const query = new URLSearchParams()

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '') {
        return
      }

      query.append(
        key,
        typeof value === 'object'
          ? JSON.stringify(value)
          : String(value)
      )
    })

    const qs = query.toString()

    if (qs) {
      url += `${url.includes('?') ? '&' : '?'}${qs}`
    }
  }

  const response = await fetch(url, {
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })

  let body = null

  try {
    body = await response.json()
  } catch (jsonError) {
    body = null
  }

  if (!response.ok) {
    const error = new Error(
      body?.exception ||
        body?.message ||
        `Request failed with status ${response.status}`
    )

    error.status = response.status
    error.body = body

    throw error
  }

  return body?.message
}

export async function apiPost(path, payload = {}) {
  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json',
  }

  const csrfToken = await getCsrfToken()

  if (csrfToken) {
    headers['X-Frappe-CSRF-Token'] = csrfToken
  }

  const response = await fetch(path, {
    method: 'POST',
    credentials: 'include',
    headers,
    body: JSON.stringify(payload),
  })

  let body = null

  try {
    body = await response.json()
  } catch (jsonError) {
    body = null
  }

  if (!response.ok) {
    const error = new Error(
      body?.exception ||
        body?._server_messages ||
        body?.message ||
        `Request failed with status ${response.status}`
    )

    error.status = response.status
    error.body = body

    throw error
  }

  return body?.message
}

export function extractMessage(body) {
  if (!body) {
    return ''
  }

  if (typeof body === 'string') {
    return body
  }

  if (Array.isArray(body._server_messages)) {
    try {
      return JSON.parse(body._server_messages[0])?.message || body.exception || ''
    } catch (parseError) {
      return body.exception || ''
    }
  }

  if (typeof body._server_messages === 'string') {
    try {
      return JSON.parse(JSON.parse(body._server_messages)[0])?.message || body.exception || ''
    } catch (parseError) {
      return body.exception || ''
    }
  }

  return body.exception || body.message || ''
}
