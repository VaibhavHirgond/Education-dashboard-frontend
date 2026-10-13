/**
 * CSRF token handling for the education portal.
 *
 * Frappe rejects unsafe requests (POST/PUT/PATCH/DELETE) with
 * "Invalid Request" (CSRFTokenError) when the session has a CSRF token and
 * the request does not echo it back. The token is generated server side the
 * first time a session renders a page (e.g. /desk), which is why portal
 * writes can fail for some users and not others.
 *
 * installCsrf() wraps window.fetch so every unsafe request automatically
 * carries the header, and retries once with a refreshed token if the
 * server rejects it (e.g. after a login/logout changed the session).
 */

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])
const CSRF_HEADER = 'X-Frappe-CSRF-Token'
const CSRF_ENDPOINT = '/api/method/backend_custom_app.api.auth.get_csrf_token'

let token = null
let tokenPromise = null
let nativeFetch = null

function fetchImpl() {
  if (!nativeFetch) {
    nativeFetch = window.fetch.bind(window)
  }
  return nativeFetch
}

export async function getCsrfToken({ force = false } = {}) {
  if (token && !force) {
    return token
  }

  if (tokenPromise && !force) {
    return tokenPromise
  }

  const request = fetchImpl()(CSRF_ENDPOINT, {
    method: 'GET',
    credentials: 'include',
    headers: { Accept: 'application/json' },
  })
    .then(async (response) => {
      const body = await response.json().catch(() => ({}))
      const value = (body && (body.message || body.csrf_token)) || null
      token = typeof value === 'string' && value ? value : null
      return token
    })
    .catch(() => null)
    .finally(() => {
      tokenPromise = null
    })

  tokenPromise = request

  return request
}

export function clearCsrfToken() {
  token = null
  tokenPromise = null
}

function isCsrfError(response) {
  if (!response || (response.status !== 400 && response.status !== 403)) {
    return Promise.resolve(false)
  }

  return response
    .clone()
    .json()
    .then((body) => body && body.exc_type === 'CSRFTokenError')
    .catch(() => false)
}

export function installCsrf() {
  if (typeof window === 'undefined' || !window.fetch) {
    return
  }

  if (window.fetch.__csrfPatched) {
    return
  }

  const original = fetchImpl()

  const patched = async (input, init) => {
    const method = String(
      (init && init.method) || (input && input.method) || 'GET'
    ).toUpperCase()

    if (!UNSAFE_METHODS.has(method)) {
      return original(input, init)
    }

    const headers = new Headers(
      (init && init.headers) ||
        (input instanceof Request ? input.headers : undefined)
    )

    if (!headers.has(CSRF_HEADER)) {
      const value = await getCsrfToken()
      if (value) {
        headers.set(CSRF_HEADER, value)
      }
    }

    const nextInit = Object.assign({}, init, { headers })

    // A Request body can only be consumed once, so keep a copy for the retry.
    const retryInput = input instanceof Request ? input.clone() : input

    const response = await original(input, nextInit)

    if (await isCsrfError(response)) {
      const refreshed = await getCsrfToken({ force: true })

      if (refreshed) {
        headers.set(CSRF_HEADER, refreshed)
        return original(retryInput, Object.assign({}, nextInit, { headers }))
      }
    }

    return response
  }

  patched.__csrfPatched = true
  window.fetch = patched
}
