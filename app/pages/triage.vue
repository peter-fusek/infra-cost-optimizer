<script setup lang="ts">
useSeoMeta({ title: 'Triage — InfraCost' })

const { loggedIn } = useUserSession()
const toast = useToast()
const { isReviewed, markReviewed } = useTriageReviews()

interface TriageItem {
  id: string
  source: string
  urgencyScore: number
  severity: 'red' | 'yellow'
  title: string
  subtitle: string
  detail: string
  platform: string
  actionType: string
  actionLabel: string
  actionHref?: string
  alertId?: number
  reminderSlug?: string
  driftKey?: string
}

interface TriageResponse {
  items: TriageItem[]
  counts: { red: number; yellow: number; total: number }
  checkedAt: string
}

const { data, status, refresh } = await useLazyFetch<TriageResponse>('/api/triage')

const hideReviewed = ref(true)
const sourceFilter = ref<string>('all')

const SOURCES = [
  { value: 'all', label: 'All' },
  { value: 'alert', label: 'Alerts' },
  { value: 'expiry', label: 'Expiry' },
  { value: 'depletion', label: 'Depletion' },
  { value: 'limit', label: 'Limits' },
  { value: 'reminder', label: 'Reminders' },
  { value: 'drift', label: 'Drift' },
]

const filteredItems = computed(() => {
  if (!data.value?.items) return []
  return data.value.items.filter(item => {
    if (hideReviewed.value && isReviewed(item.id)) return false
    if (sourceFilter.value !== 'all' && item.source !== sourceFilter.value) return false
    return true
  })
})

const redItems = computed(() => filteredItems.value.filter(i => i.severity === 'red'))
const yellowItems = computed(() => filteredItems.value.filter(i => i.severity === 'yellow'))

async function handleAlertAction(payload: { id: number; status: string }) {
  try {
    await $fetch(`/api/alerts/${payload.id}`, {
      method: 'PATCH',
      body: { status: payload.status },
    })
    toast.add({ title: `Alert ${payload.status}`, color: 'success' })
    refresh()
  } catch {
    toast.add({ title: 'Failed to update alert', color: 'error' })
  }
}

function handleReview(itemId: string) {
  markReviewed(itemId)
}
</script>

<template>
  <div class="space-y-6">
    <!-- Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="font-display text-2xl font-bold">Triage</h1>
        <p class="text-sm text-[var(--ui-text-muted)]">Everything that needs attention, in one place.</p>
      </div>
      <div class="flex items-center gap-2">
        <UBadge v-if="data?.counts" color="error" variant="subtle">{{ data.counts.red }} red</UBadge>
        <UBadge v-if="data?.counts" color="warning" variant="subtle">{{ data.counts.yellow }} yellow</UBadge>
        <UButton icon="i-lucide-refresh-cw" variant="ghost" size="xs" :loading="status === 'pending'" @click="refresh()" />
      </div>
    </div>

    <!-- Filters -->
    <div class="flex flex-wrap items-center gap-3">
      <div class="flex gap-1">
        <UButton
          v-for="s in SOURCES"
          :key="s.value"
          :label="s.label"
          size="xs"
          :variant="sourceFilter === s.value ? 'solid' : 'outline'"
          @click="sourceFilter = s.value"
        />
      </div>
      <label class="flex items-center gap-1.5 text-xs text-[var(--ui-text-muted)] cursor-pointer">
        <input v-model="hideReviewed" type="checkbox" class="rounded" />
        Hide reviewed
      </label>
    </div>

    <!-- Loading -->
    <SkeletonLoader v-if="status === 'pending' && !data" variant="list" />

    <!-- Empty state -->
    <div v-else-if="filteredItems.length === 0" class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg-elevated)] p-12 text-center">
      <UIcon name="i-lucide-check-circle" class="mx-auto size-10 text-emerald-500" />
      <h2 class="mt-3 font-display text-lg font-bold">All clear</h2>
      <p class="mt-1 text-sm text-[var(--ui-text-muted)]">Nothing needs attention right now.</p>
    </div>

    <!-- Red items -->
    <section v-if="redItems.length > 0">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-red-500">
        <UIcon name="i-lucide-alert-triangle" class="size-4" />
        Immediate Action ({{ redItems.length }})
      </h2>
      <div class="space-y-2">
        <TriageItemCard
          v-for="item in redItems"
          :key="item.id"
          :item="item"
          :reviewed="isReviewed(item.id)"
          @review="handleReview"
          @alert-action="handleAlertAction"
        />
      </div>
    </section>

    <!-- Yellow items -->
    <section v-if="yellowItems.length > 0">
      <h2 class="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-amber-500">
        <UIcon name="i-lucide-alert-circle" class="size-4" />
        Needs Review ({{ yellowItems.length }})
      </h2>
      <div class="space-y-2">
        <TriageItemCard
          v-for="item in yellowItems"
          :key="item.id"
          :item="item"
          :reviewed="isReviewed(item.id)"
          @review="handleReview"
          @alert-action="handleAlertAction"
        />
      </div>
    </section>

    <!-- Last checked -->
    <p v-if="data?.checkedAt" class="text-xs text-[var(--ui-text-dimmed)]">
      Last checked: {{ new Date(data.checkedAt).toLocaleString() }}
    </p>
  </div>
</template>
