import { and, eq, isNull } from 'drizzle-orm'
import { optimizations, platforms, services } from '../../db/schema'

const EUR_USD_RATE = 0.92
function toEur(usd: number) { return Math.round(usd * EUR_USD_RATE * 100) / 100 }

export default defineEventHandler(async () => {
  const db = useDB()

  const rows = await db
    .select({
      id: optimizations.id,
      title: optimizations.title,
      description: optimizations.description,
      platformName: platforms.name,
      platformSlug: platforms.slug,
      serviceName: services.name,
      estimatedSavings: optimizations.estimatedSavings,
      effort: optimizations.effort,
      status: optimizations.status,
      suggestedBy: optimizations.suggestedBy,
      createdAt: optimizations.createdAt,
      implementedAt: optimizations.implementedAt,
    })
    .from(optimizations)
    .leftJoin(platforms, eq(optimizations.platformId, platforms.id))
    .leftJoin(services, eq(optimizations.serviceId, services.id))
    .where(and(eq(optimizations.isActive, true), isNull(optimizations.deletedAt)))
    .orderBy(optimizations.estimatedSavings)

  // Reverse to get highest savings first (desc on numeric string)
  const sorted = rows.sort((a, b) => {
    const sa = parseFloat(a.estimatedSavings || '0')
    const sb = parseFloat(b.estimatedSavings || '0')
    return sb - sa
  })

  return sorted.map(r => ({
    ...r,
    estimatedSavingsUsd: parseFloat(r.estimatedSavings || '0'),
    estimatedSavingsEur: toEur(parseFloat(r.estimatedSavings || '0')),
    eurUsdRate: EUR_USD_RATE,
  }))
})
