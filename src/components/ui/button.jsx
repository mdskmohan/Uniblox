/**
 * button.jsx
 *
 * Base Button component. Renders a <button> element with consistent styling,
 * focus ring, and a built-in loading state (spinner + dimmed label).
 *
 * Props:
 *  variant   — 'primary' | 'secondary' | 'danger' | 'ghost' | 'success'  (default: 'primary')
 *  size      — 'sm' | 'md' | 'lg' | 'xl' | 'icon'                        (default: 'md')
 *  loading   — boolean; shows spinner and disables the button              (default: false)
 *  disabled  — boolean; disables and grays out the button
 *  className — additional Tailwind classes
 *  ...props  — passed through to the underlying <button>
 *
 * Usage:
 *  <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
 *  <Button loading={isSaving}>Save Changes</Button>
 */

import { cn } from '@/lib/utils'

const variants = {
  primary:   'bg-brand text-white hover:bg-brand-hover disabled:opacity-50',
  secondary: 'bg-transparent text-ink-primary border border-line-strong hover:bg-surface-hover disabled:opacity-50',
  danger:    'bg-destructive text-white hover:opacity-90 disabled:opacity-50',
  ghost:     'bg-transparent text-ink-secondary hover:bg-surface-hover hover:text-ink-primary disabled:opacity-50',
  success:   'bg-positive text-white hover:opacity-90 disabled:opacity-50',
}

const sizes = {
  sm:  'h-7 px-2.5 text-xs',
  md:  'h-8 px-4 text-sm',
  lg:  'h-10 px-5 text-md',
  xl:  'h-11 px-6 text-md w-full',
  icon:'h-8 w-8 p-0',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  className,
  children,
  disabled,
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded font-medium',
        'cursor-pointer transition-all duration-150 whitespace-nowrap',
        'focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2',
        variants[variant],
        sizes[size],
        (disabled || loading) && 'cursor-not-allowed',
        className
      )}
      {...props}
    >
      {loading ? (
        <>
          <span
            className={cn(
              'inline-block w-3.5 h-3.5 border-2 rounded-full animate-spin flex-shrink-0',
              variant === 'secondary' || variant === 'ghost'
                ? 'border-ink-tertiary border-t-ink-primary'
                : 'border-white/30 border-t-white'
            )}
          />
          <span className="opacity-70">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  )
}
