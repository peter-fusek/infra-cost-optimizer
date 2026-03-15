/** Trigger a manual deploy via Render API */
export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  if (!config.renderApiKey) {
    throw createError({ statusCode: 500, message: 'RENDER_API_KEY not configured' })
  }

  const serviceId = 'srv-d6qsslh4tr6s73foe81g'
  const response = await fetch(
    `https://api.render.com/v1/services/${serviceId}/deploys`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${config.renderApiKey}`,
      },
      body: JSON.stringify({}),
    },
  )

  if (!response.ok) {
    const text = await response.text()
    throw createError({ statusCode: response.status, message: `Render API: ${text}` })
  }

  const data = await response.json()
  return { deploy: data }
})
