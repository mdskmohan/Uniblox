import { useState } from 'react'
import {
  X, BookOpen, LifeBuoy, Search, ChevronRight,
  FileText, HelpCircle, Zap, Shield, BarChart2, Settings,
  CheckCircle2, Clock, ExternalLink, Plus, MessageSquare
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const DOCS_SECTIONS = [
  {
    title: 'Getting Started',
    icon: Zap,
    articles: [
      { title: 'Platform Overview',                time: '5 min read' },
      { title: 'Creating Your First Submission',   time: '8 min read' },
      { title: 'Understanding Risk Scores',         time: '6 min read' },
      { title: 'Carrier Configuration Basics',     time: '10 min read' },
    ],
  },
  {
    title: 'Underwriting',
    icon: Shield,
    articles: [
      { title: 'Auto-Approve & Auto-Decline Thresholds', time: '7 min read' },
      { title: 'EOI Management Workflow',                time: '5 min read' },
      { title: 'Risk Score Sub-Scores Explained',        time: '9 min read' },
      { title: 'Referral Decision Process',              time: '4 min read' },
    ],
  },
  {
    title: 'Analytics & Reporting',
    icon: BarChart2,
    articles: [
      { title: 'Portfolio Dashboard Guide',        time: '6 min read' },
      { title: 'Model Performance Metrics',        time: '8 min read' },
      { title: 'Audit Log & Compliance Reports',   time: '5 min read' },
    ],
  },
  {
    title: 'Administration',
    icon: Settings,
    articles: [
      { title: 'Team Roles & Permissions',         time: '7 min read' },
      { title: 'SSO & SAML Configuration',         time: '12 min read' },
      { title: 'API Keys & Webhooks',              time: '10 min read' },
      { title: 'Compliance Rules Reference',       time: '15 min read' },
    ],
  },
]

const MOCK_TICKETS = [
  { id: 'TKT-0041', subject: 'CSV export includes incorrect date format', status: 'open',     created: '2024-01-14' },
  { id: 'TKT-0038', subject: 'EOI approval not triggering notification',  status: 'resolved', created: '2024-01-10' },
  { id: 'TKT-0031', subject: 'Dark mode layout issue on Safari',           status: 'resolved', created: '2023-12-28' },
]

export default function DocsSupportPanel({ open, onClose }) {
  const [tab,    setTab]    = useState('docs')
  const [search, setSearch] = useState('')
  const [ticketForm, setTicketForm] = useState({
    subject: '', category: 'general', description: '', priority: 'medium',
  })
  const [submitting, setSubmitting] = useState(false)

  const filteredSections = DOCS_SECTIONS.map((s) => ({
    ...s,
    articles: s.articles.filter((a) =>
      !search || a.title.toLowerCase().includes(search.toLowerCase())
    ),
  })).filter((s) => s.articles.length > 0)

  function handleSubmitTicket() {
    if (!ticketForm.subject.trim() || !ticketForm.description.trim()) {
      toast.error('Please fill in subject and description')
      return
    }
    setSubmitting(true)
    setTimeout(() => {
      setSubmitting(false)
      toast.success('Ticket submitted', { description: 'Our team will respond within 1 business day.' })
      setTicketForm({ subject: '', category: 'general', description: '', priority: 'medium' })
    }, 1000)
  }

  if (!open) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[1px]" onClick={onClose} />

      <div className="fixed top-0 right-0 z-50 h-screen w-[400px] flex flex-col
                      bg-surface-primary border-l border-line shadow-2xl animate-slideInRight">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded bg-brand/10 flex items-center justify-center">
              <HelpCircle size={14} className="text-brand" />
            </div>
            <span className="font-semibold text-ink-primary">Docs & Support</span>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                       hover:bg-surface-hover hover:text-ink-primary transition-colors"
          >
            <X size={15} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-line flex-shrink-0">
          {[
            { id: 'docs',    label: 'Documentation', icon: BookOpen },
            { id: 'support', label: 'Support',        icon: LifeBuoy },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={cn(
                'flex-1 flex items-center justify-center gap-1.5 px-4 py-3 text-sm font-medium transition-colors border-b-2',
                tab === id
                  ? 'text-brand border-brand'
                  : 'text-ink-secondary border-transparent hover:text-ink-primary'
              )}
            >
              <Icon size={14} /> {label}
            </button>
          ))}
        </div>

        {/* ── DOCS TAB ── */}
        {tab === 'docs' && (
          <div className="flex-1 overflow-y-auto">
            {/* Search */}
            <div className="px-4 py-3 border-b border-line sticky top-0 bg-surface-primary z-10">
              <div className="relative">
                <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
                <input
                  type="text"
                  placeholder="Search documentation..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-8 pr-3 h-8 text-sm bg-surface-secondary border border-line rounded
                             focus:outline-none focus:border-brand text-ink-primary placeholder:text-ink-tertiary"
                />
              </div>
            </div>

            <div className="p-4 space-y-5">
              {filteredSections.map(({ title, icon: Icon, articles }) => (
                <div key={title}>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon size={13} className="text-brand" />
                    <span className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider">{title}</span>
                  </div>
                  <div className="space-y-0.5">
                    {articles.map((a) => (
                      <button
                        key={a.title}
                        onClick={() => toast.info(`Opening: ${a.title}`)}
                        className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded
                                   hover:bg-surface-hover text-left group transition-colors"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <FileText size={13} className="text-ink-tertiary group-hover:text-brand flex-shrink-0 transition-colors" />
                          <span className="text-sm text-ink-primary truncate">{a.title}</span>
                        </div>
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[11px] text-ink-tertiary">{a.time}</span>
                          <ChevronRight size={12} className="text-ink-tertiary group-hover:text-brand transition-colors" />
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              {filteredSections.length === 0 && (
                <div className="text-center py-12">
                  <HelpCircle size={24} className="text-ink-tertiary mx-auto mb-2" />
                  <div className="text-sm text-ink-secondary">No articles match your search.</div>
                  <button
                    onClick={() => setTab('support')}
                    className="text-xs text-brand mt-1 hover:underline"
                  >
                    Create a support ticket instead
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── SUPPORT TAB ── */}
        {tab === 'support' && (
          <div className="flex-1 overflow-y-auto">
            <div className="p-4 space-y-4">

              {/* System status */}
              <div className="flex items-center gap-2 px-3 py-2.5 bg-positive-light rounded-lg border border-positive/20">
                <CheckCircle2 size={14} className="text-positive flex-shrink-0" />
                <div className="flex-1">
                  <div className="text-xs font-semibold text-positive-text">All systems operational</div>
                  <div className="text-[11px] text-positive-text/70">Last checked: just now</div>
                </div>
                <button
                  onClick={() => toast.info('Opening status page')}
                  className="text-[11px] text-positive-text underline flex-shrink-0 flex items-center gap-0.5"
                >
                  Status <ExternalLink size={10} />
                </button>
              </div>

              {/* Create ticket */}
              <div className="card p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Plus size={14} className="text-brand" />
                  <span className="text-sm font-semibold text-ink-primary">New Support Ticket</span>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-secondary block mb-1">Subject *</label>
                  <input
                    type="text"
                    value={ticketForm.subject}
                    onChange={(e) => setTicketForm((f) => ({ ...f, subject: e.target.value }))}
                    placeholder="Briefly describe the issue"
                    className="w-full h-8 px-3 text-sm bg-surface-secondary border border-line rounded
                               focus:outline-none focus:border-brand text-ink-primary placeholder:text-ink-tertiary"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-xs font-medium text-ink-secondary block mb-1">Category</label>
                    <select
                      value={ticketForm.category}
                      onChange={(e) => setTicketForm((f) => ({ ...f, category: e.target.value }))}
                      className="w-full h-8 px-2 text-sm bg-surface-secondary border border-line rounded
                                 focus:outline-none focus:border-brand text-ink-primary"
                    >
                      <option value="general">General</option>
                      <option value="billing">Billing</option>
                      <option value="technical">Technical Issue</option>
                      <option value="feature">Feature Request</option>
                      <option value="compliance">Compliance</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-ink-secondary block mb-1">Priority</label>
                    <select
                      value={ticketForm.priority}
                      onChange={(e) => setTicketForm((f) => ({ ...f, priority: e.target.value }))}
                      className="w-full h-8 px-2 text-sm bg-surface-secondary border border-line rounded
                                 focus:outline-none focus:border-brand text-ink-primary"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-ink-secondary block mb-1">Description *</label>
                  <textarea
                    value={ticketForm.description}
                    onChange={(e) => setTicketForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe the issue. Include steps to reproduce if applicable."
                    rows={4}
                    className="w-full px-3 py-2 text-sm bg-surface-secondary border border-line rounded
                               focus:outline-none focus:border-brand text-ink-primary placeholder:text-ink-tertiary resize-none"
                  />
                </div>

                <button
                  onClick={handleSubmitTicket}
                  disabled={submitting}
                  className="w-full h-8 bg-brand text-white text-sm font-medium rounded
                             hover:bg-brand-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? 'Submitting…' : 'Submit Ticket'}
                </button>
              </div>

              {/* Recent tickets */}
              <div>
                <div className="text-xs font-semibold text-ink-tertiary uppercase tracking-wider mb-2">
                  Recent Tickets
                </div>
                <div className="space-y-2">
                  {MOCK_TICKETS.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toast.info(`Opening ticket ${t.id}`)}
                      className="w-full text-left px-3 py-2.5 bg-surface-secondary border border-line rounded
                                 hover:border-brand hover:bg-brand-light transition-all group"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[11px] font-mono text-ink-tertiary">{t.id}</span>
                        <span className={cn(
                          'text-[10px] px-1.5 py-0.5 rounded-full font-medium',
                          t.status === 'open'
                            ? 'bg-caution-light text-caution-text'
                            : 'bg-positive-light text-positive-text'
                        )}>
                          {t.status === 'open' ? 'Open' : 'Resolved'}
                        </span>
                      </div>
                      <div className="text-sm text-ink-primary mt-0.5 group-hover:text-brand transition-colors truncate">
                        {t.subject}
                      </div>
                      <div className="text-[11px] text-ink-tertiary mt-0.5">{t.created}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Contact info */}
              <div className="card p-4 space-y-2.5">
                <div className="text-sm font-semibold text-ink-primary">Other ways to get help</div>
                {[
                  { label: 'Email',    value: 'support@uniblox.io',       icon: MessageSquare },
                  { label: 'SLA',     value: '4h critical · 1 day standard', icon: Clock },
                  { label: 'Enterprise hotline', value: '+1 (888) 555-0102', icon: HelpCircle },
                ].map(({ label, value, icon: Icon }) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <Icon size={13} className="text-ink-tertiary flex-shrink-0" />
                    <div>
                      <div className="text-[11px] text-ink-tertiary">{label}</div>
                      <div className="text-xs font-medium text-ink-primary">{value}</div>
                    </div>
                  </div>
                ))}
              </div>

            </div>
          </div>
        )}
      </div>
    </>
  )
}
