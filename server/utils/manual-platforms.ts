/** Expected monthly amounts for manual platforms (single source of truth) */
export const MANUAL_PLATFORM_CONFIG: Record<string, { expectedAmount: number; costType: string; serviceName: string }> = {
  'claude-max': { expectedAmount: 246, costType: 'subscription', serviceName: 'Max Subscription + Extra Usage' },
  'google-services': { expectedAmount: 62.50, costType: 'subscription', serviceName: 'Google Workspace Business Standard (5 seats)' },
  'websupport': { expectedAmount: 0.58, costType: 'subscription', serviceName: 'Domain (infracost.eu)' },
}
