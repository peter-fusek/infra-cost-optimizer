import { platforms, services, budgets, optimizations } from './schema'

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
  { slug: 'uptimerobot', name: 'UptimeRobot', type: 'monitoring', collectionMethod: 'api' as const, billingCycle: 'monthly', apiConfigKey: 'uptimeRobotApiKey' },
] as const

// Service seed data — known services from our infrastructure
// Updated 2026-03-24: merged partners+homegrif→homegrif.com, split Claude Max accounts, fixed GCP, added Websupport domains
export const serviceSeed = [
  // Render — Professional plan
  { platformSlug: 'render', name: 'Professional Plan', project: null, serviceType: 'subscription', monthlyCostEstimate: '19.00' },

  // Render — Web services (partners + homegrif merged into homegrif.com — 2026-03-24)
  { platformSlug: 'render', name: 'homegrif_com', project: 'homegrif.com', serviceType: 'web', monthlyCostEstimate: '7.13' },
  { platformSlug: 'render', name: 'homegrif_com-test', project: 'homegrif.com', serviceType: 'web', monthlyCostEstimate: '7.13' },
  { platformSlug: 'render', name: 'partners-cz-prod', project: 'homegrif.com', serviceType: 'web', monthlyCostEstimate: '13.18' },
  { platformSlug: 'render', name: 'partners-cz-test', project: 'homegrif.com', serviceType: 'web', monthlyCostEstimate: '7.13' },
  { platformSlug: 'render', name: 'scrabsnap', project: 'scrabsnap', serviceType: 'web', monthlyCostEstimate: '2.57' },
  { platformSlug: 'render', name: 'budgetco', project: 'budgetco', serviceType: 'web', monthlyCostEstimate: '2.14' },
  { platformSlug: 'render', name: 'contacts-refiner-dashboard', project: 'contacts-refiner', serviceType: 'web', monthlyCostEstimate: '2.23' },
  { platformSlug: 'render', name: 'instareaweb', project: 'instarea', serviceType: 'web', monthlyCostEstimate: '0.00' },
  { platformSlug: 'render', name: 'oncoteam-dashboard', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '0.00' }, // SUSPENDED — migrated to Railway
  { platformSlug: 'render', name: 'oncoteam-dashboard-test', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '0.00' }, // SUSPENDED
  { platformSlug: 'render', name: 'oncoteam-landing', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '0.00' }, // SUSPENDED — migrated to Railway

  // Render — Databases (partners + homegrif merged into homegrif.com)
  { platformSlug: 'render', name: 'homegrif-db', project: 'homegrif.com', serviceType: 'database', monthlyCostEstimate: '6.42' },
  { platformSlug: 'render', name: 'homegrif-db-test', project: 'homegrif.com', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'partners-db-prod', project: 'homegrif.com', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'partners-db-test', project: 'homegrif.com', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'scrabsnap-db', project: 'scrabsnap', serviceType: 'database', monthlyCostEstimate: '10.70' },
  { platformSlug: 'render', name: 'budgetco-db', project: 'budgetco', serviceType: 'database', monthlyCostEstimate: '0.00' },
  { platformSlug: 'render', name: 'infracost-db', project: 'infracost', serviceType: 'database', monthlyCostEstimate: '6.42' },
  { platformSlug: 'render', name: 'oncoteam-db-prod', project: 'oncoteam', serviceType: 'database', monthlyCostEstimate: '0.00' }, // SUSPENDED — migrated to Railway
  { platformSlug: 'render', name: 'oncoteam-db-test', project: 'oncoteam', serviceType: 'database', monthlyCostEstimate: '0.00' }, // SUSPENDED

  // Render — Cron + Pipeline
  { platformSlug: 'render', name: 'homegrif-daily-report', project: 'homegrif.com', serviceType: 'cron', monthlyCostEstimate: '0.65' },
  { platformSlug: 'render', name: 'Pipeline Minutes', project: null, serviceType: 'ci_cd', monthlyCostEstimate: '0.00' },

  // Railway — 2 projects, 5 services (updated 2026-03-16 after oncoteam migration)
  { platformSlug: 'railway', name: 'oncofiles', project: 'oncofiles', serviceType: 'web', monthlyCostEstimate: '9.23' },
  { platformSlug: 'railway', name: 'oncoteam-backend', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '4.00' },
  { platformSlug: 'railway', name: 'oncoteam-dashboard', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '3.00' },
  { platformSlug: 'railway', name: 'oncoteam-landing', project: 'oncoteam', serviceType: 'web', monthlyCostEstimate: '1.00' },
  { platformSlug: 'railway', name: 'oncoteam-postgres', project: 'oncoteam', serviceType: 'database', monthlyCostEstimate: '2.00' },

  // Anthropic API — includes autonomous agent (~$2/day = ~$60/mo) + manual usage (~$65/mo)
  { platformSlug: 'anthropic', name: 'API Usage', project: null, serviceType: 'api_usage', monthlyCostEstimate: '65.00' },

  // Claude Max — two accounts (scraped 2026-03-24)
  // Personal: peterfusek1980@gmail.com — Max plan €180/mo
  { platformSlug: 'claude-max', name: 'Max Subscription (personal)', project: 'personal', serviceType: 'subscription', monthlyCostEstimate: '196.00' },
  { platformSlug: 'claude-max', name: 'Extra Usage (personal)', project: 'personal', serviceType: 'usage', monthlyCostEstimate: '29.00' }, // €26.43 spent Mar, €30 cap
  // Instarea: peter.fusek@instarea.sk — Team plan 5 seats
  { platformSlug: 'claude-max', name: 'Team Subscription (instarea)', project: 'instarea', serviceType: 'subscription', monthlyCostEstimate: '297.00' }, // €273.58/mo ≈ $297
  { platformSlug: 'claude-max', name: 'Extra Usage (instarea)', project: 'instarea', serviceType: 'usage', monthlyCostEstimate: '116.00' }, // €106.43 spent Mar, €300 cap

  // Neon (free tier)
  { platformSlug: 'neon', name: 'homegrif-neon', project: 'homegrif.com', serviceType: 'database', monthlyCostEstimate: '0.00' },
  { platformSlug: 'neon', name: 'scrabsnap-neon', project: 'scrabsnap', serviceType: 'database', monthlyCostEstimate: '0.00' },

  // GCP — actual billing: €4.66 MTD Mar 2026, Autoniq PulseShape Backups (scraped 2026-03-24)
  { platformSlug: 'gcp', name: 'contacts-refiner', project: 'contacts-refiner', serviceType: 'cloud_run', monthlyCostEstimate: '0.00' },
  { platformSlug: 'gcp', name: 'PulseShape Backups', project: 'pulseshape', serviceType: 'storage', monthlyCostEstimate: '7.15' }, // €6.56 forecasted EOM

  // Resend
  { platformSlug: 'resend', name: 'Email Sending', project: 'homegrif.com', serviceType: 'api_usage', monthlyCostEstimate: '0.00' },

  // Turso
  { platformSlug: 'turso', name: 'oncofiles-db', project: 'oncoteam', serviceType: 'database', monthlyCostEstimate: '0.00' },

  // UptimeRobot
  { platformSlug: 'uptimerobot', name: 'Monitoring (10 monitors)', project: null, serviceType: 'monitoring', monthlyCostEstimate: '0.00' },

  // Websupport — 18 domains + 1 hosting + 1 email (scraped 2026-03-24)
  { platformSlug: 'websupport', name: 'Hosting Super (instarea)', project: 'instarea', serviceType: 'hosting', monthlyCostEstimate: '5.00' }, // ~€60/yr
  { platformSlug: 'websupport', name: 'infracost.eu', project: 'infracost', serviceType: 'domain', monthlyCostEstimate: '0.58' }, // ~€6.90/yr
  { platformSlug: 'websupport', name: 'budgetco.eu', project: 'budgetco', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'oncoteam.cloud', project: 'oncoteam', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'oncofiles.com', project: 'oncofiles', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'contactrefiner.com', project: 'contacts-refiner', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'homegrif.cz', project: 'homegrif.com', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'homegrif.com', project: 'homegrif.com', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'shiftrotation.com', project: 'shiftrotation', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'repli.city', project: 'replica.city', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'replica.city', project: 'replica.city', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'goreplicity.com', project: 'replica.city', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'goreplicacity.com', project: 'replica.city', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'getwhysurvey.com', project: 'seekwhy', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'getsurveylink.com', project: 'seekwhy', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'grandpacheck.com', project: 'grandpa_check', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'pulseshape.com', project: 'pulseshape', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'instarea.com', project: 'instarea', serviceType: 'domain', monthlyCostEstimate: '0.58' },
  { platformSlug: 'websupport', name: 'instarea.sk', project: 'instarea', serviceType: 'domain', monthlyCostEstimate: '0.58' },
]

