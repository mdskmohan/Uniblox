/**
 * App.jsx
 *
 * Root router. Defines two parallel layout trees:
 *
 *  1. AppShell  — operational routes (/, /submissions/*, /underwriting/*,
 *                 /enrollment/*, /analytics/*). Includes the collapsible
 *                 sidebar, sticky TopNav, and per-page ErrorBoundary.
 *
 *  2. SettingsShell — /settings/* routes. Completely separate layout with its
 *                 own fixed sidebar and no main nav, following the
 *                 Stripe / Linear / GitHub settings-as-full-page pattern.
 *
 * Route index redirects:
 *  /            → /submissions
 *  /settings    → /settings/profile
 *
 * Adding a new page:
 *  1. Create the component in src/pages/
 *  2. Import it here
 *  3. Add a <Route> under the appropriate shell
 *  4. Add the breadcrumb entry in TopNav.jsx (BREADCRUMBS map) if it is an
 *     AppShell route
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import AppShell      from '@/components/layout/AppShell'
import SettingsShell from '@/components/layout/SettingsShell'

import Submissions       from '@/pages/Submissions'
import NewSubmission     from '@/pages/NewSubmission'
import SubmissionDetail  from '@/pages/SubmissionDetail'
import PendingReview     from '@/pages/PendingReview'
import DecisionsArchive  from '@/pages/DecisionsArchive'
import UnderwritingQueue from '@/pages/UnderwritingQueue'
import RiskAssessment    from '@/pages/RiskAssessment'
import EOIManagement     from '@/pages/EOIManagement'
import ActiveEnrollments from '@/pages/ActiveEnrollments'
import EmployeePortal    from '@/pages/EmployeePortal'
import CensusUpload      from '@/pages/CensusUpload'
import PortfolioDashboard from '@/pages/PortfolioDashboard'
import ModelPerformance  from '@/pages/ModelPerformance'
import AuditLog          from '@/pages/AuditLog'
import CarrierConfig     from '@/pages/CarrierConfig'
import AISettings        from '@/pages/AISettings'
import ComplianceRules   from '@/pages/ComplianceRules'
import StateGuidelines   from '@/pages/StateGuidelines'
import TeamAccess        from '@/pages/TeamAccess'
import Profile           from '@/pages/Profile'
import Preferences       from '@/pages/Preferences'
import Notifications     from '@/pages/Notifications'
import Security          from '@/pages/Security'
import Billing           from '@/pages/Billing'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* ── Main app ── */}
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/submissions" replace />} />

          {/* Submissions */}
          <Route path="submissions"          element={<Submissions />} />
          <Route path="submissions/new"      element={<NewSubmission />} />
          <Route path="submissions/pending"  element={<PendingReview />} />
          <Route path="submissions/archive"  element={<DecisionsArchive />} />
          <Route path="submissions/:id"      element={<SubmissionDetail />} />

          {/* Underwriting */}
          <Route path="underwriting/queue"   element={<UnderwritingQueue />} />
          <Route path="underwriting/risk"    element={<RiskAssessment />} />
          <Route path="underwriting/eoi"     element={<EOIManagement />} />

          {/* Enrollment */}
          <Route path="enrollment/active"    element={<ActiveEnrollments />} />
          <Route path="enrollment/portal"    element={<EmployeePortal />} />
          <Route path="enrollment/census"    element={<CensusUpload />} />

          {/* Analytics */}
          <Route path="analytics/portfolio"  element={<PortfolioDashboard />} />
          <Route path="analytics/performance"element={<ModelPerformance />} />
          <Route path="analytics/audit"      element={<AuditLog />} />
        </Route>

        {/* ── Settings (own shell, no main sidebar) ── */}
        <Route path="/settings" element={<SettingsShell />}>
          <Route index element={<Navigate to="/settings/profile" replace />} />
          <Route path="profile"        element={<Profile />} />
          <Route path="preferences"    element={<Preferences />} />
          <Route path="notifications"  element={<Notifications />} />
          <Route path="security"       element={<Security />} />
          <Route path="team"           element={<TeamAccess />} />
          <Route path="billing"        element={<Billing />} />
          <Route path="carrier"     element={<CarrierConfig />} />
          <Route path="ai"          element={<AISettings />} />
          <Route path="compliance"  element={<ComplianceRules />} />
          <Route path="states"      element={<StateGuidelines />} />
        </Route>

      </Routes>
    </BrowserRouter>
  )
}
