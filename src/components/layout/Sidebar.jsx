/**
 * Sidebar.jsx
 *
 * Primary navigation sidebar for the Uniblox application shell.
 * Renders the company logo, carrier context switcher, and section-grouped
 * nav links for all operational areas (Submissions, Underwriting, Enrollment,
 * Analytics).
 *
 * Settings navigation is intentionally excluded — it lives in SettingsShell.
 * The sidebar is hidden when `sidebarCollapsed` is true (toggled via TopNav).
 *
 * Badge counts are driven live from the Zustand store so pending/queue numbers
 * stay in sync across the app without any extra fetch.
 */

import React, { useState } from 'react'
import { NavLink } from 'react-router-dom'
import {
  LayoutList, Plus, Circle, Archive, Layers, Diamond, PlusCircle,
  CheckSquare, Monitor, Upload, BarChart2, Activity, AlignJustify,
  ChevronDown,
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { cn } from '@/lib/utils'
import logo from '@/assets/logo.png'

// ─── Navigation structure ─────────────────────────────────────────────────────
// Each section groups related nav items. The optional `badge` key maps to a
// count derived from the store (see getBadgeCount below).
const NAV = [
  {
    section: 'SUBMISSIONS',
    items: [
      { to: '/submissions',         label: 'All Submissions',         icon: LayoutList },
      { to: '/submissions/new',     label: 'New Submission',          icon: Plus },
      { to: '/submissions/pending', label: 'Pending Review',          icon: Circle,  badge: 'pending' },
      { to: '/submissions/archive', label: 'Decisions Archive',       icon: Archive },
    ],
  },
  {
    section: 'UNDERWRITING',
    items: [
      { to: '/underwriting/queue',  label: 'Underwriting Queue',      icon: Layers,  badge: 'queue' },
      { to: '/underwriting/risk',   label: 'Risk Assessment',         icon: Diamond },
      { to: '/underwriting/eoi',    label: 'EOI Management',          icon: PlusCircle },
    ],
  },
  {
    section: 'ENROLLMENT',
    items: [
      { to: '/enrollment/active',   label: 'Active Enrollments',      icon: CheckSquare },
      { to: '/enrollment/portal',   label: 'Employee Portal Preview', icon: Monitor },
      { to: '/enrollment/census',   label: 'Census File Upload',      icon: Upload },
    ],
  },
  {
    section: 'ANALYTICS',
    items: [
      { to: '/analytics/portfolio',  label: 'Portfolio Dashboard',    icon: BarChart2 },
      { to: '/analytics/performance',label: 'Model Performance',      icon: Activity },
      { to: '/analytics/audit',      label: 'Audit Log',              icon: AlignJustify },
    ],
  },
]

// ─── Component ────────────────────────────────────────────────────────────────

export default function Sidebar() {
  const {
    sidebarCollapsed,
    carriers,
    activeCarrierId,
    setActiveCarrier,
    getPendingCount,
    getQueueCount,
  } = useAppStore()

  const [carrierOpen, setCarrierOpen] = useState(false)

  const activeCarrier = carriers.find((c) => c.id === activeCarrierId)

  /** Maps a badge key to its live count from the store. */
  function getBadgeCount(key) {
    if (key === 'pending') return getPendingCount()
    if (key === 'queue')   return getQueueCount()
    return 0
  }

  // Sidebar is hidden when collapsed — AppShell adjusts main content margin.
  if (sidebarCollapsed) return null

  return (
    <aside
      className="fixed left-0 top-0 z-50 flex flex-col h-screen w-sidebar
                 bg-surface-secondary border-r border-line overflow-y-auto"
      aria-label="Main navigation"
    >
      {/* ── Logo ── height matches TopNav (h-topnav = 52px) so border-b aligns */}
      <div className="flex items-center gap-2.5 px-4 h-topnav border-b border-line flex-shrink-0">
        <img
          src={logo}
          alt="Uniblox"
          className="h-7 w-auto object-contain flex-shrink-0"
        />
        <span className="text-sm font-semibold text-ink-primary tracking-tight">Uniblox</span>
      </div>

      {/* ── Carrier context switcher ── */}
      {/* Lets users scope the entire UI to a specific carrier contract. */}
      <div className="px-3 py-3 border-b border-line flex-shrink-0 relative">
        <button
          onClick={() => setCarrierOpen((o) => !o)}
          aria-haspopup="listbox"
          aria-expanded={carrierOpen}
          className="w-full flex items-center justify-between gap-2 h-8 px-2.5
                     bg-surface-primary border border-line rounded text-sm
                     text-ink-primary hover:border-line-strong transition-colors"
        >
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-4 h-4 rounded bg-brand/20 flex items-center justify-center flex-shrink-0">
              <span className="text-brand text-[9px] font-bold">
                {activeCarrier?.name?.[0] ?? 'C'}
              </span>
            </div>
            <span className="truncate text-xs">{activeCarrier?.name ?? 'Select carrier'}</span>
          </div>
          <ChevronDown size={12} className="text-ink-tertiary flex-shrink-0" />
        </button>

        {carrierOpen && (
          <>
            {/* Click-away backdrop */}
            <div className="fixed inset-0 z-40" onClick={() => setCarrierOpen(false)} />
            <div
              role="listbox"
              className="absolute left-3 right-3 top-full mt-1 bg-surface-primary border border-line
                         rounded-md shadow-modal z-50 py-1 animate-fadeIn"
            >
              {carriers.map((c) => (
                <button
                  key={c.id}
                  role="option"
                  aria-selected={c.id === activeCarrierId}
                  onClick={() => { setActiveCarrier(c.id); setCarrierOpen(false) }}
                  className={cn(
                    'w-full text-left px-3 py-2 text-sm flex items-center gap-2',
                    'hover:bg-surface-hover transition-colors',
                    c.id === activeCarrierId && 'text-brand font-medium'
                  )}
                >
                  <div className="w-5 h-5 rounded bg-brand/20 flex items-center justify-center flex-shrink-0">
                    <span className="text-brand text-[10px] font-bold">{c.name[0]}</span>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-medium truncate">{c.name}</div>
                    <div className="text-[10px] text-ink-tertiary">{c.submissionCount} submissions</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* ── Navigation sections ── */}
      <nav className="flex-1 py-2" aria-label="Operational navigation">
        {NAV.map(({ section, items }) => (
          <div key={section} className="mb-1">
            {/* Section label — not interactive, purely visual grouping */}
            <div
              className="px-4 py-1.5 text-[11px] font-medium text-ink-tertiary tracking-wider uppercase"
              aria-hidden="true"
            >
              {section}
            </div>

            {items.map(({ to, label, icon: Icon, badge }) => {
              const count = badge ? getBadgeCount(badge) : 0
              return (
                <NavLink
                  key={to}
                  to={to}
                  // `end` on the root submissions path prevents it staying active
                  // when child routes like /submissions/new are active.
                  end={to === '/submissions'}
                  className={({ isActive }) => cn('nav-item', isActive && 'active')}
                >
                  <Icon size={15} className="flex-shrink-0" aria-hidden="true" />
                  <span className="flex-1 truncate">{label}</span>
                  {/* Live badge — only renders when count > 0 */}
                  {badge && count > 0 && (
                    <span
                      aria-label={`${count} items`}
                      className="ml-auto bg-brand text-white text-[10px] font-semibold
                                 rounded-full px-1.5 h-4 flex items-center"
                    >
                      {count}
                    </span>
                  )}
                </NavLink>
              )
            })}
          </div>
        ))}
      </nav>
    </aside>
  )
}
