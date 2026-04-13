import { X, Megaphone, ShieldCheck, Users, Cpu, Upload, MapPin, Settings, Zap, TrendingUp, Wrench } from 'lucide-react'
import { cn } from '@/lib/utils'

const UPDATES = [
  {
    id: 'w1',
    month: 'April 2026',
    tag: 'Feature',
    icon: ShieldCheck,
    iconBg: 'bg-positive/10',
    iconColor: 'text-positive',
    accentColor: 'border-l-positive',
    tagClass: 'bg-positive/10 text-positive-text',
    title: 'Editable Compliance Rules',
    date: 'Apr 13',
    isNew: true,
    body: `Compliance officers can now manage rules directly from Settings → Compliance Rules. Toggle any rule active or paused, add new custom rules with a category and regulatory reference, or delete rules that no longer apply. A warning banner surfaces whenever any rule is paused.`,
  },
  {
    id: 'w2',
    month: 'April 2026',
    tag: 'Feature',
    icon: Users,
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
    accentColor: 'border-l-brand',
    tagClass: 'bg-brand/10 text-brand',
    title: 'Custom Roles & Permissions',
    date: 'Apr 10',
    isNew: true,
    body: `Team admins can create fully custom roles from Settings → Team & Access → Roles. Click any role to view and edit its permissions as grouped checkboxes across Submissions, Underwriting, Enrollment, Analytics, and Platform. Custom roles appear automatically in the invite member flow.`,
  },
  {
    id: 'w3',
    month: 'April 2026',
    tag: 'Improvement',
    icon: Cpu,
    iconBg: 'bg-caution/10',
    iconColor: 'text-caution-text',
    accentColor: 'border-l-caution',
    tagClass: 'bg-caution/10 text-caution-text',
    title: 'Editable AI System Prompt',
    date: 'Apr 8',
    isNew: false,
    body: `The base AI system prompt in Settings → AI Settings is now a live editor instead of a read-only block. Edit the prompt, save changes, or reset to the platform default. Changes take effect on the next AI underwriting call.`,
  },
  {
    id: 'w4',
    month: 'April 2026',
    tag: 'Feature',
    icon: Upload,
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
    accentColor: 'border-l-brand',
    tagClass: 'bg-brand/10 text-brand',
    title: 'File Upload on Submissions',
    date: 'Apr 5',
    isNew: false,
    body: `Attach supporting documents directly to any submission — PDF, Word (.docx), and Excel (.xlsx). Files are parsed automatically and the extracted text is sent as context to the AI risk assessment engine, improving accuracy on complex submissions.`,
  },
  {
    id: 'w5',
    month: 'March 2026',
    tag: 'Improvement',
    icon: MapPin,
    iconBg: 'bg-positive/10',
    iconColor: 'text-positive',
    accentColor: 'border-l-positive',
    tagClass: 'bg-positive/10 text-positive-text',
    title: 'State Guidelines Redesigned',
    date: 'Mar 31',
    isNew: false,
    body: `All 51 US states (including D.C.) now appear in a single scrollable list. A blue dot marks states with full regulatory detail. Regulatory contact links are now clickable and open the state insurance department website directly.`,
  },
  {
    id: 'w6',
    month: 'March 2026',
    tag: 'Improvement',
    icon: Settings,
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
    accentColor: 'border-l-brand',
    tagClass: 'bg-brand/10 text-brand',
    title: 'Settings Pages Overhaul',
    date: 'Mar 28',
    isNew: false,
    body: `Settings rebuilt from the ground up. Profile, Preferences, Notifications, and Security are now separate sidebar nav pages. Security includes 2FA setup, password change with strength meter, per-session revoke, and personal API token management.`,
  },
]

const TAG_ICONS = { Feature: Zap, Improvement: TrendingUp, Fix: Wrench }

// Group updates by month
function groupByMonth(updates) {
  const groups = []
  let current = null
  for (const u of updates) {
    if (!current || current.month !== u.month) {
      current = { month: u.month, items: [] }
      groups.push(current)
    }
    current.items.push(u)
  }
  return groups
}

