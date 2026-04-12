import * as SliderPrimitive from '@radix-ui/react-slider'
import { cn } from '@/lib/utils'

export function Slider({ className, ...props }) {
  return (
    <SliderPrimitive.Root
      className={cn('relative flex items-center w-full h-5 cursor-pointer', className)}
      {...props}
    >
      <SliderPrimitive.Track className="relative h-1.5 w-full grow bg-surface-tertiary rounded-full overflow-hidden">
        <SliderPrimitive.Range className="absolute h-full bg-brand rounded-full" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        className="block w-4 h-4 bg-white border-2 border-brand rounded-full shadow
                   focus:outline-none focus:ring-2 focus:ring-brand-light transition-colors"
      />
    </SliderPrimitive.Root>
  )
}
