import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom'
import { Toaster } from 'sonner'
import {
  ArrowLeft, User, Globe, Bell, Shield, Cpu, ShieldCheck, MapPin, Users,
  CreditCard, Building2
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'

const NAV = [
  {
    section: 'Account',
    items: [
      { to: '/settings/profile',       label: 'Profile',       icon: User },
      { to: '/settings/preferences',   label: 'Preferences',   icon: Globe },
      { to: '/settings/notifications', label: 'Notifications', icon: Bell },
      { to: '/settings/security',      label: 'Security',      icon: Shield },
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
      { to: '/settings/carrier',    label: 'Carrier Config',   icon: Building2 },
      { to: '/settings/ai',         label: 'AI Settings',      icon: Cpu },
      { to: '/settings/compliance', label: 'Compliance Rules', icon: ShieldCheck },
      { to: '/settings/states',     label: 'State Guidelines', icon: MapPin },
    ],
  },
]

export default function SettingsShell() {
  const navigate        = useNavigate()
  const { currentUser } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">

      {/* Settings sidebar */}
      <aside className="fixed left-0 top-0 z-50 flex flex-col h-screen w-60
                        bg-surface-secondary border-r border-line overflow-y-auto flex-shrink-0">

        {/* Logo + wordmark — links back to home */}
        <Link to="/"
          className="flex items-center gap-2.5 px-4 h-topnav border-b border-line flex-shrink-0
                     hover:opacity-80 transition-opacity">
          <img src={logo} alt="Uniblox" className="h-7 w-auto object-contain flex-shrink-0" />
          <span className="text-sm font-semibold text-ink-primary tracking-tight">Uniblox</span>
        </Link>

        {/* Back to app */}
        <div className="px-4 py-3 border-b border-line flex-shrink-0">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-sm text-ink-secondary hover:text-ink-primary
                       transition-colors group"
          >
            <ArrowLeft size={14} className="group-hover:-translate-x-0.5 transition-transform flex-shrink-0" />
            <span>Back to app</span>
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {NAV.map(({ section, items }) => (
            <div key={section} className="mb-4">
              <div className="px-4 py-1 text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                {section}
              </div>
              {items.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  className={({ isActive }) => cn(
                    'flex items-center gap-2.5 px-4 h-9 text-sm font-normal transition-colors',
                    'border-l-2',
                    isActive
                      ? 'text-brand bg-brand-light border-brand font-medium'
                      : 'text-ink-secondary border-transparent hover:text-ink-primary hover:bg-surface-hover'
                  )}
                >
                  <Icon size={14} className="flex-shrink-0" />
                  {label}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        {/* User info */}
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

      <Toaster position="bottom-right" richColors />
    </div>
  )
}
