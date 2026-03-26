<script setup lang="ts">
/**
 * Skeleton loading placeholder with variants matching common page layouts.
 * Usage: <SkeletonLoader variant="cards" /> or <SkeletonLoader variant="table" :rows="5" />
 */
const props = withDefaults(defineProps<{
  variant: 'cards' | 'table' | 'countdown' | 'chart' | 'list'
  rows?: number
  cards?: number
}>(), {
  rows: 5,
  cards: 4,
})
</script>

<template>
  <div class="animate-pulse space-y-4" role="status" aria-label="Loading">
    <!-- Metric cards (dashboard, budgets) -->
    <template v-if="variant === 'cards'">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div v-for="i in cards" :key="i" class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 space-y-3">
          <div class="h-3 w-20 rounded bg-[var(--ui-bg-elevated)]" />
          <div class="h-7 w-28 rounded bg-[var(--ui-bg-elevated)]" />
          <div class="h-2 w-full rounded bg-[var(--ui-bg-elevated)]" />
        </div>
      </div>
    </template>

    <!-- Table rows (breakdown, platform list) -->
    <template v-else-if="variant === 'table'">
      <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] overflow-hidden">
        <!-- Header -->
        <div class="flex gap-4 px-5 py-3 border-b border-[var(--ui-border)]">
          <div class="h-3 w-24 rounded bg-[var(--ui-bg-elevated)]" />
          <div class="h-3 w-16 rounded bg-[var(--ui-bg-elevated)]" />
          <div class="ml-auto h-3 w-20 rounded bg-[var(--ui-bg-elevated)]" />
          <div class="h-3 w-20 rounded bg-[var(--ui-bg-elevated)]" />
        </div>
        <!-- Rows -->
        <div v-for="i in rows" :key="i" class="flex items-center gap-4 px-5 py-3 border-b border-[var(--ui-border)] last:border-b-0">
          <div class="h-3 rounded bg-[var(--ui-bg-elevated)]" :style="{ width: `${60 + (i * 13) % 40}px` }" />
          <div class="h-5 w-12 rounded-full bg-[var(--ui-bg-elevated)]" />
          <div class="ml-auto h-3 w-16 rounded bg-[var(--ui-bg-elevated)]" />
          <div class="h-3 w-16 rounded bg-[var(--ui-bg-elevated)]" />
        </div>
      </div>
    </template>

    <!-- Countdown cards (depletion, limits, expiry) -->
    <template v-else-if="variant === 'countdown'">
      <div v-for="i in rows" :key="i" class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 space-y-4">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="size-6 rounded-full bg-[var(--ui-bg-elevated)]" />
            <div class="space-y-2">
              <div class="h-4 w-32 rounded bg-[var(--ui-bg-elevated)]" />
              <div class="h-3 w-20 rounded-full bg-[var(--ui-bg-elevated)]" />
            </div>
          </div>
          <div class="text-right space-y-1">
            <div class="h-6 w-20 rounded bg-[var(--ui-bg-elevated)]" />
            <div class="h-2 w-16 rounded bg-[var(--ui-bg-elevated)] ml-auto" />
          </div>
        </div>
        <div class="h-3 w-full rounded-full bg-[var(--ui-bg-elevated)]" />
        <div class="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <div v-for="j in 4" :key="j" class="space-y-1">
            <div class="h-2 w-14 rounded bg-[var(--ui-bg-elevated)]" />
            <div class="h-4 w-20 rounded bg-[var(--ui-bg-elevated)]" />
          </div>
        </div>
      </div>
    </template>

    <!-- Chart placeholder (trends) -->
    <template v-else-if="variant === 'chart'">
      <div class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 space-y-4">
        <div class="h-4 w-36 rounded bg-[var(--ui-bg-elevated)]" />
        <div class="flex items-end gap-4 h-48">
          <div v-for="i in 6" :key="i" class="flex-1 rounded-t bg-[var(--ui-bg-elevated)]" :style="{ height: `${30 + (i * 17) % 70}%` }" />
        </div>
      </div>
    </template>

    <!-- List/cards (optimizations, analytics, status) -->
    <template v-else-if="variant === 'list'">
      <div v-for="i in rows" :key="i" class="rounded-xl border border-[var(--ui-border)] bg-[var(--ui-bg)] p-5 space-y-3">
        <div class="flex items-center justify-between">
          <div class="space-y-2">
            <div class="h-4 rounded bg-[var(--ui-bg-elevated)]" :style="{ width: `${120 + (i * 37) % 80}px` }" />
            <div class="flex gap-2">
              <div class="h-5 w-14 rounded-full bg-[var(--ui-bg-elevated)]" />
              <div class="h-5 w-14 rounded-full bg-[var(--ui-bg-elevated)]" />
            </div>
          </div>
          <div class="h-8 w-20 rounded bg-[var(--ui-bg-elevated)]" />
        </div>
        <div class="h-3 w-full rounded bg-[var(--ui-bg-elevated)]" />
        <div class="h-3 w-3/4 rounded bg-[var(--ui-bg-elevated)]" />
      </div>
    </template>

    <span class="sr-only">Loading...</span>
  </div>
</template>
