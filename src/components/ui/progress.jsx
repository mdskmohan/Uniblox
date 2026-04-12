import * as ProgressPrimitive from '@radix-ui/react-progress'
import { cn } from '@/lib/utils'

export function Progress({ value = 0, className, color = 'brand', ...props }) {
  const colorMap = {
    brand:    'bg-brand',
    positive: 'bg-positive',
    caution:  'bg-caution',
    danger:   'bg-destructive',
  }
  return (
    <ProgressPrimitive.Root
      className={cn('h-1.5 w-full bg-surface-tertiary rounded-full overflow-hidden', className)}
      value={value}
      {...props}
    >
      <ProgressPrimitive.Indicator
        className={cn('h-full rounded-full transition-all duration-500', colorMap[color] ?? colorMap.brand)}
        style={{ transform: `translateX(-${100 - Math.min(100, Math.max(0, value))}%)` }}
      />
    </ProgressPrimitive.Root>
  )
}
