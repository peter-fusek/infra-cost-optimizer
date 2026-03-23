/**
 * Protect mutation endpoints (POST/PATCH/DELETE) with session auth.
 * GET requests remain public (read-only dashboard).
 * The /auth/ routes and scheduled tasks are excluded.
 */
export default defineEventHandler(async (event) => {
  const method = event.method
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') return

  const path = getRequestURL(event).pathname

  // Allow auth routes, session management, internal Nitro task triggers, and bug reports
  if (path.startsWith('/auth/') || path.startsWith('/api/_auth/') || path.startsWith('/_nitro/') || path === '/api/bugs') return

  const session = await getUserSession(event)
  if (!session.user) {
    throw createError({ statusCode: 401, message: 'Authentication required' })
  }
})
