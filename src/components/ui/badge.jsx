/**
 * badge.jsx
 *
 * Inline label badge components.
 *
 * Badge — base component. Pass a variant to set the color scheme.
 *   Variants: approved, pending, declined, referred, processing,
 *             info, success, warning, danger, gray, purple
 *
 * StatusBadge — convenience wrapper that maps a submission/EOI/enrollment
 *   status string to the correct Badge variant automatically. Unknown status
 *   strings fall back to 'gray'.
 *
 * Usage:
 *  <Badge variant="warning">MARGINAL</Badge>
 *  <StatusBadge status={submission.status} />
 */

import { cn } from '@/lib/utils'

const variants = {
  approved:   'bg-positive-light text-positive-text',
  pending:    'bg-caution-light text-caution-text',
  declined:   'bg-destructive-light text-destructive-text',
  referred:   'bg-violet-light text-violet-text',
  processing: 'bg-brand-light text-brand-text',
  info:       'bg-brand-light text-brand-text',
  success:    'bg-positive-light text-positive-text',
  warning:    'bg-caution-light text-caution-text',
  danger:     'bg-destructive-light text-destructive-text',
  gray:       'bg-surface-tertiary text-ink-secondary',
  purple:     'bg-violet-light text-violet-text',
}

export function Badge({ variant = 'gray', className, children, ...props }) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded text-xs font-medium whitespace-nowrap',
        variants[variant] ?? variants.gray,
        className
      )}
      {...props}
    >
      {children}
    </span>
  )
}

// Convenience status badge
const STATUS_MAP = {
  APPROVED:    'approved',
  PENDING:     'pending',
  DECLINED:    'declined',
  REFERRED:    'referred',
  PROCESSING:  'processing',
  OPEN:        'success',
  CLOSED:      'gray',
  IN_REVIEW:   'processing',
  PENDING_INFO:'pending',
  Active:      'success',
  Inactive:    'gray',
  'Under Review': 'processing',
  'Pending Medical': 'pending',
  'Medical Exam Required': 'warning',
  Expired:     'gray',
  'Pending Start': 'info',
}

export function StatusBadge({ status, className }) {
  const variant = STATUS_MAP[status] ?? 'gray'
  return (
    <Badge variant={variant} className={className}>
      {status}
    </Badge>
  )
}
