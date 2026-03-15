<script setup lang="ts">
interface ServiceBreakdown {
  serviceId: number
  name: string
  project: string | null
  serviceType: string
  estimateUsd: number
  estimateEur: number
  actualMtdUsd: number
  actualMtdEur: number
  eomUsd: number
  eomEur: number
  costType: string
  collectionMethod: string
  recordCount: number
  variance: number
}

interface PlatformBreakdown {
  platformId: number
  slug: string
  name: string
  type: string
  totalEstimateUsd: number
  totalEstimateEur: number
  totalActualMtdUsd: number
  totalActualMtdEur: number
  totalEomUsd: number
  totalEomEur: number
  services: ServiceBreakdown[]
}

interface BreakdownResponse {
  monthProgress: number
  eurUsdRate: number
  grandTotal: {
    estimateUsd: number
    estimateEur: number
    mtdUsd: number
    mtdEur: number
    eomUsd: number
    eomEur: number
  }
  platforms: PlatformBreakdown[]
}

const { data, status } = await useFetch<BreakdownResponse>('/api/costs/breakdown')

const expanded = ref<Set<number>>(new Set())

function toggle(platformId: number) {
  if (expanded.value.has(platformId)) {
    expanded.value.delete(platformId)
  } else {
    expanded.value.add(platformId)
  }
}

function fmt(n: number) {
  return n.toFixed(2)
}

function varianceClass(v: number) {
  if (v > 5) return 'text-[var(--ui-error)]'
  if (v < -5) return 'text-[var(--ui-success)]'
  return 'text-[var(--ui-text-muted)]'
}

