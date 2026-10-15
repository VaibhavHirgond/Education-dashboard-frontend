/**
 * Session / role context for the education portal.
 *
 * Identity always comes from the Frappe session (never from the URL or
 * localStorage) so the UI can never show someone else's data.
 */

import { apiGet } from './api'

let cache = null
let inflight = null

export async function getContext({ force = false } = {}) {
  if (cache && !force) {
    return cache
  }

  if (inflight) {
    return inflight
  }

  inflight = apiGet(
    '/api/method/backend_custom_app.api.context.get_context'
  )
    .then((message) => {
      cache = normalize(message)

      return cache
    })
    .finally(() => {
      inflight = null
    })

  return inflight
}

export function clearContext() {
  cache = null
}

export function getCachedContext() {
  return cache
}

/**
 * Portal mode for the signed-in user.
 *
 * Priority: staff (admin dashboard) > instructor > student.
 * The answer always comes from the Frappe session via get_context().
 *
 * Returns null while the context is unknown (not loaded yet, request
 * failed, or the account has no education role). Callers must treat
 * null as "no access" - defaulting to staff would show management
 * controls to learners and instructors, and the server would reject
 * their writes.
 */
export function portalMode(ctx) {
  if (!ctx) {
    return null
  }

  // An instructor who also has Education Manager should see
  // the Instructor Dashboard, while retaining their Frappe roles.
  if (ctx.is_instructor) {
    return 'instructor'
  }

  if (ctx.is_student) {
    return 'student'
  }

  if (ctx.is_staff) {
    return 'staff'
  }

  return null
}

export function isStudentUser(ctx) {
  return portalMode(ctx) === 'student'
}

export function isStaffUser(ctx) {
  return portalMode(ctx) === 'staff'
}

export function isInstructorUser(ctx) {
  return portalMode(ctx) === 'instructor'
}

export function canManageStudents(ctx) {
  return Boolean(ctx && (ctx.is_staff || ctx.roles?.includes('Education User')))
}

function normalize(message) {
  const ctx = message && typeof message === 'object' ? message : {}

  ctx.roles = Array.isArray(ctx.roles) ? ctx.roles : []
  ctx.is_staff = Boolean(ctx.is_staff)
  ctx.is_instructor = Boolean(ctx.is_instructor)
  ctx.is_student = Boolean(ctx.is_student)
  ctx.has_student_record = Boolean(ctx.has_student_record)
  ctx.student =
    ctx.student && typeof ctx.student === 'object' ? ctx.student : null
  ctx.instructor =
    ctx.instructor && typeof ctx.instructor === 'object' ? ctx.instructor : null

  return ctx
}
