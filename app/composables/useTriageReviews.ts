const STORAGE_KEY = 'infracost:triage-reviews'
const WEEK_MS = 7 * 24 * 60 * 60 * 1000

function loadReviews(): Record<string, number> {
  if (import.meta.server) return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch { return {} }
}

function saveReviews(reviews: Record<string, number>) {
  if (import.meta.server) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(reviews))
}

export function useTriageReviews() {
  const reviews = ref<Record<string, number>>(loadReviews())

  // Auto-reset reviews older than 7 days
  if (import.meta.client) {
    const now = Date.now()
    let changed = false
    for (const [key, ts] of Object.entries(reviews.value)) {
      if (now - ts > WEEK_MS) {
        delete reviews.value[key]
        changed = true
      }
    }
    if (changed) saveReviews(reviews.value)
  }

  function isReviewed(itemId: string): boolean {
    return !!reviews.value[itemId]
  }

  function markReviewed(itemId: string) {
    reviews.value[itemId] = Date.now()
    saveReviews(reviews.value)
  }

  function clearReviewed(itemId: string) {
    delete reviews.value[itemId]
    saveReviews(reviews.value)
  }

  function reviewedAt(itemId: string): number | null {
    return reviews.value[itemId] ?? null
  }

  return { reviews, isReviewed, markReviewed, clearReviewed, reviewedAt }
}
