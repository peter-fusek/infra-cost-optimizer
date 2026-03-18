import { and, eq } from 'drizzle-orm'
import { platforms } from '../../db/schema'

export default defineEventHandler(async (event) => {
  await requireUserSession(event)

  const slug = getRouterParam(event, 'slug')
  if (!slug) throw createError({ statusCode: 400, message: 'slug is required' })

  const body = await readBody(event)
  if (!body || typeof body !== 'object') {
    throw createError({ statusCode: 400, message: 'Request body is required' })
  }

  const db = useDB()

  const updates: Record<string, unknown> = {}
  if (typeof body.accountIdentifier === 'string') {
    updates.accountIdentifier = body.accountIdentifier.trim() || null
  }

  if (Object.keys(updates).length === 0) {
    throw createError({ statusCode: 400, message: 'No valid fields to update' })
  }

  const [updated] = await db
    .update(platforms)
    .set(updates)
    .where(and(eq(platforms.slug, slug), eq(platforms.isActive, true)))
    .returning()

  if (!updated) {
    throw createError({ statusCode: 404, message: `Platform '${slug}' not found` })
  }

  return updated
})
