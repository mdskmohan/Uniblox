/**
 * card.jsx
 *
 * Container card components for grouping related content with a consistent
 * border + background + border-radius treatment.
 *
 * Card       — outer container; set hoverable={true} for clickable list cards
 * CardHeader — top section with bottom border (typically title + action button)
 * CardTitle  — h3 heading inside a CardHeader
 * CardBody   — main content area with standard padding (p-5)
 * CardFooter — bottom section with top border (typically summary stats or actions)
 *
 * Usage:
 *  <Card>
 *    <CardHeader>
 *      <CardTitle>Risk Assessment</CardTitle>
 *    </CardHeader>
 *    <CardBody>...</CardBody>
 *  </Card>
 */

import { cn } from '@/lib/utils'

export function Card({ className, children, hoverable = false, onClick, ...props }) {
  return (
    <div
      className={cn(
        'bg-surface-primary border border-line rounded-md',
        hoverable && 'cursor-pointer transition-all duration-150 hover:border-line-strong hover:bg-surface-hover',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-5 py-4 border-b border-line',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function CardTitle({ className, children, ...props }) {
  return (
    <h3
      className={cn('text-lg font-semibold text-ink-primary', className)}
      {...props}
    >
      {children}
    </h3>
  )
}

export function CardBody({ className, children, ...props }) {
  return (
    <div className={cn('p-5', className)} {...props}>
      {children}
    </div>
  )
}

export function CardFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-5 py-3 border-t border-line',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
