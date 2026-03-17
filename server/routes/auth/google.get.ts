export default defineOAuthGoogleEventHandler({
  config: {
    scope: ['openid', 'email', 'profile'],
  },
  async onSuccess(event, { user }) {
    const config = useRuntimeConfig()
    const allowed = config.allowedEmails
      .split(',')
      .map((e: string) => e.trim())
      .filter(Boolean)

    if (allowed.length > 0 && !allowed.includes(user.email)) {
      console.error(`[auth] Rejected login from ${user.email}`)
      throw createError({ statusCode: 403, message: 'Not authorized' })
    }

    await setUserSession(event, {
      user: {
        email: user.email,
        name: user.name,
        picture: user.picture,
      },
    })

    return sendRedirect(event, '/')
  },
  async onError(event, error) {
    console.error('[auth] OAuth error:', error)
    return sendRedirect(event, '/')
  },
})
