export function useCollectionTrigger(onSuccess?: () => void | Promise<void>) {
  const collecting = ref(false)
  const toast = useToast()

  async function triggerCollection() {
    collecting.value = true
    try {
      await $fetch('/api/collect/trigger', { method: 'POST' })
      toast.add({ title: 'Collection started', description: 'Data will refresh shortly', color: 'success' })
      if (onSuccess) await onSuccess()
    } catch (err: any) {
      toast.add({ title: 'Error', description: err?.data?.message || 'Failed to trigger collection', color: 'error' })
    } finally {
      collecting.value = false
    }
  }

  return { collecting, triggerCollection }
}
