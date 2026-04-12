/**
 * Banner.jsx
 *
 * Contextual alert banner for inline page-level messages (not toasts).
 * Use this for persistent warnings or regulatory notices that must stay
 * visible while the user is working on the page.
 *
 * Variants:
 *  info     — blue, informational
 *  success  — green, confirmation
 *  warning  — amber, action required
 *  danger   — red, blocking or destructive
 *  phi      — amber, full-width HIPAA/PHI notice (used via <PHIBanner />)
 *
 * The Banner component accepts an optional `actions` prop (rendered below the
 * message) and `children` for the body text. PHIBanner is a zero-config
 * preset for HIPAA Protected Health Information notices.
 */

import { cn } from '@/lib/utils'
import { AlertTriangle, Info, CheckCircle2, XCircle, Shield } from 'lucide-react'

const VARIANTS = {
  info:    { cls: 'bg-brand-light border border-brand/30 text-brand-text',         Icon: Info },
  success: { cls: 'bg-positive-light border border-positive/30 text-positive-text', Icon: CheckCircle2 },
  warning: { cls: 'bg-caution-light border border-caution/30 text-caution-text',    Icon: AlertTriangle },
  danger:  { cls: 'bg-destructive-light border border-destructive/30 text-destructive-text', Icon: XCircle },
  phi:     { cls: 'bg-caution-light border-y border-caution/40 text-caution-text w-full rounded-none', Icon: Shield },
}

export function Banner({ variant = 'info', title, children, className, actions }) {
  const { cls, Icon } = VARIANTS[variant] ?? VARIANTS.info
  return (
    <div className={cn('flex items-start gap-3 p-3 rounded-md text-sm', cls, className)}>
      <Icon size={16} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        {title && <div className="font-semibold mb-0.5">{title}</div>}
        <div className="leading-relaxed">{children}</div>
        {actions && <div className="flex gap-2 mt-2">{actions}</div>}
      </div>
    </div>
  )
}

export function PHIBanner() {
  return (
    <div className="banner-phi">
      <Shield size={14} className="flex-shrink-0" />
      <span>
        <strong>Protected Health Information</strong> — EOI data is governed by HIPAA.
        Access is logged. Handle in strict accordance with your organization's PHI policies and applicable regulations.
      </span>
    </div>
  )
}
