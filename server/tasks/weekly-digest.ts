import { sendWeeklyDigest } from '../services/weekly-digest'

export default defineTask({
  meta: {
    name: 'weekly-digest',
    description: 'Send weekly cost digest email',
  },
  async run() {
    const db = useDB()
    const config = useRuntimeConfig()
    const result = await sendWeeklyDigest(db, config as unknown as Record<string, string>)
    return { result }
  },
})
