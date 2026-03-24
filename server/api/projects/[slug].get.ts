import { and, eq, isNull } from 'drizzle-orm'
import { projects, services, platforms } from '../../db/schema'

export default defineEventHandler(async (event) => {
  const db = useDB()
  const slug = getRouterParam(event, 'slug')

  if (!slug) {
    throw createError({ statusCode: 400, message: 'slug is required' })
  }

  const [project] = await db
    .select()
    .from(projects)
    .where(and(eq(projects.slug, slug), eq(projects.isActive, true), isNull(projects.deletedAt)))
    .limit(1)

  if (!project) {
    throw createError({ statusCode: 404, message: `Project '${slug}' not found` })
  }

  // Get services linked to this project
  const projectServices = await db
    .select({
      id: services.id,
      name: services.name,
      serviceType: services.serviceType,
      monthlyCostEstimate: services.monthlyCostEstimate,
      platformName: platforms.name,
      platformSlug: platforms.slug,
      platformType: platforms.type,
      isActive: services.isActive,
    })
    .from(services)
    .innerJoin(platforms, eq(services.platformId, platforms.id))
    .where(and(eq(services.project, slug), isNull(services.deletedAt)))
    .orderBy(platforms.name, services.name)

  return {
    project,
    services: projectServices,
  }
})
