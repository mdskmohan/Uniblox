/**
 * tabs.jsx
 *
 * Accessible tabbed interface built on Radix UI Tabs. Keyboard navigation
 * (arrow keys, Home/End) and ARIA roles are handled automatically.
 *
 * Usage:
 *  <Tabs defaultValue="overview">
 *    <TabsList>
 *      <TabsTrigger value="overview">Overview</TabsTrigger>
 *      <TabsTrigger value="assessment">Assessment</TabsTrigger>
 *    </TabsList>
 *    <TabsContent value="overview">...</TabsContent>
 *    <TabsContent value="assessment">...</TabsContent>
 *  </Tabs>
 */

import * as TabsPrimitive from '@radix-ui/react-tabs'
import { cn } from '@/lib/utils'

export const Tabs      = TabsPrimitive.Root
export const TabsContent = TabsPrimitive.Content

export function TabsList({ className, children, ...props }) {
  return (
    <TabsPrimitive.List
      className={cn('flex border-b border-line mb-5', className)}
      {...props}
    >
      {children}
    </TabsPrimitive.List>
  )
}

export function TabsTrigger({ className, children, ...props }) {
  return (
    <TabsPrimitive.Trigger
      className={cn(
        'px-4 py-2.5 text-sm text-ink-secondary cursor-pointer',
        'border-b-2 border-transparent -mb-px transition-all duration-150',
        'hover:text-ink-primary',
        'data-[state=active]:text-brand data-[state=active]:border-brand data-[state=active]:font-medium',
        className
      )}
      {...props}
    >
      {children}
    </TabsPrimitive.Trigger>
  )
}
