export const VALID_COST_TYPES = ['subscription', 'usage', 'overage', 'one_time'] as const

export function parseId(raw: string | undefined): number {
  const id = Number(raw)
  if (!Number.isFinite(id) || id <= 0) {
    throw createError({ statusCode: 400, message: 'Invalid ID' })
  }
  return id
}

export function parseAmount(raw: unknown): number {
  const amt = Number(raw)
  if (!Number.isFinite(amt) || amt < 0) {
    throw createError({ statusCode: 400, message: 'amount must be a non-negative number' })
  }
  return amt
}

export function validateCostType(costType: string): void {
  if (!VALID_COST_TYPES.includes(costType as typeof VALID_COST_TYPES[number])) {
    throw createError({ statusCode: 400, message: `costType must be one of: ${VALID_COST_TYPES.join(', ')}` })
  }
}

export function parsePagination(query: Record<string, unknown>, defaultLimit = 100) {
  const limit = Math.min(Math.max(parseInt(query.limit as string) || defaultLimit, 1), 500)
  const offset = Math.max(parseInt(query.offset as string) || 0, 0)
  return { limit, offset }
}
