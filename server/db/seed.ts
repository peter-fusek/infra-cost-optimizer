import { platforms, services, budgets } from './schema'

// Platform seed data — full service inventory
export const platformSeed = [
  { slug: 'render', name: 'Render', type: 'hosting', collectionMethod: 'hybrid' as const, billingCycle: 'monthly', apiConfigKey: 'renderApiKey' },
  { slug: 'railway', name: 'Railway', type: 'hosting', collectionMethod: 'api' as const, billingCycle: 'usage', apiConfigKey: 'railwayApiToken' },
  { slug: 'anthropic', name: 'Anthropic Claude API', type: 'ai', collectionMethod: 'api' as const, billingCycle: 'usage', apiConfigKey: 'anthropicAdminApiKey' },
  { slug: 'claude-max', name: 'Claude Max', type: 'ai', collectionMethod: 'manual' as const, billingCycle: 'monthly' },
  { slug: 'openai', name: 'OpenAI/ChatGPT', type: 'ai', collectionMethod: 'api' as const, billingCycle: 'usage' },
  { slug: 'resend', name: 'Resend', type: 'email', collectionMethod: 'api' as const, billingCycle: 'usage' },
  { slug: 'twilio', name: 'Twilio', type: 'sms', collectionMethod: 'api' as const, billingCycle: 'usage' },
  { slug: 'turso', name: 'Turso', type: 'database', collectionMethod: 'api' as const, billingCycle: 'usage' },
  { slug: 'neon', name: 'Neon', type: 'database', collectionMethod: 'api' as const, billingCycle: 'usage' },
  { slug: 'gcp', name: 'Google Cloud', type: 'cloud', collectionMethod: 'api' as const, billingCycle: 'usage' },
  { slug: 'websupport', name: 'Websupport', type: 'domain', collectionMethod: 'manual' as const, billingCycle: 'annual' },
  { slug: 'github-actions', name: 'GitHub Actions', type: 'ci_cd', collectionMethod: 'api' as const, billingCycle: 'usage' },
] as const

// Service seed data — known services from our infrastructure
// Verified against live Render billing 2026-03-14
export const serviceSeed = [
  // Render — Professional plan
  { platformSlug: 'render', name: 'Professional Plan', project: null, serviceType: 'subscription', monthlyCostEstimate: '19.00' },

  // Render — Web services (actual names from billing)
  { platformSlug: 'render', name: 'homegrif_com', project: 'homegrif', serviceType: 'web', monthlyCostEstimate: '7.13' },
  { platformSlug: 'render', name: 'homegrif_com-test', project: 'homegrif', serviceType: 'web', monthlyCostEstimate: '7.13' },
  { platformSlug: 'render', name: 'oncoteam-dashboard', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '4.14' },
  { platformSlug: 'render', name: 'oncoteam-dashboard-test', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '4.14' },
  { platformSlug: 'render', name: 'partners-cz-prod', project: 'partners', serviceType: 'web', monthlyCostEstimate: '13.18' },
  { platformSlug: 'render', name: 'partners-cz-test', project: 'partners', serviceType: 'web', monthlyCostEstimate: '7.13' },
  { platformSlug: 'render', name: 'scrabsnap', project: 'scrabsnap', serviceType: 'web', monthlyCostEstimate: '2.57' },
  { platformSlug: 'render', name: 'budgetco', project: 'budgetco', serviceType: 'web', monthlyCostEstimate: '2.14' },
  { platformSlug: 'render', name: 'contacts-refiner-dashboard', project: 'contacts-refiner', serviceType: 'web', monthlyCostEstimate: '2.23' },
  { platformSlug: 'render', name: 'instareaweb', project: 'instarea', serviceType: 'web', monthlyCostEstimate: '0.00' },
  { platformSlug: 'render', name: 'oncoteam-landing', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '0.00' },

  // Render — Databases (disk sizes from billing)
  { platformSlug: 'render', name: 'homegrif-db', project: 'homegrif', serviceType: 'database', monthlyCostEstimate: '6.42' },
  { platformSlug: 'render', name: 'homegrif-db-test', project: 'homegrif', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'oncoteam-db-prod', project: 'oncoteam', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'oncoteam-db-test', project: 'oncoteam', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'partners-db-prod', project: 'partners', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'partners-db-test', project: 'partners', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'scrabsnap-db', project: 'scrabsnap', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'budgetco-db', project: 'budgetco', serviceType: 'database', monthlyCostEstimate: '0.00' },
  { platformSlug: 'render', name: 'infracost-db', project: 'infracost', serviceType: 'database', monthlyCostEstimate: '6.42' },

  // Render — Cron + Pipeline
  { platformSlug: 'render', name: 'homegrif-daily-report', project: 'homegrif', serviceType: 'cron', monthlyCostEstimate: '0.65' },
  { platformSlug: 'render', name: 'Pipeline Minutes', project: null, serviceType: 'ci_cd', monthlyCostEstimate: '0.00' },

  // Railway — 2 projects
  { platformSlug: 'railway', name: 'oncofiles', project: 'oncofiles', serviceType: 'web', monthlyCostEstimate: '9.23' },
  { platformSlug: 'railway', name: 'oncoteam-backend', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '2.60' },

  // Anthropic API
  { platformSlug: 'anthropic', name: 'API Usage', project: null, serviceType: 'api_usage', monthlyCostEstimate: '65.00' },

  // Claude Max subscription
  { platformSlug: 'claude-max', name: 'Max Subscription', project: null, serviceType: 'subscription', monthlyCostEstimate: '196.00' },
  { platformSlug: 'claude-max', name: 'Extra Usage Credits', project: null, serviceType: 'usage', monthlyCostEstimate: '54.00' },

  // Neon (free tier)
  { platformSlug: 'neon', name: 'homegrif-neon', project: 'homegrif', serviceType: 'database', monthlyCostEstimate: '0.00' },
  { platformSlug: 'neon', name: 'scrabsnap-neon', project: 'scrabsnap', serviceType: 'database', monthlyCostEstimate: '0.00' },

  // GCP
  { platformSlug: 'gcp', name: 'contacts-refiner', project: 'contacts-refiner', serviceType: 'cloud_run', monthlyCostEstimate: null },

  // Resend
  { platformSlug: 'resend', name: 'Email Sending', project: 'homegrif', serviceType: 'api_usage', monthlyCostEstimate: null },

  // Turso
  { platformSlug: 'turso', name: 'oncofiles-db', project: 'oncoteam', serviceType: 'database', monthlyCostEstimate: null },
]

// Default global budget — updated to reflect actual ~$475/mo spend
export const budgetSeed = [
  { name: 'Total Infrastructure', platformId: null, monthlyLimit: '500.00' },
]
