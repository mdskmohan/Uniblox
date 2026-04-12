/**
 * input.jsx
 *
 * Form input primitives. All components accept an `error` boolean that switches
 * the border and focus ring to destructive red.
 *
 * Exports:
 *  Input      — single-line text input (h-8)
 *  Textarea   — multi-line textarea with configurable rows
 *  Select     — styled <select> dropdown
 *  FormGroup  — label + input wrapper with optional error message below
 *
 * Usage:
 *  <Input placeholder="Enter employer name" error={!!errors.name} />
 *  <FormGroup label="State" error={errors.state}>
 *    <Select value={state} onChange={e => setState(e.target.value)}>
 *      <option value="CA">California</option>
 *    </Select>
 *  </FormGroup>
 */

import { cn } from '@/lib/utils'

export function Input({ className, error, ...props }) {
  return (
    <input
      className={cn(
        'h-8 w-full rounded border border-line bg-surface-primary text-ink-primary',
        'px-2.5 text-sm placeholder:text-ink-tertiary',
        'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light',
        'transition-colors duration-150',
        error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
        className
      )}
      {...props}
    />
  )
}

export function Textarea({ className, error, ...props }) {
  return (
    <textarea
      className={cn(
        'w-full rounded border border-line bg-surface-primary text-ink-primary',
        'px-2.5 py-2 text-sm placeholder:text-ink-tertiary',
        'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light',
        'transition-colors duration-150 resize-vertical min-h-[120px]',
        error && 'border-destructive focus:border-destructive focus:ring-destructive/20',
        className
      )}
      {...props}
    />
  )
}

export function Select({ className, error, children, ...props }) {
  return (
    <select
      className={cn(
        'h-8 w-full rounded border border-line bg-surface-primary text-ink-primary',
        'px-2.5 pr-7 text-sm appearance-none cursor-pointer',
        'focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand-light',
        'transition-colors duration-150',
        'bg-[url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'12\' viewBox=\'0 0 12 12\'%3E%3Cpath fill=\'%239B9B9B\' d=\'M6 8L1 3h10z\'/%3E%3C/svg%3E")]',
        'bg-no-repeat bg-[position:right_8px_center]',
        error && 'border-destructive',
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}

export function FormGroup({ label, error, required, hint, children, className }) {
  return (
    <div className={cn('flex flex-col gap-1', className)}>
      {label && (
        <label className="text-sm text-ink-secondary flex items-center gap-1">
          {label}
          {required && <span className="text-destructive">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-ink-tertiary">{hint}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}
