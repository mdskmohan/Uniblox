/**
 * switch.jsx
 *
 * Accessible toggle switch built on Radix UI Switch. Fully keyboard accessible
 * (Space to toggle) with ARIA checked state.
 *
 * Props:
 *  checked / onCheckedChange  — controlled state (Radix pattern)
 *  label       — optional text label rendered to the right
 *  description — optional smaller supporting text below the label
 *  className   — additional classes on the track element
 *
 * Usage:
 *  <Switch
 *    checked={twoFAEnabled}
 *    onCheckedChange={setTwoFAEnabled}
 *    label="Two-Factor Authentication"
 *    description="Require a code from your authenticator app at login"
 *  />
 */

import * as SwitchPrimitive from '@radix-ui/react-switch'
import { cn } from '@/lib/utils'

export function Switch({ className, label, description, ...props }) {
  return (
    <div className="flex items-center gap-3">
      <SwitchPrimitive.Root
        className={cn(
          'w-9 h-5 rounded-full border-2 border-transparent cursor-pointer',
          'bg-line-strong transition-colors duration-200',
          'data-[state=checked]:bg-brand',
          'focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2',
          className
        )}
        {...props}
      >
        <SwitchPrimitive.Thumb
          className="block w-4 h-4 rounded-full bg-white shadow transition-transform duration-200
                     data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
        />
      </SwitchPrimitive.Root>
      {(label || description) && (
        <div>
          {label && <div className="text-sm font-medium text-ink-primary">{label}</div>}
          {description && <div className="text-xs text-ink-tertiary">{description}</div>}
        </div>
      )}
    </div>
  )
}