const typeIcons: Record<string, string> = {
  web: 'i-lucide-globe',
  database: 'i-lucide-database',
  subscription: 'i-lucide-credit-card',
  cron: 'i-lucide-clock',
  ci_cd: 'i-lucide-git-branch',
  api_usage: 'i-lucide-zap',
  usage: 'i-lucide-activity',
  cloud_run: 'i-lucide-cloud',
}
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="text-2xl font-bold">Cost Breakdown</h2>
      <p class="text-sm text-[var(--ui-text-muted)]">
        Per-service detail &middot; {{ data?.monthProgress ?? 0 }}% through month &middot; 1 USD = {{ data?.eurUsdRate ?? 0.92 }} EUR
      </p>
    </div>

    <div v-if="status === 'pending'" class="flex justify-center py-8">
      <UIcon name="i-lucide-loader-2" class="size-6 animate-spin" />
    </div>

    <template v-else-if="data">
      <!-- Grand totals -->
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <UCard>
          <p class="text-sm text-[var(--ui-text-muted)]">Monthly Estimate</p>
          <p class="text-2xl font-semibold">${{ fmt(data.grandTotal.estimateUsd) }}</p>
          <p class="text-sm text-[var(--ui-text-dimmed)]">€{{ fmt(data.grandTotal.estimateEur) }}</p>
        </UCard>
        <UCard>
          <p class="text-sm text-[var(--ui-text-muted)]">MTD Actual</p>
          <p class="text-2xl font-semibold">${{ fmt(data.grandTotal.mtdUsd) }}</p>
          <p class="text-sm text-[var(--ui-text-dimmed)]">€{{ fmt(data.grandTotal.mtdEur) }}</p>
        </UCard>
        <UCard>
          <p class="text-sm text-[var(--ui-text-muted)]">EOM Projected</p>
          <p class="text-2xl font-semibold">${{ fmt(data.grandTotal.eomUsd) }}</p>
          <p class="text-sm text-[var(--ui-text-dimmed)]">€{{ fmt(data.grandTotal.eomEur) }}</p>
        </UCard>
      </div>

      <!-- Platform accordions -->
      <div class="space-y-3">
        <UCard
          v-for="platform in data.platforms"
          :key="platform.platformId"
          class="cursor-pointer"
          @click="toggle(platform.platformId)"
        >
          <!-- Platform header row -->
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon
                :name="expanded.has(platform.platformId) ? 'i-lucide-chevron-down' : 'i-lucide-chevron-right'"
                class="size-4 text-[var(--ui-text-muted)]"
              />
              <div>
                <span class="font-semibold">{{ platform.name }}</span>
                <UBadge :color="platform.type === 'ai' ? 'warning' : platform.type === 'hosting' ? 'primary' : 'neutral'" variant="subtle" size="xs" class="ml-2">
                  {{ platform.type }}
                </UBadge>
              </div>
            </div>
            <div class="flex gap-6 text-right text-sm">
              <div>
                <p class="text-[var(--ui-text-muted)]">Estimate</p>
                <p class="font-medium">${{ fmt(platform.totalEstimateUsd) }}</p>
                <p class="text-xs text-[var(--ui-text-dimmed)]">€{{ fmt(platform.totalEstimateEur) }}</p>
              </div>
              <div>
                <p class="text-[var(--ui-text-muted)]">MTD</p>
                <p class="font-medium">${{ fmt(platform.totalActualMtdUsd) }}</p>
                <p class="text-xs text-[var(--ui-text-dimmed)]">€{{ fmt(platform.totalActualMtdEur) }}</p>
              </div>
              <div>
                <p class="text-[var(--ui-text-muted)]">EOM</p>
                <p class="font-medium">${{ fmt(platform.totalEomUsd) }}</p>
                <p class="text-xs text-[var(--ui-text-dimmed)]">€{{ fmt(platform.totalEomEur) }}</p>
              </div>
            </div>
          </div>

          <!-- Expanded service detail -->
          <div v-if="expanded.has(platform.platformId)" class="mt-4 border-t border-[var(--ui-border)] pt-4" @click.stop>
            <table class="w-full text-sm">
              <thead>
                <tr class="text-left text-[var(--ui-text-muted)]">
                  <th class="pb-2 font-medium">Service</th>
                  <th class="pb-2 font-medium">Project</th>
                  <th class="pb-2 font-medium">Type</th>
                  <th class="pb-2 text-right font-medium">Est. USD</th>
                  <th class="pb-2 text-right font-medium">Est. EUR</th>
                  <th class="pb-2 text-right font-medium">MTD USD</th>
                  <th class="pb-2 text-right font-medium">EOM USD</th>
                  <th class="pb-2 text-right font-medium">Variance</th>
                  <th class="pb-2 font-medium">Source</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="svc in platform.services" :key="svc.serviceId" class="border-t border-[var(--ui-border-muted)]">
                  <td class="py-2">
                    <div class="flex items-center gap-1.5">
                      <UIcon :name="typeIcons[svc.serviceType] ?? 'i-lucide-box'" class="size-3.5 text-[var(--ui-text-muted)]" />
                      <span>{{ svc.name }}</span>
                    </div>
                  </td>
                  <td class="py-2 text-[var(--ui-text-muted)]">{{ svc.project || '—' }}</td>
                  <td class="py-2">
                    <UBadge variant="subtle" size="xs" color="neutral">{{ svc.serviceType }}</UBadge>
                  </td>
                  <td class="py-2 text-right font-mono">${{ fmt(svc.estimateUsd) }}</td>
                  <td class="py-2 text-right font-mono text-[var(--ui-text-muted)]">€{{ fmt(svc.estimateEur) }}</td>
                  <td class="py-2 text-right font-mono">
                    <template v-if="svc.recordCount > 0">${{ fmt(svc.actualMtdUsd) }}</template>
                    <span v-else class="text-[var(--ui-text-dimmed)]">—</span>
                  </td>
                  <td class="py-2 text-right font-mono">${{ fmt(svc.eomUsd) }}</td>
                  <td class="py-2 text-right font-mono" :class="varianceClass(svc.variance)">
                    <template v-if="svc.variance !== 0">
                      {{ svc.variance > 0 ? '+' : '' }}${{ fmt(svc.variance) }}
                    </template>
                    <span v-else class="text-[var(--ui-text-dimmed)]">—</span>
                  </td>
                  <td class="py-2">
                    <UBadge
                      :color="svc.collectionMethod === 'api' ? 'success' : svc.collectionMethod === 'hybrid' ? 'warning' : 'neutral'"
                      variant="subtle"
                      size="xs"
                    >
                      {{ svc.collectionMethod }}
                    </UBadge>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </UCard>
      </div>
    </template>
  </div>
</template>
