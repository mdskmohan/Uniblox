# Uniblox — AI-Powered Group Insurance Underwriting Platform

> **Prototype / Demo** — A fully functional front-end prototype of a B2B insurance underwriting SaaS. All data is seeded in-browser; no backend is required to run.

---

## Overview

Uniblox is a modern underwriting workstation that combines AI-assisted risk assessment, regulatory compliance enforcement, and enrollment management into a single platform for insurance carriers and MGAs.

Key capabilities:
- **AI risk scoring** — paste or upload a group submission and get a structured risk assessment (score, sub-scores, confidence, recommendation) powered by the Claude API
- **Compliance engine** — state-specific rules (GI laws, community rating, prohibited risk factors, adverse action deadlines) are enforced automatically before any recommendation is surfaced
- **Carrier configuration** — manage multiple carrier contracts, each with its own industry appetite grid, GI limits, auto-approve/decline thresholds, and custom underwriting rules
- **EOI management** — Evidence of Insurability workflow with HIPAA-aware PHI handling and full audit trail
- **Enrollment** — active enrollment tracking, employee portal preview, and AI-assisted census analysis
- **Analytics** — portfolio dashboard, model performance metrics, and immutable audit log
- **AI Assistant** — Copilot-style assistant (✦ icon in the top nav) that understands your live queue data and can help draft communications, answer compliance questions, and navigate the platform

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 (CSS variable design tokens, dark mode) |
| Routing | React Router v6 (nested routes, two shell layouts) |
| State | Zustand (global store, no Redux boilerplate) |
| UI Primitives | Radix UI (Dialog, Tabs, Switch, Tooltip, etc.) |
| Icons | Lucide React |
| Charts | Recharts |
| Toasts | Sonner |
| AI API | Anthropic Claude (direct browser access via `anthropic-dangerous-direct-browser-access`) |

---

## Project Structure

