/**
 * TopNav.jsx
 *
 * Sticky top navigation bar rendered inside AppShell on every operational page.
 * Responsible for:
 *  - Sidebar collapse toggle (hamburger)
 *  - Auto-generated breadcrumbs derived from the current pathname
 *  - AI Assistant panel trigger (✦ sparkle icon)
 *  - Docs & Support panel trigger (? icon)
 *  - What's New tray (megaphone icon) — product changelog
 *  - Theme toggle (light/dark)
 *  - Notification bell with unread/mark-read support
 *  - User avatar menu: quick profile links + Settings gateway + Sign Out
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Menu, Bell, Sun, Moon, ChevronRight,
  Sparkles, HelpCircle, Megaphone,
  User, Settings, LogOut, Shield,
  CheckCheck, Circle, CheckCircle2,
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import DocsSupportPanel  from './DocsSupportPanel'
import AIAssistantPanel  from './AIAssistantPanel'

const BREADCRUMBS = {
  '/submissions':           ['Submissions'],
  '/submissions/new':       ['Submissions', 'New Submission'],
  '/submissions/pending':   ['Submissions', 'Pending Review'],
  '/submissions/archive':   ['Submissions', 'Archive'],
  '/underwriting/queue':    ['Underwriting', 'Queue'],
  '/underwriting/risk':     ['Underwriting', 'Risk Assessment'],
  '/underwriting/eoi':      ['Underwriting', 'EOI Management'],
  '/enrollment/active':     ['Enrollment', 'Active Enrollments'],
  '/enrollment/portal':     ['Enrollment', 'Employee Portal'],
  '/enrollment/census':     ['Enrollment', 'Census Upload'],
  '/analytics/portfolio':   ['Analytics', 'Portfolio Dashboard'],
  '/analytics/performance': ['Analytics', 'Model Performance'],
  '/analytics/audit':       ['Analytics', 'Audit Log'],
}

// ── What's New data ────────────────────────────────────────────────────────────
const WHATS_NEW = [
  { id: 'w1', title: 'Editable Compliance Rules',    desc: 'Toggle, add, and remove compliance rules directly from settings.',         date: 'Apr 13', isNew: true  },
  { id: 'w2', title: 'Custom Roles & Permissions',   desc: 'Create custom team roles and assign granular per-role permissions.',        date: 'Apr 10', isNew: true  },
  { id: 'w3', title: 'Editable AI System Prompt',    desc: 'Underwriting leads can now customize the base AI system prompt.',           date: 'Apr 8',  isNew: false },
  { id: 'w4', title: 'File Upload on Submissions',   desc: 'Attach PDFs, Word docs, and Excel files directly to any submission.',      date: 'Apr 5',  isNew: false },
  { id: 'w5', title: 'State Guidelines Expanded',    desc: 'Full regulatory detail available for 10 US states with clickable links.',  date: 'Mar 31', isNew: false },
  { id: 'w6', title: 'Settings Overhaul',            desc: 'Security, Preferences, and Notifications are now separate settings pages.', date: 'Mar 28', isNew: false },
]

// ── Notification type colors ───────────────────────────────────────────────────
const TYPE_DOT = {
  warning: 'bg-caution',
  info:    'bg-brand',
  success: 'bg-positive',
  error:   'bg-destructive',
}

export default function TopNav() {
  const {
    toggleSidebar, toggleTheme, theme, notifications,
    markAllNotificationsRead, markNotificationRead, currentUser,
    getUnreadNotificationCount,
  } = useAppStore()

  const [notifOpen,     setNotifOpen]     = useState(false)
  const [userOpen,      setUserOpen]      = useState(false)
  const [aiOpen,        setAiOpen]        = useState(false)
  const [docsOpen,      setDocsOpen]      = useState(false)
  const [whatsNewOpen,  setWhatsNewOpen]  = useState(false)
  const [notifFilter,   setNotifFilter]   = useState('all')   // 'all' | 'unread'
  const [seenUpdates,   setSeenUpdates]   = useState(new Set())

  const location = useLocation()
  const navigate = useNavigate()
  const unread   = getUnreadNotificationCount()
  const newUpdates = WHATS_NEW.filter((u) => u.isNew && !seenUpdates.has(u.id)).length

  let crumbs = BREADCRUMBS[location.pathname]
  if (!crumbs && location.pathname.startsWith('/submissions/')) {
    crumbs = ['Submissions', 'Submission Detail']
  }
  crumbs = crumbs || ['Uniblox']

  function closeAll() {
    setNotifOpen(false)
    setUserOpen(false)
    setWhatsNewOpen(false)
  }

  function openWhatsNew() {
    setWhatsNewOpen((o) => !o)
    closeAll()
    // mark all as seen when opened
    setSeenUpdates(new Set(WHATS_NEW.map((u) => u.id)))
    setWhatsNewOpen(true)
  }

  const visibleNotifs = notifFilter === 'unread'
    ? notifications.filter((n) => !n.read)
    : notifications

  return (
    <>
      <header className="h-topnav min-h-topnav flex items-center px-5 gap-3
                         bg-surface-primary border-b border-line sticky top-0 z-40">

        {/* Left — hamburger + breadcrumb */}
        <div className="flex items-center gap-2 flex-1 min-w-0">
          <button
            onClick={toggleSidebar}
            className="w-8 h-8 flex items-center justify-center rounded text-ink-secondary
                       hover:bg-surface-hover hover:text-ink-primary transition-colors"
          >
            <Menu size={16} />
          </button>

          <nav className="flex items-center gap-1.5 text-sm text-ink-secondary min-w-0">
            {crumbs.map((crumb, i) => (
              <span key={i} className="flex items-center gap-1.5 min-w-0">
                {i > 0 && <ChevronRight size={12} className="text-ink-tertiary flex-shrink-0" />}
                <span className={cn(
                  'truncate',
                  i === crumbs.length - 1 ? 'text-ink-primary font-medium' : 'text-ink-secondary'
                )}>
                  {crumb}
                </span>
              </span>
            ))}
          </nav>
        </div>

        {/* Right — action icons */}
        <div className="flex items-center gap-0.5">

          {/* AI Assistant */}
          <button
            onClick={() => { setAiOpen((o) => !o); closeAll() }}
            title="AI Assistant"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded transition-colors',
              aiOpen
                ? 'bg-brand text-white'
                : 'text-ink-secondary hover:bg-surface-hover hover:text-brand'
            )}
          >
            <Sparkles size={16} />
          </button>

          {/* Docs & Support */}
          <button
            onClick={() => { setDocsOpen((o) => !o); closeAll() }}
            title="Docs & Support"
            className={cn(
              'w-8 h-8 flex items-center justify-center rounded transition-colors',
              docsOpen
                ? 'bg-brand-light text-brand'
                : 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
            )}
          >
            <HelpCircle size={16} />
          </button>

          {/* What's New */}
          <div className="relative">
            <button
              onClick={openWhatsNew}
              title="What's New"
              className={cn(
                'w-8 h-8 flex items-center justify-center rounded transition-colors relative',
                whatsNewOpen
                  ? 'bg-brand-light text-brand'
                  : 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
              )}
            >
              <Megaphone size={16} />
              {newUpdates > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-brand rounded-full
                                 border-2 border-surface-primary" />
              )}
            </button>

            {whatsNewOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setWhatsNewOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-80 bg-surface-primary
                                border border-line rounded-md shadow-modal z-20 animate-fadeIn">
                  <div className="px-4 py-3 border-b border-line">
                    <div className="font-semibold text-sm text-ink-primary">What's New</div>
                    <div className="text-xs text-ink-tertiary mt-0.5">Latest product updates</div>
                  </div>
                  <div className="max-h-96 overflow-y-auto divide-y divide-line">
                    {WHATS_NEW.map((u) => (
                      <div key={u.id} className="px-4 py-3 hover:bg-surface-hover transition-colors">
                        <div className="flex items-start justify-between gap-2 mb-0.5">
                          <span className="text-sm font-medium text-ink-primary">{u.title}</span>
                          {u.isNew && (
                            <span className="flex-shrink-0 text-[10px] font-semibold bg-brand text-white
                                             px-1.5 py-0.5 rounded-full leading-none">NEW</span>
                          )}
                        </div>
                        <div className="text-xs text-ink-secondary">{u.desc}</div>
                        <div className="text-[10px] text-ink-tertiary mt-1">{u.date}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Theme */}
          <button
            onClick={toggleTheme}
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
            className="w-8 h-8 flex items-center justify-center rounded text-ink-secondary
                       hover:bg-surface-hover hover:text-ink-primary transition-colors"
          >
            {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
          </button>

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => { setNotifOpen((o) => !o); setUserOpen(false); setWhatsNewOpen(false) }}
              title="Notifications"
              className="w-8 h-8 flex items-center justify-center rounded text-ink-secondary
                         hover:bg-surface-hover hover:text-ink-primary transition-colors relative"
            >
              <Bell size={16} />
              {unread > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full
                                 border-2 border-surface-primary" />
              )}
            </button>

            {notifOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setNotifOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-84 bg-surface-primary
                                border border-line rounded-md shadow-modal z-20 animate-fadeIn"
                     style={{ width: '340px' }}>

                  {/* Header */}
                  <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                    <span className="text-sm font-semibold text-ink-primary">Notifications</span>
                    {unread > 0 && (
                      <button
                        onClick={markAllNotificationsRead}
                        className="flex items-center gap-1 text-xs text-brand hover:underline"
                      >
                        <CheckCheck size={12} /> Mark all as read
                      </button>
                    )}
                  </div>

                  {/* Filter tabs */}
                  <div className="flex border-b border-line">
                    {[['all','All'], ['unread','Unread']].map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setNotifFilter(val)}
                        className={cn(
                          'flex-1 py-2 text-xs font-medium border-b-2 transition-colors',
                          notifFilter === val
                            ? 'text-brand border-brand'
                            : 'text-ink-secondary border-transparent hover:text-ink-primary'
                        )}
                      >
                        {label}
                        {val === 'unread' && unread > 0 && (
                          <span className="ml-1 bg-brand text-white text-[9px] rounded-full
                                           px-1.5 py-0.5 font-semibold">
                            {unread}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  {/* List */}
                  <div className="max-h-80 overflow-y-auto">
                    {visibleNotifs.length === 0 ? (
                      <div className="px-4 py-8 text-center text-sm text-ink-tertiary">
                        {notifFilter === 'unread' ? 'All caught up!' : 'No notifications'}
                      </div>
                    ) : (
                      visibleNotifs.map((n) => (
                        <div
                          key={n.id}
                          onClick={() => markNotificationRead(n.id)}
                          className={cn(
                            'px-4 py-3 border-b border-line last:border-0 cursor-pointer',
                            'hover:bg-surface-hover transition-colors flex items-start gap-3',
                            !n.read && 'bg-brand-light hover:bg-brand-light/80'
                          )}
                        >
                          <span className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
                            TYPE_DOT[n.type] || 'bg-ink-tertiary',
                            n.read && 'opacity-30'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className={cn(
                              'text-sm text-ink-primary',
                              !n.read && 'font-medium'
                            )}>
                              {n.title}
                            </div>
                            <div className="text-xs text-ink-secondary mt-0.5 leading-relaxed">
                              {n.message}
                            </div>
                          </div>
                          {!n.read && (
                            <Circle size={6} className="text-brand fill-brand flex-shrink-0 mt-2" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile avatar */}
          <div className="relative ml-0.5">
            <button
              onClick={() => { setUserOpen((o) => !o); setNotifOpen(false); setWhatsNewOpen(false) }}
              className="w-8 h-8 rounded-full bg-brand flex items-center justify-center
                         text-white text-xs font-semibold hover:opacity-90 transition-opacity"
            >
              {currentUser.initials}
            </button>

            {userOpen && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setUserOpen(false)} />
                <div className="absolute right-0 top-full mt-1 w-56 bg-surface-primary
                                border border-line rounded-md shadow-modal z-20 py-1 animate-fadeIn">

                  {/* Identity */}
                  <div className="px-3 py-3 border-b border-line">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-full bg-brand flex items-center justify-center
                                      text-white text-xs font-semibold flex-shrink-0">
                        {currentUser.initials}
                      </div>
                      <div className="min-w-0">
                        <div className="text-sm font-semibold text-ink-primary truncate">{currentUser.name}</div>
                        <div className="text-xs text-ink-tertiary truncate">{currentUser.email}</div>
                        <div className="text-[10px] text-brand font-medium mt-0.5">{currentUser.role}</div>
                      </div>
                    </div>
                  </div>

                  {/* Account links */}
                  <div className="py-1">
                    {[
                      { label: 'My Profile', icon: User,   path: '/settings/profile' },
                      { label: 'Security',   icon: Shield, path: '/settings/security' },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => { navigate(item.path); setUserOpen(false) }}
                        className="w-full text-left px-3 py-2 text-sm text-ink-primary
                                   hover:bg-surface-hover transition-colors flex items-center gap-2.5"
                      >
                        <item.icon size={14} className="text-ink-tertiary flex-shrink-0" />
                        {item.label}
                      </button>
                    ))}
                  </div>

                  {/* Settings */}
                  <div className="border-t border-line py-1">
                    <button
                      onClick={() => { navigate('/settings'); setUserOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-ink-primary
                                 hover:bg-surface-hover transition-colors flex items-center gap-2.5"
                    >
                      <Settings size={14} className="text-ink-tertiary flex-shrink-0" />
                      Settings
                    </button>
                  </div>

                  {/* Sign out */}
                  <div className="border-t border-line pt-1">
                    <button
                      onClick={() => { navigate('/'); setUserOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-destructive
                                 hover:bg-surface-hover transition-colors flex items-center gap-2.5"
                    >
                      <LogOut size={14} className="flex-shrink-0" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </header>

      <AIAssistantPanel  open={aiOpen}   onClose={() => setAiOpen(false)} />
      <DocsSupportPanel  open={docsOpen} onClose={() => setDocsOpen(false)} />
    </>
  )
}
