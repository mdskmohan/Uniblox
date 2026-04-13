/**
 * TopNav.jsx
 *
 * Sticky top navigation bar rendered inside AppShell on every operational page.
 *
 * Right-side icons (intentionally minimal):
 *   AI Assistant ✦ | What's New 📣 | Theme 🌙 | Notifications 🔔 | Avatar
 *
 * Docs & Support moved into the avatar dropdown menu.
 * Security shortcut removed from avatar menu (reachable via Settings).
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Menu, Bell, Sun, Moon, ChevronRight,
  Sparkles, Megaphone, HelpCircle,
  User, Settings, LogOut,
  CheckCheck, Circle,
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import DocsSupportPanel  from './DocsSupportPanel'
import AIAssistantPanel  from './AIAssistantPanel'
import WhatsNewPanel     from './WhatsNewPanel'

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

const TYPE_DOT = {
  warning: 'bg-caution',
  info:    'bg-brand',
  success: 'bg-positive',
  error:   'bg-destructive',
}

// How many What's New items are "new"
const WHATS_NEW_COUNT = 2

export default function TopNav() {
  const {
    toggleSidebar, toggleTheme, theme, notifications,
    markAllNotificationsRead, markNotificationRead, currentUser,
    getUnreadNotificationCount,
  } = useAppStore()

  const [notifOpen,    setNotifOpen]    = useState(false)
  const [userOpen,     setUserOpen]     = useState(false)
  const [aiOpen,       setAiOpen]       = useState(false)
  const [docsOpen,     setDocsOpen]     = useState(false)
  const [whatsNewOpen, setWhatsNewOpen] = useState(false)
  const [notifFilter,  setNotifFilter]  = useState('all')
  const [newsSeen,     setNewsSeen]     = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const unread   = getUnreadNotificationCount()
  const showNewsDot = WHATS_NEW_COUNT > 0 && !newsSeen

  let crumbs = BREADCRUMBS[location.pathname]
  if (!crumbs && location.pathname.startsWith('/submissions/')) {
    crumbs = ['Submissions', 'Submission Detail']
  }
  crumbs = crumbs || ['Uniblox']

  function closeDropdowns() {
    setNotifOpen(false)
    setUserOpen(false)
  }

  function openWhatsNew() {
    setWhatsNewOpen(true)
    setNewsSeen(true)
    closeDropdowns()
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

        {/* Right — 5 icons only */}
        <div className="flex items-center gap-0.5">

          {/* AI Assistant */}
          <button
            onClick={() => { setAiOpen((o) => !o); closeDropdowns() }}
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

          {/* What's New */}
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
            {showNewsDot && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand rounded-full
                               border-2 border-surface-primary" />
            )}
          </button>

          {/* Theme toggle */}
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
              onClick={() => { setNotifOpen((o) => !o); setUserOpen(false) }}
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
                <div className="absolute right-0 top-full mt-1 bg-surface-primary
                                border border-line rounded-md shadow-modal z-20 animate-fadeIn"
                     style={{ width: '340px' }}>

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
                                           px-1.5 py-0.5 font-semibold">{unread}</span>
                        )}
                      </button>
                    ))}
                  </div>

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
                            !n.read && 'bg-brand-light'
                          )}
                        >
                          <span className={cn(
                            'w-2 h-2 rounded-full flex-shrink-0 mt-1.5',
                            TYPE_DOT[n.type] || 'bg-ink-tertiary',
                            n.read && 'opacity-30'
                          )} />
                          <div className="flex-1 min-w-0">
                            <div className={cn('text-sm text-ink-primary', !n.read && 'font-medium')}>
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

          {/* User avatar */}
          <div className="relative ml-0.5">
            <button
              onClick={() => { setUserOpen((o) => !o); setNotifOpen(false) }}
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

                  <div className="py-1">
                    <button
                      onClick={() => { navigate('/settings/profile'); setUserOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-ink-primary
                                 hover:bg-surface-hover transition-colors flex items-center gap-2.5"
                    >
                      <User size={14} className="text-ink-tertiary flex-shrink-0" />
                      My Profile
                    </button>
                  </div>

                  <div className="border-t border-line py-1">
                    <button
                      onClick={() => { navigate('/settings'); setUserOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-ink-primary
                                 hover:bg-surface-hover transition-colors flex items-center gap-2.5"
                    >
                      <Settings size={14} className="text-ink-tertiary flex-shrink-0" />
                      Settings
                    </button>
                    <button
                      onClick={() => { setDocsOpen(true); setUserOpen(false) }}
                      className="w-full text-left px-3 py-2 text-sm text-ink-primary
                                 hover:bg-surface-hover transition-colors flex items-center gap-2.5"
                    >
                      <HelpCircle size={14} className="text-ink-tertiary flex-shrink-0" />
                      Docs & Support
                    </button>
                  </div>

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

      <AIAssistantPanel open={aiOpen}       onClose={() => setAiOpen(false)} />
      <DocsSupportPanel open={docsOpen}     onClose={() => setDocsOpen(false)} />
      <WhatsNewPanel    open={whatsNewOpen} onClose={() => setWhatsNewOpen(false)} />
    </>
  )
}