```
src/
├── App.jsx                    # Root router — two parallel layout trees
├── main.jsx                   # Entry point, root ErrorBoundary
│
├── components/
│   ├── layout/
│   │   ├── AppShell.jsx       # Main shell: Sidebar + TopNav + Outlet
│   │   ├── Sidebar.jsx        # Left nav (Submissions, Underwriting, Enrollment, Analytics)
│   │   ├── TopNav.jsx         # Sticky header: breadcrumbs, AI panel, notifications, user menu
│   │   ├── SettingsShell.jsx  # Separate full-page shell for /settings/* routes
│   │   ├── AIAssistantPanel.jsx  # Copilot-style right-side AI chat panel
│   │   └── DocsSupportPanel.jsx  # Docs search + support ticket panel
│   │
│   ├── shared/
│   │   ├── ErrorBoundary.jsx  # React class error boundary (dev details + prod recovery UI)
│   │   ├── PageHeader.jsx     # Standard page title + subtitle + actions slot
│   │   ├── Banner.jsx         # Inline alert banners (info / warning / danger / phi)
│   │   ├── KPICard.jsx        # Metric card with trend indicator
│   │   └── RiskScore.jsx      # RiskGauge (circular), SubScoreBar, ConfidenceBar, RiskScoreCell
│   │
│   └── ui/                    # Low-level primitives (all built on Radix UI)
│       ├── button.jsx         # Button (primary / secondary / danger / ghost / success)
│       ├── badge.jsx          # Badge + StatusBadge (auto-maps status string → color)
│       ├── input.jsx          # Input, Textarea, Select, FormGroup
│       ├── dialog.jsx         # Modal dialog (focus-trapped, scroll-locked)
│       ├── tabs.jsx           # Tabs (keyboard navigable)
│       ├── switch.jsx         # Toggle switch with optional label + description
│       ├── card.jsx           # Card, CardHeader, CardTitle, CardBody, CardFooter
│       ├── tooltip.jsx        # Hover tooltip
│       ├── progress.jsx       # Progress bar
│       ├── slider.jsx         # Range slider
│       ├── checkbox.jsx       # Checkbox
│       └── separator.jsx      # Horizontal rule
│
├── pages/
│   ├── Submissions.jsx        # All submissions list with filters
│   ├── NewSubmission.jsx      # AI analysis — paste text or fill structured form
│   ├── SubmissionDetail.jsx   # Full detail view: AI assessment, compliance, docs, activity
│   ├── PendingReview.jsx      # Filtered queue of PENDING submissions
│   ├── DecisionsArchive.jsx   # Archive of APPROVED/DECLINED/REFERRED decisions
│   ├── UnderwritingQueue.jsx  # Full underwriting queue with priority sorting
│   ├── RiskAssessment.jsx     # Risk methodology explainer + calibration tools
│   ├── EOIManagement.jsx      # EOI workflow with HIPAA-aware PHI handling
│   ├── ActiveEnrollments.jsx  # Live enrollment tracking
│   ├── EmployeePortal.jsx     # Employee-facing portal preview
│   ├── CensusUpload.jsx       # CSV census upload + AI aggregate analysis
│   ├── PortfolioDashboard.jsx # Charts: approval rates, industry breakdown, trends
│   ├── ModelPerformance.jsx   # AI model accuracy metrics and calibration
│   ├── AuditLog.jsx           # Immutable decision audit trail (exportable)
│   │
│   └── Settings (under /settings/*)
│       ├── Profile.jsx        # Profile, Preferences, Notifications, Security tabs
│       ├── TeamAccess.jsx     # Members, Roles & Permissions, SSO/SAML, API Keys
│       ├── Billing.jsx        # Plan overview, usage meters, invoices
│       ├── CarrierConfig.jsx  # Carrier contracts, appetite grid, GI limits, rules
│       ├── AISettings.jsx     # API key, model settings, explainability, compliance
│       ├── ComplianceRules.jsx# State compliance rule viewer
│       └── StateGuidelines.jsx# Per-state regulatory reference
│
├── engine/
│   ├── ai.js                  # All Claude API calls (callClaudeAPI, callAssistantAPI, testConnection)
│   └── compliance.js          # Pure compliance functions (state rules, GI overrides, adverse action)
│
├── store/
│   ├── useAppStore.js         # Zustand global store (state shape + all actions + computed getters)
│   └── sampleData.js          # Seed data: carriers, submissions, EOIs, enrollments, state rules
│
├── lib/
│   └── utils.js               # Shared utilities (formatDate, formatCurrency, getRiskLevel, etc.)
│
├── assets/
│   └── logo.png               # Uniblox logomark (imported via Vite, fingerprinted in build)
│
└── index.css                  # Tailwind directives + CSS custom property design tokens + component layer
```

---

## Routing

Two independent layout trees share the same router:

```
/                          → redirect to /submissions
│
├── AppShell (Sidebar + TopNav)
│   ├── /submissions              All Submissions
│   ├── /submissions/new          New Submission (AI analysis)
│   ├── /submissions/pending      Pending Review queue
│   ├── /submissions/archive      Decisions Archive
│   ├── /submissions/:id          Submission Detail
│   ├── /underwriting/queue       Underwriting Queue
│   ├── /underwriting/risk        Risk Assessment
│   ├── /underwriting/eoi         EOI Management
│   ├── /enrollment/active        Active Enrollments
│   ├── /enrollment/portal        Employee Portal
│   ├── /enrollment/census        Census Upload
│   ├── /analytics/portfolio      Portfolio Dashboard
│   ├── /analytics/performance    Model Performance
│   └── /analytics/audit          Audit Log
│
└── SettingsShell (own sidebar, no TopNav)
    ├── /settings                 → redirect to /settings/profile
    ├── /settings/profile         Profile + Preferences + Notifications + Security
    ├── /settings/team            Team & Access (Members, Roles, SSO, API Keys)
    ├── /settings/billing         Billing & Plan
    ├── /settings/carrier         Carrier Configuration
    ├── /settings/ai              AI Model Settings
    ├── /settings/compliance      Compliance Rules
    └── /settings/states          State Guidelines
```

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & run

```bash
# Clone the repo
git clone https://github.com/mdskmohan/Uniblox.git
cd Uniblox

# Install dependencies
npm install

# Start development server
npm run dev
# → http://localhost:5173
```

