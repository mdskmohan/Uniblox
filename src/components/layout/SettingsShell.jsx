/**
 * SettingsShell.jsx
 *
 * Dedicated layout for all /settings/* routes. Intentionally replaces the main
 * AppShell so that settings feel like a distinct area — consistent with the
 * pattern used by Stripe, Linear, and GitHub.
 *
 * Structure:
 *  - Fixed left sidebar (240 px) with logo, back button, and grouped settings nav
 *  - Scrollable content area rendering the matched child route via <Outlet />
 *  - Its own <Toaster /> instance so toast notifications work inside settings
 *
 * Navigation groups:
 *  Account    — personal profile, preferences, notifications, security
 *  Organization — team/RBAC, billing
 *  Platform   — carrier config, AI settings, compliance rules, state guidelines
 *
 * Hash items (e.g. /settings/profile#security) navigate to the Profile page
 * and scroll to the relevant tab. They are rendered as <button> instead of
 * <NavLink> because React Router doesn't track hash as an active route.
 */

import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import {
  ArrowLeft, User, Bell, Shield, Globe,
  Settings, Cpu, ShieldCheck, MapPin, Users,
  CreditCard, Building2
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'

const NAV = [
  {
    section: 'Account',
    items: [
      { to: '/settings/profile',             label: 'My Profile',           icon: User },
      { to: '/settings/profile#preferences', label: 'Preferences',          icon: Globe,      hash: true },
      { to: '/settings/profile#notifications',label: 'Notifications',       icon: Bell,       hash: true },
      { to: '/settings/profile#security',    label: 'Security',             icon: Shield,     hash: true },
    ],
  },
  {
    section: 'Organization',
    items: [
      { to: '/settings/team',    label: 'Team & Access',  icon: Users },
      { to: '/settings/billing', label: 'Billing & Plan', icon: CreditCard },
    ],
  },
  {
    section: 'Platform',
    items: [
      { to: '/settings/carrier',    label: 'Carrier Configuration', icon: Settings },
      { to: '/settings/ai',         label: 'AI Model Settings',     icon: Cpu },
      { to: '/settings/compliance', label: 'Compliance Rules',      icon: ShieldCheck },
      { to: '/settings/states',     label: 'State Guidelines',      icon: MapPin },
    ],
  },
]

export default function SettingsShell() {
  const navigate    = useNavigate()
  const { currentUser } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">

      {/* Settings sidebar */}
      <aside className="fixed left-0 top-0 z-50 flex flex-col h-screen w-60
                        bg-surface-secondary border-r border-line overflow-y-auto flex-shrink-0">

        {/* Logo + Uniblox text (matches main Sidebar height) */}
        <div className="flex items-center gap-2.5 px-4 h-topnav border-b border-line flex-shrink-0">
          <img src={logo} alt="Uniblox" className="h-7 w-auto object-contain flex-shrink-0" />
          <span className="text-sm font-semibold text-ink-primary tracking-tight">Uniblox</span>
        </div>

        {/* Back button */}
        <div className="px-4 py-3 border-b border-line flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary
                       transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform flex-shrink-0" />
            <span>Back</span>
          </button>
        </div>

        {/* Settings label */}
        <div className="px-4 py-3 border-b border-line flex-shrink-0">
          <div className="flex items-center gap-2">
            <Settings size={13} className="text-brand flex-shrink-0" />
            <span className="text-sm font-semibold text-ink-primary">Settings</span>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3">
          {NAV.map(({ section, items }) => (
            <div key={section} className="mb-3">
              <div className="px-4 py-1 text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                {section}
              </div>
              {items.map(({ to, label, icon: Icon, hash }) => (
                hash
                  ? (
                    <button
                      key={to}
                      onClick={() => navigate(to)}
                      className="w-full flex items-center gap-2.5 px-4 h-8 text-sm font-normal
                                 text-ink-secondary hover:text-ink-primary hover:bg-surface-hover
                                 transition-colors"
                    >
                      <Icon size={14} className="flex-shrink-0 text-ink-tertiary" />
                      {label}
                    </button>
                  )
                  : (
                    <NavLink
                      key={to}
                      to={to}
                      className={({ isActive }) => cn(
                        'flex items-center gap-2.5 px-4 h-8 text-sm font-normal transition-colors',
                        'border-l-2',
                        isActive
                          ? 'text-brand bg-brand-light border-brand font-medium'
                          : 'text-ink-secondary border-transparent hover:text-ink-primary hover:bg-surface-hover'
                      )}
                    >
                      <Icon size={14} className="flex-shrink-0" />
                      {label}
                    </NavLink>
                  )
              ))}
            </div>
          ))}
        </nav>

        {/* User info at bottom */}
        <div className="border-t border-line p-3 flex items-center gap-2.5 flex-shrink-0">
          <div className="w-8 h-8 rounded-full bg-brand flex items-center justify-center
                          text-white text-xs font-semibold flex-shrink-0">
            {currentUser.initials}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-medium text-ink-primary truncate">{currentUser.name}</div>
            <div className="text-[10px] text-ink-tertiary truncate">{currentUser.role}</div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex flex-col flex-1 min-w-0" style={{ marginLeft: '240px' }}>
        <main className="flex-1 overflow-y-auto p-8">
          <Outlet />
        </main>
      </div>

      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: 'var(--bg-primary)',
            border: '1px solid var(--border)',
            color: 'var(--text-primary)',
          },
        }}
      />
    </div>
  )
}
