import { cn } from '@/lib/utils'

export function Separator({ className, orientation = 'horizontal', ...props }) {
  return (
    <div
      className={cn(
        'bg-line flex-shrink-0',
        orientation === 'horizontal' ? 'h-px w-full my-4' : 'w-px h-full mx-4',
        className
      )}
      {...props}
    />
  )
}
