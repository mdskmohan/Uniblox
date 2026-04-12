/**
 * AppShell.jsx
 *
 * Root layout for all operational routes (Submissions, Underwriting, Enrollment,
 * Analytics). Composes the fixed Sidebar, sticky TopNav, and a scrollable main
 * content area that renders the current route via React Router's <Outlet />.
 *
 * Layout logic:
 * - Sidebar is fixed at 240 px wide (w-sidebar CSS variable).
 * - Main content shifts right by 240 px when the sidebar is visible. The
 *   transition-all smooths the collapse animation.
 * - Toaster is mounted here (not in individual pages) so toast notifications
 *   persist across route changes.
 *
 * Settings routes use a separate SettingsShell layout — see App.jsx for routing.
 */

import { Outlet } from 'react-router-dom'
import { Toaster } from 'sonner'
import Sidebar       from './Sidebar'
import TopNav        from './TopNav'
import ErrorBoundary from '@/components/shared/ErrorBoundary'
import useAppStore   from '@/store/useAppStore'

export default function AppShell() {
  const { sidebarCollapsed } = useAppStore()

  return (
    <div className="flex h-screen overflow-hidden bg-surface-secondary">
      <Sidebar />

      <div
        className="flex flex-col flex-1 min-w-0 transition-all duration-200"
        style={{ marginLeft: sidebarCollapsed ? 0 : '240px' }}
      >
        <TopNav />

        {/* Per-page error boundary — catches render errors without crashing the shell */}
        <main className="flex-1 overflow-y-auto p-6">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>

      <Toaster
        position="bottom-right"
        richColors
        toastOptions={{
          style: {
            background: 'var(--bg-primary)',
            border:     '1px solid var(--border)',
            color:      'var(--text-primary)',
          },
        }}
      />
    </div>
  )
}
