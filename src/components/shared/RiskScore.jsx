/**
 * RiskScore.jsx
 *
 * A collection of visual components for displaying AI-generated risk scores
 * and confidence levels. All components are null-safe: they render a dash (—)
 * or an empty state when the value is null or undefined.
 *
 * Exports:
 *  RiskScoreCell   — compact inline score + mini bar, used in tables
 *  RiskGauge       — circular SVG gauge, used in detail views and sidebars
 *  SubScoreBar     — labeled horizontal bar for sub-score breakdown
 *  ConfidenceBar   — labeled bar for AI confidence level with low-confidence warning
 *
 * Risk level thresholds (from getRiskLevel in utils.js):
 *  0–39  → low    → green (positive)
 *  40–69 → medium → amber (caution)
 *  70–100→ high   → red (destructive)
 */

import { cn } from '@/lib/utils'
import { getRiskLevel } from '@/lib/utils'

// Inline risk score with bar (used in tables)
export function RiskScoreCell({ score }) {
  if (score == null) return <span className="text-ink-tertiary text-sm">—</span>
  const level = getRiskLevel(score)
  const color = level === 'low' ? 'bg-positive' : level === 'medium' ? 'bg-caution' : 'bg-destructive'
  const textColor = level === 'low' ? 'text-positive-text' : level === 'medium' ? 'text-caution-text' : 'text-destructive-text'

  return (
    <div className="flex items-center gap-2">
      <span className={cn('text-sm font-medium w-6 tabular-nums', textColor)}>{score}</span>
      <div className="w-10 h-1 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// Circular gauge (used in detail views)
export function RiskGauge({ score, size = 120 }) {
  if (score == null) return null
  const level  = getRiskLevel(score)
  const stroke = level === 'low' ? 'var(--success)' : level === 'medium' ? 'var(--warning)' : 'var(--danger)'
  const textCls = level === 'low' ? 'text-positive-text' : level === 'medium' ? 'text-caution-text' : 'text-destructive-text'

  const r  = 44
  const cx = 56
  const cy = 56
  const circumference = 2 * Math.PI * r
  const pct = Math.min(100, Math.max(0, score))
  const dashoffset = circumference * (1 - pct / 100)

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size} viewBox="0 0 112 112">
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="var(--bg-tertiary)" strokeWidth="10" />
        <circle
          cx={cx} cy={cy} r={r}
          fill="none"
          stroke={stroke}
          strokeWidth="10"
          strokeDasharray={circumference}
          strokeDashoffset={dashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${cx} ${cy})`}
          style={{ transition: 'stroke-dashoffset 0.6s ease' }}
        />
        <text x={cx} y={cy + 6} textAnchor="middle" fontSize="22" fontWeight="600"
              fill="var(--text-primary)" fontFamily="Inter,sans-serif">
          {score}
        </text>
      </svg>
      <span className={cn('text-xs font-medium capitalize', textCls)}>
        {level === 'low' ? 'Low Risk' : level === 'medium' ? 'Med Risk' : 'High Risk'}
      </span>
    </div>
  )
}

// Sub-score bar row
export function SubScoreBar({ label, score }) {
  if (score == null) {
    return (
      <div className="mb-3">
        <div className="flex justify-between text-xs mb-1">
          <span className="text-ink-secondary">{label}</span>
          <span className="text-ink-tertiary">—</span>
        </div>
        <div className="h-2 bg-surface-tertiary rounded-full" />
      </div>
    )
  }

  const level = getRiskLevel(score)
  const color = level === 'low' ? 'bg-positive' : level === 'medium' ? 'bg-caution' : 'bg-destructive'
  const textCls = level === 'low' ? 'text-positive-text' : level === 'medium' ? 'text-caution-text' : 'text-destructive-text'

  return (
    <div className="mb-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-ink-secondary">{label}</span>
        <span className={cn('font-medium tabular-nums', textCls)}>{score}</span>
      </div>
      <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
        <div
          className={cn('h-full rounded-full transition-all duration-500', color)}
          style={{ width: `${score}%` }}
        />
      </div>
    </div>
  )
}

// Confidence display
export function ConfidenceBar({ confidence }) {
  if (confidence == null) {
    return (
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full" />
        <span className="text-xs text-ink-tertiary w-10 text-right">—</span>
      </div>
    )
  }

  const isLow = confidence < 60
  const color = isLow ? 'bg-destructive' : confidence >= 80 ? 'bg-positive' : 'bg-caution'
  const textCls = isLow ? 'text-destructive-text' : confidence >= 80 ? 'text-positive-text' : 'text-caution-text'

  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
        <div className={cn('h-full rounded-full transition-all', color)}
             style={{ width: `${confidence}%` }} />
      </div>
      <span className={cn('text-xs font-medium tabular-nums w-10 text-right', textCls)}>
        {confidence}%
      </span>
    </div>
  )
}
