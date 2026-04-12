import * as TooltipPrimitive from '@radix-ui/react-tooltip'
import { cn } from '@/lib/utils'

export const TooltipProvider = TooltipPrimitive.Provider

export function Tooltip({ children, content, side = 'top', ...props }) {
  return (
    <TooltipPrimitive.Root delayDuration={300} {...props}>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={4}
          className={cn(
            'bg-surface-primary border border-line rounded px-2.5 py-1.5',
            'text-xs text-ink-primary shadow-card max-w-xs z-50',
            'animate-fadeIn'
          )}
        >
          {content}
          <TooltipPrimitive.Arrow className="fill-line" />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  )
}