### Build for production

```bash
npm run build
# Output: dist/
npm run preview   # preview the production build locally
```

---

## AI Features Setup

The AI risk assessment and AI Assistant features require a Claude API key.

1. Navigate to **Settings → AI Model Settings** (click your avatar in the top-right → Settings, or open the ⚙ menu)
2. Paste your API key into the **AI API Key** field and click **Save**
3. Click **Test** to verify connectivity

> The key is stored in browser memory only (Zustand state). It is never written to `localStorage` or sent to any server other than `api.anthropic.com`. Refreshing the page clears it.

Once set, you can:
- Use **New Submission** to paste a group insurance application and get a full AI risk assessment
- Open the **✦ AI Assistant** panel (sparkle icon in the top nav) for a Copilot-style chat interface

---

## Key Design Decisions

### Two-shell architecture
Settings routes use a completely separate `SettingsShell` layout (following the Stripe / Linear / GitHub pattern) so that settings feel like a distinct, focused area with their own left nav. Operational routes use `AppShell` with the main sidebar.

### Client-side compliance engine
`src/engine/compliance.js` enforces state insurance regulations (guaranteed issue, community rating, auto-decline prohibitions, adverse action deadlines) as pure JavaScript functions — no API call needed. This lets compliance checks run instantly on every form interaction without waiting for the AI.

### AI vocabulary normalization
The Claude API returns `carrierAppetiteMatch` as `ACCEPTABLE | MARGINAL | OUTSIDE_APPETITE`. The carrier's own appetite grid stores raw values `ACCEPT | MARGINAL | DECLINE`. `checkCarrierAppetite()` in `compliance.js` normalizes the raw grid values to match the AI schema so UI logic only needs to handle one vocabulary.

### Error boundaries
A class-based `ErrorBoundary` is mounted at two levels:
- Root (`main.jsx`) — catches catastrophic errors that escape all shells
- Per-page (`AppShell.jsx` wrapping `<Outlet />`) — catches page-level render errors without crashing the nav

### Sample data
`src/store/sampleData.js` seeds a realistic demo environment with multiple carriers, 15+ submissions across all statuses, EOIs, enrollments, and state rules for key states. In production, replace these static arrays with API calls that populate the same Zustand store keys.

---

## State Management

All application state lives in a single Zustand store (`src/store/useAppStore.js`).

| State key | Type | Description |
|---|---|---|
| `sidebarCollapsed` | boolean | Sidebar visibility toggle |
| `theme` | `'light' \| 'dark'` | Current color scheme |
| `currentUser` | object | Logged-in user (name, role, email, initials) |
| `apiKey` | string \| null | Claude API key (memory only) |
| `activeCarrierId` | string | ID of the active carrier context |
| `carriers` | array | All configured carrier contracts |
| `submissions` | array | All group insurance submissions |
| `eois` | array | All Evidence of Insurability requests |
| `enrollments` | array | All active group enrollments |
| `auditLog` | array | Immutable audit trail entries |
| `notifications` | array | Bell notification items with read state |

---

## Compliance Architecture

State insurance rules are stored in `sampleData.stateRules` and accessed via `getStateRules(stateCode)`. Each rule object defines:

- `smallGroupLimit` — employee count threshold for small-group regulations
- `guaranteedIssue` — whether the state requires GI for small groups
- `communityRatingRequired` — whether health-based premium variation is prohibited
- `autoDeclinePermitted` — whether carriers can auto-decline small groups
- `prohibitedRiskFactors` — list of factors the AI must not use
- `adverseActionNoticeDays` — statutory deadline for sending adverse action notices
- `regulatoryReference` — citation (e.g. `"NY Ins. Law § 3231"`)

The compliance engine (`compliance.js`) enforces these rules in two places:
1. **Pre-AI** — `injectStateRulesIntoPrompt()` adds state rules to the Claude system prompt
2. **Post-AI** — `validateAIRecommendation()` overrides a DECLINE to REFER when GI law prohibits it

---

## License

This is a prototype / demo application. All insurance data, carrier names, and submission records are synthetic and for demonstration purposes only.
