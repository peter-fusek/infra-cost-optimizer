/**
 * Google API authentication helper using service account credentials.
 * Generates OAuth2 access tokens for GA4 Data API and Search Console API.
 */

import { GoogleAuth } from 'google-auth-library'

let _auth: GoogleAuth | null = null

export function getGoogleAuth(): GoogleAuth | null {
  if (_auth) return _auth

  const config = useRuntimeConfig()
  if (!config.gcpServiceAccountJson) return null

  try {
    const credentials = JSON.parse(config.gcpServiceAccountJson)
    _auth = new GoogleAuth({
      credentials,
      scopes: [
        'https://www.googleapis.com/auth/analytics.readonly',
        'https://www.googleapis.com/auth/webmasters.readonly',
      ],
    })
    return _auth
  }
  catch (err) {
    console.error('[google-auth] Failed to parse GCP_SERVICE_ACCOUNT_JSON:', err instanceof Error ? err.message : err)
    return null
  }
}

export async function getAccessToken(): Promise<string | null> {
  const auth = getGoogleAuth()
  if (!auth) return null

  try {
    const client = await auth.getClient()
    const token = await client.getAccessToken()
    return token.token ?? null
  }
  catch (err) {
    console.error('[google-auth] Failed to get access token:', err instanceof Error ? err.message : err)
    return null
  }
}
