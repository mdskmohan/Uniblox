/**
 * KPICard.jsx
 *
 * Key Performance Indicator card components for dashboard pages.
 *
 * KPICard — single metric card with label, value, and optional trend indicator
 *   Props:
 *     label      — metric name (e.g. "Approval Rate")
 *     value      — formatted display value (e.g. "73%", "284")
 *     trend      — trend value string (e.g. "+4.2%")
 *     trendLabel — context label (e.g. "vs last month")
 *     trendDir   — 'up' | 'down' | 'flat' — controls icon and color
 *
 * KPIGrid — responsive grid wrapper for KPICard components
 *   Props:
 *     cols — 3 | 4 | 6 — sets the column count breakpoint classes
 */

import { cn } from '@/lib/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function KPICard({ label, value, trend, trendLabel, trendDir = 'up', className }) {
  const TrendIcon = trendDir === 'up' ? TrendingUp : trendDir === 'down' ? TrendingDown : Minus
  const trendColor =
    trendDir === 'up'
      ? 'text-positive'
      : trendDir === 'down'
      ? 'text-destructive'
      : 'text-ink-tertiary'

  return (
    <div className={cn('bg-surface-secondary border border-line rounded-md p-4', className)}>
      <div className="text-xs text-ink-secondary mb-2">{label}</div>
      <div className="text-kpi font-semibold text-ink-primary leading-none mb-1.5">{value}</div>
      {(trend || trendLabel) && (
        <div className={cn('flex items-center gap-1 text-xs', trendColor)}>
          <TrendIcon size={12} />
          <span>{trend}</span>
          {trendLabel && <span className="text-ink-tertiary">{trendLabel}</span>}
        </div>
      )}
    </div>
  )
}

export function KPIGrid({ children, cols = 4, className }) {
  return (
    <div
      className={cn(
        'grid gap-4 mb-6',
        cols === 4 && 'grid-cols-2 lg:grid-cols-4',
        cols === 3 && 'grid-cols-1 sm:grid-cols-3',
        cols === 6 && 'grid-cols-2 lg:grid-cols-6',
        className
      )}
    >
      {children}
    </div>
  )
}
