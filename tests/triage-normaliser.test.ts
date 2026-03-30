import { describe, it, expect } from 'vitest'
import {
  normaliseAlert, normaliseExpiry, normaliseDepletion, normaliseLimit,
  normaliseReminder, normaliseDrift, PLATFORM_ACTION_URLS,
} from '../server/utils/triage-normaliser'

describe('normaliseAlert', () => {
  it('returns null for resolved alerts', () => {
    expect(normaliseAlert({ id: 1, severity: 'critical', alertType: 'budget_90', message: 'test', status: 'resolved' })).toBeNull()
  })

  it('normalises a pending critical alert', () => {
    const item = normaliseAlert({ id: 42, severity: 'critical', alertType: 'budget_100', message: 'Budget exceeded', status: 'pending' })
    expect(item).not.toBeNull()
    expect(item!.id).toBe('alert:42')
    expect(item!.source).toBe('alert')
    expect(item!.severity).toBe('red')
    expect(item!.urgencyScore).toBe(2)
    expect(item!.actionType).toBe('alert_ack')
    expect(item!.alertId).toBe(42)
  })

  it('normalises a pending warning alert as yellow', () => {
    const item = normaliseAlert({ id: 5, severity: 'warning', alertType: 'anomaly_spike', message: 'Spike', status: 'pending' })
    expect(item!.severity).toBe('yellow')
    expect(item!.urgencyScore).toBe(3)
  })

  it('acknowledged alert gets resolve action', () => {
    const item = normaliseAlert({ id: 5, severity: 'warning', alertType: 'test', message: 'test', status: 'acknowledged' })
    expect(item!.actionType).toBe('alert_resolve')
    expect(item!.actionLabel).toBe('Resolve')
  })
})

describe('normaliseExpiry', () => {
  it('returns null for ok items', () => {
    expect(normaliseExpiry({ platform: 'Render', service: 'test', daysUntil: 60, risk: 'ok', description: '', impact: '', monthlyAfter: null })).toBeNull()
  })

  it('normalises expired item as red', () => {
    const item = normaliseExpiry({ platform: 'Render', service: 'oncoteam-db', daysUntil: -5, risk: 'expired', description: 'DB expired', impact: 'Downtime', monthlyAfter: 7 })
    expect(item!.severity).toBe('red')
    expect(item!.urgencyScore).toBe(0)
    expect(item!.detail).toBe('Expired')
  })

  it('normalises warning item as yellow', () => {
    const item = normaliseExpiry({ platform: 'Websupport', service: 'domain.com', daysUntil: 20, risk: 'warning', description: 'Renewal', impact: 'Domain loss', monthlyAfter: null })
    expect(item!.severity).toBe('yellow')
    expect(item!.detail).toBe('20 days remaining')
  })
})

describe('normaliseDepletion', () => {
  it('returns null for ok items', () => {
    expect(normaliseDepletion({ slug: 'railway', name: 'Railway', creditBalance: 100, daysRemaining: 30, riskLevel: 'ok' })).toBeNull()
  })

  it('normalises depleted item as red', () => {
    const item = normaliseDepletion({ slug: 'anthropic', name: 'Anthropic', creditBalance: 0, daysRemaining: 0, riskLevel: 'depleted' })
    expect(item!.severity).toBe('red')
    expect(item!.urgencyScore).toBe(0)
    expect(item!.actionLabel).toBe('Top Up')
    expect(item!.actionHref).toBe(PLATFORM_ACTION_URLS.anthropic)
  })

  it('normalises critical as red', () => {
    const item = normaliseDepletion({ slug: 'railway', name: 'Railway', creditBalance: 1.5, daysRemaining: 3, riskLevel: 'critical' })
    expect(item!.severity).toBe('red')
    expect(item!.detail).toBe('~3 days left')
  })
})

describe('normaliseLimit', () => {
  it('returns empty array when all metrics ok', () => {
    const items = normaliseLimit({
      slug: 'neon', name: 'Neon',
      metrics: [{ metric: 'active_seconds', label: 'Active Seconds', pct: 50, riskLevel: 'ok', usedFormatted: '180k', limitFormatted: '360k' }],
    })
    expect(items).toHaveLength(0)
  })

  it('returns items for warning/critical metrics', () => {
    const items = normaliseLimit({
      slug: 'turso', name: 'Turso',
      metrics: [
        { metric: 'rows_read', label: 'Rows Read', pct: 92, riskLevel: 'critical', usedFormatted: '460M', limitFormatted: '500M' },
        { metric: 'storage', label: 'Storage', pct: 30, riskLevel: 'ok', usedFormatted: '1.5 GiB', limitFormatted: '5 GiB' },
      ],
    })
    expect(items).toHaveLength(1)
    expect(items[0].id).toBe('limit:turso:rows_read')
    expect(items[0].severity).toBe('red')
  })
})

describe('normaliseReminder', () => {
  it('returns null when current month recorded', () => {
    expect(normaliseReminder({ slug: 'claude-max', name: 'Claude Max', daysSinceLastRecord: 5, currentMonthRecorded: true, expectedAmount: 246 })).toBeNull()
  })

  it('returns yellow when not overdue', () => {
    const item = normaliseReminder({ slug: 'google-services', name: 'Google Services', daysSinceLastRecord: 20, currentMonthRecorded: false, expectedAmount: 62.5 })
    expect(item!.severity).toBe('yellow')
    expect(item!.actionType).toBe('record_cost')
  })

  it('returns red when overdue >35 days', () => {
    const item = normaliseReminder({ slug: 'websupport', name: 'Websupport', daysSinceLastRecord: 40, currentMonthRecorded: false, expectedAmount: 0.58 })
    expect(item!.severity).toBe('red')
    expect(item!.urgencyScore).toBe(2)
  })

  it('returns yellow when never recorded', () => {
    const item = normaliseReminder({ slug: 'claude-max', name: 'Claude Max', daysSinceLastRecord: null, currentMonthRecorded: false, expectedAmount: 246 })
    expect(item!.severity).toBe('yellow')
    expect(item!.detail).toBe('Never recorded')
  })
})

describe('normaliseDrift', () => {
  it('normalises new service as yellow', () => {
    const item = normaliseDrift({ type: 'new', platform: 'Railway', name: 'test-service', detail: 'In project "test"' })
    expect(item.severity).toBe('yellow')
    expect(item.actionLabel).toBe('Add to Registry')
    expect(item.driftKey).toBe('Railway_test-service')
  })

  it('normalises removed service as red', () => {
    const item = normaliseDrift({ type: 'removed', platform: 'Render', name: 'old-db', detail: 'Not found in API' })
    expect(item.severity).toBe('red')
    expect(item.urgencyScore).toBe(2)
    expect(item.actionLabel).toBe('Add to Ignore List')
  })

  it('normalises changed service as yellow', () => {
    const item = normaliseDrift({ type: 'changed', platform: 'Render', name: 'svc', detail: 'Service is SUSPENDED' })
    expect(item.severity).toBe('yellow')
  })
})

describe('PLATFORM_ACTION_URLS', () => {
  it('has URLs for key platforms', () => {
    expect(PLATFORM_ACTION_URLS.railway).toContain('railway.app')
    expect(PLATFORM_ACTION_URLS.anthropic).toContain('anthropic.com')
    expect(PLATFORM_ACTION_URLS.neon).toContain('neon.tech')
    expect(PLATFORM_ACTION_URLS.turso).toContain('turso.tech')
    expect(PLATFORM_ACTION_URLS.render).toContain('render.com')
  })
})
