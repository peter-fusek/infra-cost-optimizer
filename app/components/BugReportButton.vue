<script setup lang="ts">
import type { BugContext } from '~/composables/useBugReport'

const { captureContext, clearCapturedErrors } = useBugReport()
const toast = useToast()

const open = ref(false)
const submitting = ref(false)
const description = ref('')
const context = ref<BugContext | null>(null)
const screenshotDataUrl = ref<string | null>(null)
const fileInputRef = ref<HTMLInputElement | null>(null)

function openModal() {
  context.value = captureContext()
  open.value = true
}

function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return
  for (const item of items) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const file = item.getAsFile()
      if (file) readImageFile(file)
      return
    }
  }
}

function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (file) readImageFile(file)
  input.value = ''
}

function readImageFile(file: File) {
  if (file.size > 5 * 1024 * 1024) {
    toast.add({ title: 'Image too large', description: 'Max 5 MB', color: 'warning' })
    return
  }
  const reader = new FileReader()
  reader.onload = () => {
    screenshotDataUrl.value = reader.result as string
  }
  reader.readAsDataURL(file)
}

function removeScreenshot() {
  screenshotDataUrl.value = null
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
            }
          : null,
        screenshotDataUrl: screenshotDataUrl.value,
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
  screenshotDataUrl.value = null
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
        <div class="space-y-4" @paste="handlePaste">
          <!-- Screenshot area -->
          <div class="rounded-lg border border-[var(--ui-border)] overflow-hidden bg-[var(--ui-bg-elevated)]">
            <div v-if="screenshotDataUrl" class="relative">
              <img
                :src="screenshotDataUrl"
                alt="Bug screenshot"
                class="w-full max-h-48 object-cover object-top"
              >
              <button
                class="absolute top-2 right-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/70"
                aria-label="Remove screenshot"
                @click="removeScreenshot"
              >
                <UIcon name="i-lucide-x" class="size-4" />
              </button>
            </div>
            <div
              v-else
              class="flex flex-col items-center justify-center h-32 text-sm text-[var(--ui-text-dimmed)] gap-2 cursor-pointer"
              @click="fileInputRef?.click()"
            >
              <UIcon name="i-lucide-clipboard-paste" class="size-6" />
              <span>Paste screenshot (Ctrl+V) or click to upload</span>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                class="hidden"
                @change="handleFileSelect"
              >
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
              :disabled="!description.trim()"
              @click="submit"
            />
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>
