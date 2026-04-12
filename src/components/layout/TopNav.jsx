/**
 * TopNav.jsx
 *
 * Sticky top navigation bar rendered inside AppShell on every operational page.
 * Responsible for:
 *  - Sidebar collapse toggle (hamburger)
 *  - Auto-generated breadcrumbs derived from the current pathname
 *  - AI Assistant panel trigger (✦ sparkle icon)
 *  - Docs & Support panel trigger (? icon)
 *  - Theme toggle (light/dark)
 *  - Notification bell with unread badge
 *  - User avatar menu: quick profile links + Settings gateway + Sign Out
 *
 * Both the AI Assistant and Docs & Support panels are rendered as portals
 * inside this component so they always sit above the rest of the UI (z-50).
 *
 * Breadcrumb map is manually maintained here. Dynamic routes (e.g.
 * /submissions/:id) fall back to a generic label.
 */

import { useLocation, useNavigate } from 'react-router-dom'
import { useState } from 'react'
import {
  Menu, Bell, Sun, Moon, ChevronRight,
  Sparkles, HelpCircle,
  User, Settings, LogOut, Shield
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

export default function TopNav() {
  const {
    toggleSidebar, toggleTheme, theme, notifications,
    markAllNotificationsRead, currentUser, getUnreadNotificationCount,
  } = useAppStore()

  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen,  setUserOpen]  = useState(false)
  const [aiOpen,    setAiOpen]    = useState(false)
  const [docsOpen,  setDocsOpen]  = useState(false)

  const location = useLocation()
  const navigate = useNavigate()
  const unread   = getUnreadNotificationCount()

  let crumbs = BREADCRUMBS[location.pathname]
  if (!crumbs && location.pathname.startsWith('/submissions/')) {
    crumbs = ['Submissions', 'Submission Detail']
  }
  crumbs = crumbs || ['Uniblox']

  function closeAll() {
    setNotifOpen(false)
    setUserOpen(false)
  }

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
                <div className="absolute right-0 top-full mt-1 w-80 bg-surface-primary
                                border border-line rounded-md shadow-modal z-20 animate-fadeIn">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-line">
                    <span className="text-sm font-semibold text-ink-primary">Notifications</span>
                    <span className="text-xs text-ink-tertiary">{notifications.length} items</span>
                  </div>
                  <div className="max-h-80 overflow-y-auto">
                    {notifications.map((n) => (
                      <div
                        key={n.id}
                        className={cn(
                          'px-4 py-3 border-b border-line last:border-0',
                          !n.read && 'bg-brand-light'
                        )}
                      >
                        <div className="text-sm font-medium text-ink-primary">{n.title}</div>
                        <div className="text-xs text-ink-secondary mt-0.5">{n.message}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Profile avatar */}
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

                  {/* Account links */}
                  <div className="py-1">
                    {[
                      { label: 'My Profile', icon: User,    path: '/settings/profile' },
                      { label: 'Security',   icon: Shield,  path: '/settings/profile' },
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
