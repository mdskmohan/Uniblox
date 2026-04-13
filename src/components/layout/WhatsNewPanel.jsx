import { X, Megaphone } from 'lucide-react'
import { cn } from '@/lib/utils'

const UPDATES = [
  {
    id: 'w1',
    tag: 'Feature',
    tagColor: 'bg-brand/10 text-brand',
    title: 'Editable Compliance Rules',
    date: 'Apr 13, 2026',
    isNew: true,
    body: `Compliance officers can now manage rules directly from Settings → Compliance Rules. Toggle any rule active or paused, add new custom rules with a category and regulatory reference, or delete rules that no longer apply. A warning banner surfaces whenever any rule is paused so nothing gets missed accidentally.`,
  },
  {
    id: 'w2',
    tag: 'Feature',
    tagColor: 'bg-brand/10 text-brand',
    title: 'Custom Roles & Permissions',
    date: 'Apr 10, 2026',
    isNew: true,
    body: `Team admins can now create fully custom roles from Settings → Team & Access → Roles tab. Click any role to see and edit its permissions as grouped checkboxes across Submissions, Underwriting, Enrollment, Analytics, and Platform actions. Changes save per role and custom roles appear automatically in the invite member flow.`,
  },
  {
    id: 'w3',
    tag: 'Improvement',
    tagColor: 'bg-positive/10 text-positive-text',
    title: 'Editable AI System Prompt',
    date: 'Apr 8, 2026',
    isNew: false,
    body: `The base AI system prompt in Settings → AI Settings is now a live editor instead of a read-only code block. Edit the prompt directly, save your changes, or reset to the platform default at any time. Changes take effect on the next AI underwriting call.`,
  },
  {
    id: 'w4',
    tag: 'Feature',
    tagColor: 'bg-brand/10 text-brand',
    title: 'File Upload on Submissions',
    date: 'Apr 5, 2026',
    isNew: false,
    body: `Underwriters can now attach supporting documents to any submission. Accepted formats: PDF, Word (.docx), and Excel (.xlsx). Files are automatically parsed — extracted text is included as context when the AI runs its risk assessment, improving accuracy on complex submissions with detailed financials or census data.`,
  },
  {
    id: 'w5',
    tag: 'Improvement',
    tagColor: 'bg-positive/10 text-positive-text',
    title: 'State Guidelines Redesigned',
    date: 'Mar 31, 2026',
    isNew: false,
    body: `State Guidelines now shows all 51 US states (including D.C.) in a single scrollable list. A blue dot marks states with full regulatory detail. Full data — guaranteed issue limits, adverse action deadlines, prohibited risk factors, community rating rules, and direct regulatory contact links — is available for CA, NY, IL, TX, FL, WA, MA, NJ, PA, and GA.`,
  },
  {
    id: 'w6',
    tag: 'Improvement',
    tagColor: 'bg-positive/10 text-positive-text',
    title: 'Settings Pages Overhaul',
    date: 'Mar 28, 2026',
    isNew: false,
    body: `Settings has been rebuilt. Profile, Preferences, Notifications, and Security are now separate pages with proper sidebar navigation. Security includes two-factor authentication, password change with strength indicator, active session management with per-session revoke, and personal API token management.`,
  },
]

export default function WhatsNewPanel({ open, onClose }) {
  if (!open) return null

  const newCount = UPDATES.filter((u) => u.isNew).length

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-screen w-[420px] flex flex-col
                      bg-surface-primary border-l border-line shadow-2xl animate-slideInRight">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-brand/10 flex items-center justify-center">
              <Megaphone size={15} className="text-brand" />
            </div>
            <div>
              <div className="text-sm font-semibold text-ink-primary">What's New</div>
              <div className="text-[11px] text-ink-tertiary">
                {newCount > 0 ? `${newCount} new update${newCount > 1 ? 's' : ''} since your last visit` : 'Latest product updates'}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                       hover:bg-surface-hover hover:text-ink-primary transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Update list */}
        <div className="flex-1 overflow-y-auto">
          {UPDATES.map((u, i) => (
            <div
              key={u.id}
              className={cn(
                'px-5 py-5 border-b border-line last:border-0',
                u.isNew && 'bg-brand-light/40'
              )}
            >
              {/* Meta row */}
              <div className="flex items-center gap-2 mb-2">
                <span className={cn('text-[10px] font-semibold px-2 py-0.5 rounded-full', u.tagColor)}>
                  {u.tag}
                </span>
                {u.isNew && (
                  <span className="text-[10px] font-bold bg-brand text-white px-1.5 py-0.5 rounded-full leading-none">
                    NEW
                  </span>
                )}
                <span className="text-[11px] text-ink-tertiary ml-auto">{u.date}</span>
              </div>

              {/* Title */}
              <div className="text-sm font-semibold text-ink-primary mb-1.5">{u.title}</div>

              {/* Body */}
              <div className="text-xs text-ink-secondary leading-relaxed">{u.body}</div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line flex-shrink-0">
          <div className="text-[11px] text-ink-tertiary text-center">
            Updates are deployed continuously · Last updated Apr 13, 2026
          </div>
        </div>
      </div>
    </>
  )
}
