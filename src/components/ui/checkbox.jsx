import * as CheckboxPrimitive from '@radix-ui/react-checkbox'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

export function Checkbox({ className, label, ...props }) {
  return (
    <label className="flex items-center gap-2 cursor-pointer select-none">
      <CheckboxPrimitive.Root
        className={cn(
          'w-4 h-4 rounded-sm border border-line-strong flex items-center justify-center',
          'transition-colors duration-150',
          'data-[state=checked]:bg-brand data-[state=checked]:border-brand',
          'focus-visible:outline-2 focus-visible:outline-brand focus-visible:outline-offset-2',
          className
        )}
        {...props}
      >
        <CheckboxPrimitive.Indicator>
          <Check size={11} className="text-white stroke-[3]" />
        </CheckboxPrimitive.Indicator>
      </CheckboxPrimitive.Root>
      {label && (
        <span className="text-sm text-ink-primary">{label}</span>
      )}
    </label>
  )
}
