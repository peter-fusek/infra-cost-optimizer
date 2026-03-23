<script setup lang="ts">
import type { BugContext } from '~/composables/useBugReport'

const { capture, clearCapturedErrors } = useBugReport()
const toast = useToast()

const open = ref(false)
const capturing = ref(false)
const submitting = ref(false)
const description = ref('')
const context = ref<BugContext | null>(null)

async function openModal() {
  capturing.value = true
  try {
    context.value = await capture()
  }
  catch (err) {
    console.error('Failed to capture bug context:', err)
    toast.add({ title: 'Screenshot failed', description: 'You can still submit the report.', color: 'warning' })
  }
  finally {
    capturing.value = false
  }
  open.value = true
}

async function submit() {
  if (!description.value.trim()) {
    toast.add({ title: 'Please describe the bug', color: 'warning' })
    return
  }
  submitting.value = true
  try {
    const result = await $fetch<{ issueUrl: string; issueNumber: number }>('/api/bugs', {
      method: 'POST',
      body: {
        description: description.value.trim(),
        context: context.value
          ? {
              url: context.value.url,
              title: context.value.title,
              userAgent: context.value.userAgent,
              viewport: context.value.viewport,
              timestamp: context.value.timestamp,
              consoleErrors: context.value.consoleErrors,
              visibleText: context.value.visibleText,
              screenshotDataUrl: context.value.screenshotDataUrl,
            }
          : null,
      },
    })
    toast.add({
      title: `Bug reported #${result.issueNumber}`,
      description: 'Thanks! We\'ll look into it.',
      color: 'success',
    })
    close()
  }
  catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to submit bug report'
    toast.add({ title: 'Error', description: msg, color: 'error' })
  }
  finally {
    submitting.value = false
  }
}

function close() {
  open.value = false
  description.value = ''
  context.value = null
  clearCapturedErrors()
}
</script>

<template>
  <div class="fixed bottom-6 right-6 z-[100]">
    <UButton
      icon="i-lucide-bug"
      size="lg"
      color="neutral"
      variant="solid"
      class="rounded-full shadow-lg"
      aria-label="Report a bug"
      @click="openModal"
    />

    <UModal v-model:open="open" title="Report a Bug" :ui="{ content: 'max-w-xl' }">
      <template #body>
        <div class="space-y-4">
          <div class="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-elevated)]">
            <div v-if="capturing" class="flex items-center justify-center h-40">
              <UIcon name="i-lucide-loader-2" class="size-6 animate-spin text-[var(--ui-text-muted)]" />
              <span class="ml-2 text-sm text-[var(--ui-text-muted)]">Capturing screenshot...</span>
            </div>
            <img
              v-else-if="context?.screenshotDataUrl"
              :src="context.screenshotDataUrl"
              alt="Page screenshot"
              class="w-full max-h-48 object-cover object-top"
            >
            <div v-else class="flex items-center justify-center h-40 text-sm text-[var(--ui-text-dimmed)]">
              No screenshot available
            </div>
          </div>

          <div v-if="context" class="text-xs text-[var(--ui-text-dimmed)] space-y-0.5">
            <div><span class="font-medium">Page:</span> {{ context.title }}</div>
            <div><span class="font-medium">URL:</span> {{ context.url }}</div>
            <div><span class="font-medium">Viewport:</span> {{ context.viewport.width }}x{{ context.viewport.height }}</div>
            <div v-if="context.consoleErrors.length">
              <span class="font-medium text-red-500">{{ context.consoleErrors.length }} console error(s) captured</span>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1.5">What went wrong?</label>
            <UInput
              v-model="description"
              placeholder="Describe the bug in one line..."
              size="lg"
              autofocus
              :maxlength="500"
              @keydown.enter.prevent="submit"
            />
            <div class="text-xs text-[var(--ui-text-dimmed)] mt-1">
              {{ description.length }}/500 &mdash; Press Enter to submit
            </div>
          </div>

          <div class="flex justify-end gap-2 pt-2">
            <UButton label="Cancel" variant="ghost" @click="close" />
            <UButton
              label="Submit Bug"
              icon="i-lucide-send"
              color="primary"
              :loading="submitting"
              :disabled="!description.trim() || capturing"
              @click="submit"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
