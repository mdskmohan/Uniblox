import { X, Megaphone, ShieldCheck, Users, Cpu, Upload, MapPin, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const UPDATES = [
  {
    id: 'w1',
    month: 'April 2026',
    tag: 'Feature',
    icon: ShieldCheck,
    iconBg: 'bg-positive/10',
    iconColor: 'text-positive',
    title: 'Editable Compliance Rules',
    date: 'Apr 13',
    isNew: true,
    body: 'Compliance officers can now toggle rules on or off, add new rules with category and regulatory reference, and delete rules that no longer apply. A warning banner surfaces automatically whenever any rule is paused.',
  },
  {
    id: 'w2',
    month: 'April 2026',
    tag: 'Feature',
    icon: Users,
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
    title: 'Custom Roles & Permissions',
    date: 'Apr 10',
    isNew: true,
    body: 'Create fully custom roles from Settings → Team & Access. Click any role to edit its permissions as grouped checkboxes across Submissions, Underwriting, Enrollment, Analytics, and Platform. Custom roles appear automatically in the invite member flow.',
  },
  {
    id: 'w3',
    month: 'April 2026',
    tag: 'Improvement',
    icon: Cpu,
    iconBg: 'bg-caution/10',
    iconColor: 'text-caution-text',
    title: 'Editable AI System Prompt',
    date: 'Apr 8',
    isNew: false,
    body: 'The base AI system prompt in Settings → AI Settings is now a live editor. Edit the prompt, save changes, or reset to the platform default. Changes take effect on the next AI underwriting call.',
  },
  {
    id: 'w4',
    month: 'April 2026',
    tag: 'Feature',
    icon: Upload,
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
    title: 'File Upload on Submissions',
    date: 'Apr 5',
    isNew: false,
    body: 'Attach PDFs, Word (.docx), and Excel (.xlsx) files directly to any submission. Files are parsed automatically and sent as context to the AI risk assessment engine.',
  },
  {
    id: 'w5',
    month: 'March 2026',
    tag: 'Improvement',
    icon: MapPin,
    iconBg: 'bg-positive/10',
    iconColor: 'text-positive',
    title: 'State Guidelines Redesigned',
    date: 'Mar 31',
    isNew: false,
    body: 'All 51 US states now appear in a single scrollable list with full names. A dot marks states with full regulatory detail. Regulatory contact links open the state insurance department website directly.',
  },
  {
    id: 'w6',
    month: 'March 2026',
    tag: 'Improvement',
    icon: Settings,
    iconBg: 'bg-brand/10',
    iconColor: 'text-brand',
    title: 'Settings Pages Overhaul',
    date: 'Mar 28',
    isNew: false,
    body: 'Profile, Preferences, Notifications, and Security are now separate sidebar-nav pages. Security includes 2FA, password change with strength meter, per-session revoke, and API token management.',
  },
]

const TAG_STYLE = {
  Feature:     'bg-brand/10 text-brand',
  Improvement: 'bg-positive/10 text-positive-text',
  Fix:         'bg-caution/10 text-caution-text',
}

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

        {/* Header */}
        <div className="flex items-center justify-between px-5 h-topnav border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2.5">
            <Megaphone size={16} className="text-brand" />
            <span className="text-sm font-semibold text-ink-primary">What's New</span>
            {newCount > 0 && (
              <span className="bg-brand text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
                {newCount} new
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                       hover:bg-surface-hover hover:text-ink-primary transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Updates */}
        <div className="flex-1 overflow-y-auto">
          {groups.map((group) => (
            <div key={group.month}>

              {/* Month label */}
              <div className="flex items-center gap-3 px-5 pt-6 pb-3">
                <span className="text-[11px] font-semibold tracking-widest uppercase text-ink-tertiary">
                  {group.month}
                </span>
                <div className="flex-1 h-px bg-line" />
              </div>

              {/* Cards */}
              <div className="px-4 space-y-3 pb-2">
                {group.items.map((u) => {
                  const Icon = u.icon
                  return (
                    <div
                      key={u.id}
                      className={cn(
                        'rounded-xl border border-line p-4 transition-colors',
                        u.isNew
                          ? 'bg-brand-light/40 hover:bg-brand-light/60'
                          : 'bg-surface-primary hover:bg-surface-hover'
                      )}
                    >
                      {/* Icon */}
                      <div className={cn(
                        'w-10 h-10 rounded-xl flex items-center justify-center mb-3',
                        u.iconBg
                      )}>
                        <Icon size={18} className={u.iconColor} />
                      </div>

                      {/* Title */}
                      <div className="text-sm font-semibold text-ink-primary mb-2 leading-snug">
                        {u.title}
                      </div>

                      {/* Meta */}
                      <div className="flex items-center gap-2 mb-3">
                        {u.isNew && (
                          <span className="text-[10px] font-bold bg-brand text-white
                                           px-2 py-0.5 rounded-full leading-none">
                            NEW
                          </span>
                        )}
                        <span className={cn(
                          'text-[10px] font-semibold px-2 py-0.5 rounded-full',
                          TAG_STYLE[u.tag]
                        )}>
                          {u.tag}
                        </span>
                        <span className="text-[11px] text-ink-tertiary ml-auto">{u.date}</span>
                      </div>

                      {/* Description */}
                      <div className="text-xs text-ink-secondary leading-relaxed">
                        {u.body}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          <div className="h-6" />
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-line bg-surface-secondary flex-shrink-0">
          <div className="flex items-center justify-between text-[11px] text-ink-tertiary">
            <span>Continuously deployed</span>
            <span>Last updated Apr 13, 2026</span>
          </div>
        </div>
      </div>
    </>
  )
}
