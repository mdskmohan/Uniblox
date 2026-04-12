/**
 * PageHeader.jsx
 *
 * Standard page title section used at the top of every operational page.
 * Renders a left-aligned title + optional subtitle, with an optional right-side
 * actions slot (for buttons like "New Submission" or "Export").
 *
 * Props:
 *  title     — required page title string
 *  subtitle  — optional supporting text below the title
 *  actions   — optional React node(s) to render right-aligned (e.g. <Button>)
 *  className — additional Tailwind classes on the wrapper
 */

import { cn } from '@/lib/utils'

export function PageHeader({ title, subtitle, actions, className }) {
  return (
    <div className={cn('flex items-start justify-between mb-6', className)}>
      <div>
        <h1 className="text-xl font-semibold text-ink-primary">{title}</h1>
        {subtitle && (
          <p className="text-sm text-ink-secondary mt-0.5">{subtitle}</p>
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0">{actions}</div>
      )}
    </div>
  )
}
