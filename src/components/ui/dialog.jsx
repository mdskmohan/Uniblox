/**
 * dialog.jsx
 *
 * Accessible modal dialog built on Radix UI Dialog primitive.
 * Handles focus trapping, scroll locking, and ARIA roles automatically.
 *
 * Usage:
 *  <Dialog open={open} onOpenChange={setOpen}>
 *    <DialogContent>
 *      <DialogHeader>
 *        <DialogTitle>Override Decision</DialogTitle>
 *        <DialogCloseButton onClose={() => setOpen(false)} />
 *      </DialogHeader>
 *      <DialogBody>...form content...</DialogBody>
 *      <DialogFooter>
 *        <Button variant="secondary" onClick={() => setOpen(false)}>Cancel</Button>
 *        <Button onClick={handleConfirm}>Confirm</Button>
 *      </DialogFooter>
 *    </DialogContent>
 *  </Dialog>
 *
 * Props for DialogContent:
 *  wide — boolean; sets max-width to 720px (default: 480px)
 */

import * as DialogPrimitive from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const Dialog        = DialogPrimitive.Root
export const DialogTrigger = DialogPrimitive.Trigger
export const DialogClose   = DialogPrimitive.Close

export function DialogContent({ children, className, wide = false, ...props }) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay
        className="fixed inset-0 bg-black/40 z-[100] animate-fadeIn"
      />
      <DialogPrimitive.Content
        className={cn(
          'fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-[101]',
          'bg-surface-primary border border-line rounded-lg shadow-modal',
          'max-h-[90vh] overflow-y-auto w-full',
          'animate-slideUp',
          wide ? 'max-w-[800px]' : 'max-w-[560px]',
          className
        )}
        {...props}
      >
        {children}
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  )
}

export function DialogHeader({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-between px-6 py-4 border-b border-line',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogTitle({ className, children, ...props }) {
  return (
    <DialogPrimitive.Title
      className={cn('text-lg font-semibold text-ink-primary', className)}
      {...props}
    >
      {children}
    </DialogPrimitive.Title>
  )
}

export function DialogBody({ className, children, ...props }) {
  return (
    <div className={cn('px-6 py-5', className)} {...props}>
      {children}
    </div>
  )
}

export function DialogFooter({ className, children, ...props }) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 px-6 py-4 border-t border-line',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}

export function DialogCloseButton() {
  return (
    <DialogPrimitive.Close
      className="w-7 h-7 rounded flex items-center justify-center
                 text-ink-tertiary hover:bg-surface-hover hover:text-ink-primary
                 transition-colors"
    >
      <X size={16} />
    </DialogPrimitive.Close>
  )
}
