<script setup lang="ts">
interface Platform {
  id: number
  slug: string
  name: string
  type: string
  collectionMethod: string
  billingCycle: string
  accountIdentifier: string | null
  isActive: boolean
  serviceCount: number
  lastCollectedAt: string | null
  lastRunStatus: string | null
  lastRecordsCollected: number | null
  lastError: string | null
}

const { data: platformList, status } = await useFetch<Platform[]>('/api/platforms')

const typeColors: Record<string, string> = {
  hosting: 'primary',
  ai: 'warning',
  database: 'success',
  email: 'info',
  sms: 'info',
  cloud: 'secondary',
  ci_cd: 'neutral',
  domain: 'neutral',
  banking: 'neutral',
  monitoring: 'info',
}

function timeAgo(dateStr: string | null): string {
  if (!dateStr) return 'never'
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60_000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  const days = Math.floor(hrs / 24)
  return `${days}d ago`
}

function freshnessColor(dateStr: string | null, status: string | null): string {
  if (!dateStr) return 'neutral'
  if (status === 'failed') return 'error'
  const hoursOld = (Date.now() - new Date(dateStr).getTime()) / 3_600_000
  if (hoursOld < 25) return 'success'
  if (hoursOld < 49) return 'warning'
  return 'error'
}

function statusIcon(status: string | null): string {
  if (!status) return 'i-lucide-circle-dashed'
  if (status === 'success') return 'i-lucide-circle-check'
  if (status === 'partial') return 'i-lucide-circle-alert'
  if (status === 'failed') return 'i-lucide-circle-x'
  if (status === 'running') return 'i-lucide-loader-2'
  return 'i-lucide-circle-dashed'
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold">Platforms</h2>
      <p class="text-sm text-[var(--ui-text-muted)]">All monitored infrastructure platforms &middot; {{ platformList?.length ?? 0 }} active</p>
    </div>

    <div v-if="status === 'pending'" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
    </div>

    <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <UCard v-for="platform in platformList" :key="platform.id">
        <div class="space-y-3">
          <!-- Header -->
          <div class="flex items-center justify-between">
            <h3 class="font-semibold">{{ platform.name }}</h3>
            <UBadge :color="(typeColors[platform.type] as any) || 'neutral'" variant="subtle" size="sm">
              {{ platform.type }}
            </UBadge>
          </div>

          <!-- Account identifier -->
          <p v-if="platform.accountIdentifier" class="text-xs text-[var(--ui-text-muted)] truncate" :title="platform.accountIdentifier">
            {{ platform.accountIdentifier }}
          </p>

          <!-- Stats row -->
          <div class="flex items-center gap-3 text-xs text-[var(--ui-text-muted)]">
            <span>{{ platform.collectionMethod }}</span>
            <span>&middot;</span>
            <span>{{ platform.billingCycle }}</span>
            <span>&middot;</span>
            <span>{{ platform.serviceCount }} service{{ platform.serviceCount !== 1 ? 's' : '' }}</span>
          </div>

          <!-- Collection status -->
          <div class="flex items-center justify-between text-xs">
            <div class="flex items-center gap-1.5">
              <UIcon
                :name="statusIcon(platform.lastRunStatus)"
                class="size-3.5"
                :class="{
                  'text-[var(--ui-success)]': freshnessColor(platform.lastCollectedAt, platform.lastRunStatus) === 'success',
                  'text-[var(--ui-warning)]': freshnessColor(platform.lastCollectedAt, platform.lastRunStatus) === 'warning',
                  'text-[var(--ui-error)]': freshnessColor(platform.lastCollectedAt, platform.lastRunStatus) === 'error',
                  'text-[var(--ui-text-dimmed)]': freshnessColor(platform.lastCollectedAt, platform.lastRunStatus) === 'neutral',
                  'animate-spin': platform.lastRunStatus === 'running',
                }"
              />
              <span>{{ timeAgo(platform.lastCollectedAt) }}</span>
              <span v-if="platform.lastRecordsCollected" class="text-[var(--ui-text-dimmed)]">
                ({{ platform.lastRecordsCollected }} rec)
              </span>
            </div>
            <UBadge
              v-if="platform.lastRunStatus === 'partial' || platform.lastRunStatus === 'failed'"
              color="error"
              variant="subtle"
              size="xs"
              :title="platform.lastError || ''"
            >
              {{ platform.lastRunStatus }}
            </UBadge>
          </div>
        </div>
      </UCard>
    </div>
  </div>
</template>