// Default global budget — updated 2026-03-24 to reflect actual ~$800/mo with Claude dual accounts
export const budgetSeed = [
  { name: 'Total Infrastructure', platformId: null, monthlyLimit: '850.00' },
]

// Optimization opportunities — from March 2026 audit
// Each has pros/cons in the description for actionable decision-making
export const optimizationSeed = [
  {
    title: 'Recreate 6 over-provisioned Render DBs with 1GB disk',
    description: `**Current:** 6 databases provisioned at 15GB disk (~$10.70/mo each).
**Target:** Recreate with 1GB disk (~$6.42/mo each).

**PROS:**
- Saves ~$25.68/mo ($308/yr, ~€23.62/mo)
- Biggest single optimization available
- No performance impact (actual data uses <100MB per DB)

**CONS:**
- Cannot resize in-place — must create new DB, migrate data, update connection strings
- Requires downtime per DB (~15min each, 6 DBs = ~90min total)
- Risk of missed connection string updates breaking services
- DBs affected: homegrif-db-test, oncoteam-db-prod, oncoteam-db-test, partners-db-prod, partners-db-test, scrabsnap-db`,
    platformSlug: 'render',
    estimatedSavings: '25.68',
    effort: 'medium' as const,
    suggestedBy: 'ai' as const,
  },
  {
    title: 'Review Claude Max subscription necessity (€180/mo)',
    description: `**Current:** Claude Max plan at €180/mo (~$196/mo) — upgraded from Pro €18/mo around Mar 6.
**Alternative:** Downgrade to Pro €18/mo + rely on API credits for heavy usage.

**PROS:**
- Saves up to €162/mo (~$178/mo, $2,136/yr) — largest single cost item
- Pro plan sufficient for light conversational use
- API usage ($65/mo) already covers programmatic needs

**CONS:**
- Max plan provides 5x higher rate limits and priority access
- May hit rate limits on Pro during intensive development sessions
- Extra Usage credits (€50/mo) would no longer be available
- Development velocity could decrease if hitting API limits

**VERDICT:** Only worth downgrading if development pace slows. Monitor actual Max usage patterns first.`,
    platformSlug: 'claude-max',
    estimatedSavings: '178.00',
    effort: 'trivial' as const,
    suggestedBy: 'ai' as const,
  },
  {
    title: 'Investigate partners-cz-prod Standard tier usage',
    description: `**Current:** partners-cz-prod using Standard plan ($0.0336/hr) for part of the month + Starter ($0.0094/hr) for the rest — ~$13.18/mo projected.
**Target:** Ensure it stays on Starter plan ($0.0094/hr) — ~$7.13/mo.

**PROS:**
- Saves ~$6/mo ($72/yr)
- Starter tier sufficient for current traffic levels
- No migration required — just plan change

**CONS:**
- Standard tier provides 1 vCPU + 2GB RAM (vs 0.5 vCPU + 512MB on Starter)
- May have been upgraded for a reason (traffic spike, memory pressure)
- Need to verify current RAM/CPU utilization before downgrading

**ACTION:** Check Render metrics for partners-cz-prod. If P95 memory <400MB, safe to lock on Starter.`,
    platformSlug: 'render',
    estimatedSavings: '6.00',
    effort: 'trivial' as const,
    suggestedBy: 'ai' as const,
  },
  {
    title: 'Enable Anthropic API auto-reload to prevent outage',
    description: `**Current:** $27.98 credits remaining as of Mar 14. Auto-reload is DISABLED.
**Risk:** Credits will run out in ~2 weeks at current burn rate ($65/mo), causing API outage for all services using Claude API.

**PROS:**
- Prevents unexpected API outage
- Zero cost (auto-reload just adds credits, doesn't increase spend)
- Required for production reliability

**CONS:**
- Enables automatic spending (could spike if usage anomaly)
- No built-in spend cap on Anthropic platform
- Need to monitor monthly usage manually

**ACTION:** Enable auto-reload with $50 threshold. Add monthly usage alert.`,
    platformSlug: 'anthropic',
    estimatedSavings: '0.00',
    effort: 'trivial' as const,
    suggestedBy: 'ai' as const,
  },
  {
    title: 'Monitor Render pipeline minutes to avoid overage',
    description: `**Current:** 476/500 free minutes used at day 14 (95.2%). Overage: $5/1000 min.
**Risk:** Will exceed 500 min this month. New services (budgetco, contacts-refiner, oncoteam) driving more builds.

**PROS:**
- Avoids $5-10/mo overage charges
- Forces build discipline (fewer unnecessary deploys)
- Can enable "auto-deploy on push" selectively

**CONS:**
- Restricting builds slows development iteration
- May need to manually trigger deploys
- Alternative: accept small overage as cost of faster iteration

**ACTION:** Disable auto-deploy on test environments. Use manual deploys for non-critical services. Consider merging PRs less frequently.`,
    platformSlug: 'render',
    estimatedSavings: '5.00',
    effort: 'small' as const,
    suggestedBy: 'ai' as const,
  },
  {
    title: 'Migrate infracost app from Render to Railway',
    description: `**Current:** infracost on Render free web + Basic-256mb DB ($6.42/mo).
**Target:** Railway Hobby plan ($5/mo) already running — add infracost there.

**PROS:**
- Saves ~$1.42/mo on DB (Railway DB may be cheaper or free within plan)
- Reduces Render pipeline pressure (fewer build minutes consumed)
- Consolidates infrastructure monitoring tool on a second platform (reduces single-vendor risk)
- Railway Hobby plan already being paid for

**CONS:**
- Migration effort: need to set up Railway service, migrate DB, update DNS
- Railway Hobby plan has limits (8GB RAM, 8 vCPU total across all services)
- May conflict with oncofiles and oncoteam resources on same plan
- Render free web tier is actually $0 — only the DB costs money

**VERDICT:** Small savings but good for pipeline pressure. Defer until pipeline overage becomes recurring.`,
    platformSlug: 'render',
    estimatedSavings: '1.42',
    effort: 'medium' as const,
    suggestedBy: 'ai' as const,
  },
  {
    title: 'Consolidate test environments (share DBs or use branching)',
    description: `**Current:** Each project has prod + test web service + prod + test DB = 4x cost.
Example: homegrif has homegrif_com ($7.13) + homegrif_com-test ($7.13) + homegrif-db ($6.42) + homegrif-db-test ($10.70) = $31.38/mo

**PROS:**
- Could save $20-40/mo by sharing test DBs or using Neon branching (free tier)
- Neon already has homegrif-neon and scrabsnap-neon instances
- Test DBs don't need persistence or high availability

**CONS:**
- Shared test DBs can cause data conflicts between developers
- Neon branching has cold-start latency (~1-2s)
- Migration effort per project
- Need to ensure test data isolation

**ACTION:** For projects with Neon instances, migrate test environments to Neon branching. Keep prod DBs on Render.`,
    platformSlug: 'render',
    estimatedSavings: '30.00',
    effort: 'large' as const,
    suggestedBy: 'ai' as const,
  },
  {
    title: 'Remove deleted Render services still accruing charges',
    description: `**Current:** robota ($0.21) and robota-test ($0.21) show as "Deleted" but still charged in March billing.

**PROS:**
- Saves $0.42/mo (minor)
- Cleans up billing noise

**CONS:**
- None — these are already deleted services
- Charges should stop automatically next billing cycle

**ACTION:** Verify in April billing that charges stopped. If not, contact Render support.`,
    platformSlug: 'render',
    estimatedSavings: '0.42',
    effort: 'trivial' as const,
    suggestedBy: 'ai' as const,
  },
]
