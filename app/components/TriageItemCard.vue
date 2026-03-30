<script setup lang="ts">
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

const props = defineProps<{
  item: TriageItem
  reviewed: boolean
}>()

const emit = defineEmits<{
  review: [itemId: string]
  alertAction: [payload: { id: number; status: string }]
}>()

const SOURCE_ICONS: Record<string, string> = {
  alert: 'i-lucide-bell',
  expiry: 'i-lucide-calendar-clock',
  depletion: 'i-lucide-battery-low',
  limit: 'i-lucide-gauge',
  reminder: 'i-lucide-pencil',
  drift: 'i-lucide-git-compare',
}

const SOURCE_LABELS: Record<string, string> = {
  alert: 'Alert',
  expiry: 'Expiry',
  depletion: 'Depletion',
  limit: 'Plan Limit',
  reminder: 'Manual Cost',
  drift: 'Drift',
}

function handleAction() {
  if (props.item.actionType === 'alert_ack' && props.item.alertId) {
    emit('alertAction', { id: props.item.alertId, status: 'acknowledged' })
  } else if (props.item.actionType === 'alert_resolve' && props.item.alertId) {
    emit('alertAction', { id: props.item.alertId, status: 'resolved' })
  } else if (props.item.actionType === 'external_link' && props.item.actionHref) {
    window.open(props.item.actionHref, '_blank')
  } else if (props.item.actionType === 'record_cost') {
    navigateTo('/manual')
  } else if (props.item.actionType === 'drift_issue') {
    const title = encodeURIComponent(`Drift: ${props.item.title}`)
    const body = encodeURIComponent(`Drift item detected:\n- **Key**: ${props.item.driftKey}\n- **Detail**: ${props.item.subtitle}\n- **Type**: ${props.item.detail}\n\nAction: Add \`'${props.item.driftKey}'\` to DRIFT_IGNORE_LIST in server/services/drift-detector.ts`)
    window.open(`https://github.com/peter-fusek/infracost/issues/new?title=${title}&body=${body}`, '_blank')
  }
}
</script>

<template>
  <div
    class="flex items-start gap-3 rounded-lg border p-3 transition-colors"
    :class="[
      reviewed ? 'border-[var(--ui-border)] bg-[var(--ui-bg)] opacity-60' : 'border-[var(--ui-border)] bg-[var(--ui-bg-elevated)]',
      item.severity === 'red' ? 'border-l-2 border-l-[var(--ui-error)]' : 'border-l-2 border-l-[var(--ui-warning)]',
    ]"
  >
    <!-- Icon -->
    <div
      class="flex size-8 shrink-0 items-center justify-center rounded-lg"
      :class="item.severity === 'red' ? 'bg-red-500/10' : 'bg-amber-500/10'"
    >
      <UIcon
        :name="SOURCE_ICONS[item.source] ?? 'i-lucide-circle'"
        class="size-4"
        :class="item.severity === 'red' ? 'text-red-500' : 'text-amber-500'"
      />
    </div>

    <!-- Content -->
    <div class="min-w-0 flex-1">
      <div class="flex items-center gap-2">
        <span class="text-sm font-semibold truncate">{{ item.title }}</span>
        <UBadge :color="item.severity === 'red' ? 'error' : 'warning'" variant="subtle" size="xs">
          {{ SOURCE_LABELS[item.source] ?? item.source }}
        </UBadge>
        <UBadge v-if="reviewed" color="success" variant="subtle" size="xs">Reviewed</UBadge>
      </div>
      <p class="mt-0.5 text-xs text-[var(--ui-text-muted)] truncate">{{ item.subtitle }}</p>
      <p class="text-xs text-[var(--ui-text-dimmed)]">{{ item.detail }}</p>
    </div>

    <!-- Actions -->
    <div class="flex shrink-0 items-center gap-1.5">
      <UButton
        :label="item.actionLabel"
        size="xs"
        :variant="item.severity === 'red' ? 'solid' : 'outline'"
        @click="handleAction"
      />
      <UButton
        v-if="!reviewed && item.actionType !== 'alert_ack' && item.actionType !== 'alert_resolve'"
        icon="i-lucide-check"
        size="xs"
        variant="ghost"
        aria-label="Mark reviewed"
        @click="emit('review', item.id)"
      />
    </div>
  </div>
</template>