export default function WhatsNewPanel({ open, onClose }) {
  if (!open) return null

  const newCount = UPDATES.filter((u) => u.isNew).length
  const groups   = groupByMonth(UPDATES)

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-screen w-[440px] flex flex-col
                      bg-surface-primary border-l border-line shadow-2xl animate-slideInRight">

        {/* ── Header ── */}
        <div className="relative flex-shrink-0 overflow-hidden">
          {/* Gradient wash */}
          <div className="absolute inset-0 bg-gradient-to-br from-brand/8 via-brand/3 to-transparent pointer-events-none" />

          <div className="relative flex items-start justify-between px-5 pt-5 pb-4">
            <div className="flex items-center gap-3">
              {/* Icon with glow ring */}
              <div className="relative">
                <div className="w-10 h-10 rounded-xl bg-brand flex items-center justify-center shadow-md">
                  <Megaphone size={18} className="text-white" />
                </div>
                {newCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-white
                                   text-[9px] font-bold rounded-full flex items-center justify-center
                                   border-2 border-surface-primary">
                    {newCount}
                  </span>
                )}
              </div>

              <div>
                <div className="text-base font-semibold text-ink-primary leading-tight">What's New</div>
                <div className="text-xs text-ink-secondary mt-0.5">
                  {newCount > 0
                    ? <><span className="text-brand font-medium">{newCount} new update{newCount > 1 ? 's' : ''}</span> since your last visit</>
                    : 'Latest product updates & improvements'}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                         hover:bg-surface-hover hover:text-ink-primary transition-colors mt-0.5 flex-shrink-0"
            >
              <X size={15} />
            </button>
          </div>

          {/* Bottom border */}
          <div className="h-px bg-line mx-5" />
        </div>

        {/* ── Updates ── */}
        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.month}>

              {/* Month divider */}
              <div className="flex items-center gap-3 px-5 pt-5 pb-3">
                <span className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-widest flex-shrink-0">
                  {group.month}
                </span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Entries */}
              <div className="space-y-1 px-3 pb-2">
                {group.items.map((u) => {
                  const Icon    = u.icon
                  const TagIcon = TAG_ICONS[u.tag] || Zap
                  return (
                    <div
                      key={u.id}
                      className={cn(
                        'relative rounded-xl border transition-all duration-150',
                        'border-l-[3px] px-4 pt-3.5 pb-4',
                        u.accentColor,
                        u.isNew
                          ? 'bg-brand-light/50 border-t border-r border-b border-brand/15 hover:bg-brand-light/70'
                          : 'bg-surface-primary border-t border-r border-b border-line hover:bg-surface-hover'
                      )}
                    >
                      {/* NEW pulse dot */}
                      {u.isNew && (
                        <span className="absolute top-3.5 right-3.5 flex items-center justify-center">
                          <span className="animate-ping absolute w-2 h-2 rounded-full bg-brand opacity-60" />
                          <span className="relative w-2 h-2 rounded-full bg-brand" />
                        </span>
                      )}

                      {/* Top row: icon + title */}
                      <div className="flex items-start gap-3 mb-2.5">
                        <div className={cn(
                          'w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0',
                          u.iconBg
                        )}>
                          <Icon size={16} className={u.iconColor} />
                        </div>
                        <div className="flex-1 min-w-0 pt-0.5">
                          <div className="text-sm font-semibold text-ink-primary leading-snug pr-5">
                            {u.title}
                          </div>
                        </div>
                      </div>

                      {/* Meta: tag + date */}
                      <div className="flex items-center gap-2 mb-2.5 pl-12">
                        <span className={cn(
                          'inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full',
                          u.tagClass
                        )}>
                          <TagIcon size={9} />
                          {u.tag}
                        </span>
                        {u.isNew && (
                          <span className="text-[10px] font-bold bg-brand text-white px-1.5 py-0.5
                                           rounded-full leading-none tracking-wide">
                            NEW
                          </span>
                        )}
                        <span className="text-[11px] text-ink-tertiary ml-auto">{u.date}</span>
                      </div>

                      {/* Body */}
                      <div className="text-xs text-ink-secondary leading-relaxed pl-12">
                        {u.body}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Bottom spacer */}
          <div className="h-4" />
        </div>

        {/* ── Footer ── */}
        <div className="px-5 py-3 border-t border-line bg-surface-secondary flex-shrink-0">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-ink-tertiary">Continuously deployed</span>
            <span className="text-[11px] text-ink-tertiary">Last updated Apr 13, 2026</span>
          </div>
        </div>
      </div>
    </>
  )
}
