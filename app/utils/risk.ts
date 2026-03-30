/** Shared risk color/icon lookup maps — single source of truth for countdown + triage pages */

export const RISK_COLORS: Record<string, string> = {
  depleted: 'error', expired: 'error', exceeded: 'error', critical: 'error',
  warning: 'warning', ok: 'success',
}
export function riskColor(level: string): string { return RISK_COLORS[level] ?? 'neutral' }

export const RISK_ICONS: Record<string, string> = {
  depleted: 'i-lucide-x-circle', expired: 'i-lucide-x-circle', exceeded: 'i-lucide-x-circle',
  critical: 'i-lucide-alert-triangle', warning: 'i-lucide-alert-circle',
  ok: 'i-lucide-check-circle',
}
export function riskIcon(level: string): string { return RISK_ICONS[level] ?? 'i-lucide-circle-dashed' }

export const BAR_COLORS: Record<string, string> = {
  depleted: 'bg-[var(--ui-error)]', exceeded: 'bg-[var(--ui-error)]', critical: 'bg-[var(--ui-error)]',
  warning: 'bg-[var(--ui-warning)]', ok: 'bg-[var(--ui-success)]',
}
export function barColor(level: string): string { return BAR_COLORS[level] ?? 'bg-[var(--ui-text-dimmed)]' }

export const RISK_TEXT_CLASSES: Record<string, string> = {
  ok: 'text-[var(--ui-success)]', warning: 'text-[var(--ui-warning)]',
  critical: 'text-[var(--ui-error)]', depleted: 'text-[var(--ui-error)]',
  expired: 'text-[var(--ui-error)]', exceeded: 'text-[var(--ui-error)]',
  unknown: 'text-[var(--ui-text-dimmed)]',
}
export function riskTextClass(level: string): string { return RISK_TEXT_CLASSES[level] ?? '' }

export const URGENCY_SCORES: Record<string, number> = {
  depleted: 0, expired: 0, exceeded: 1,
  critical: 2,
  warning: 3,
  ok: 4, unknown: 5,
}
