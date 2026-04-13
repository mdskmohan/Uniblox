# Uniblox — AI-Native Group Insurance Underwriting Platform

> **Live Prototype →** [uniblox.vercel.app](https://uniblox.vercel.app)
>
> A fully interactive, front-end prototype of an AI-first group benefits underwriting platform. No backend required. All AI calls run live against the Anthropic Claude API.

---

## The Problem We're Solving

Every year, thousands of small and mid-size businesses apply for group health, life, and disability insurance for their employees. Each application lands on an underwriter's desk as a PDF or email from a broker. The underwriter reads through it, checks their carrier's appetite rules, looks up state regulations, calculates a risk score mentally, and writes up a decision.

**This process is broken in four specific ways:**

| Problem | Current Reality | Business Impact |
|---------|----------------|-----------------|
| **Speed** | 3–10 business days per decision | Brokers go elsewhere. Lost premium. |
| **Consistency** | Two underwriters give different answers to the same file | Legal exposure. Compliance gaps. |
| **Compliance** | 51 state rule sets, updated constantly | Missed adverse action deadlines = lawsuits |
| **Auditability** | Notes in email threads and spreadsheets | Fails regulator audits. No defensible record. |

Uniblox compresses that entire workflow — from raw broker submission to structured, defensible, compliance-checked decision — into **seconds**, not days.

---

## What Uniblox Does

```
BEFORE (Industry Standard Today)
─────────────────────────────────────────────────────────────────
 Broker email          Underwriter        Spreadsheet    Decision
 (PDF attachment) ───► reads manually ──► manually ───► emailed
                       2–10 days           calculates     back
                       per file            risk score

AFTER (Uniblox)
─────────────────────────────────────────────────────────────────
 Broker submission     Compliance         AI Risk        Decision
 (any format)    ───► Engine checks ───► Assessment ──► in app
                       state rules        (Claude AI)    in seconds
                       instantly          structured     full audit
                                          JSON output    trail
```

---

## Platform Overview

Uniblox is organized into five operational modules, each mapping to a real workflow in a carrier or MGA:

```
┌─────────────────────────────────────────────────────────────────┐
│                         UNIBLOX PLATFORM                        │
├──────────────┬──────────────┬──────────────┬────────────────────┤
│  SUBMISSIONS │ UNDERWRITING │  ENROLLMENT  │    ANALYTICS       │
│              │              │              │                     │
│ • New Sub    │ • Queue      │ • Active     │ • Portfolio Dash   │
│ • Detail     │ • Risk Assess│ • Portal     │ • Model Perf.      │
│ • Pending    │ • EOI Mgmt   │ • Census     │ • Audit Log        │
│ • Archive    │              │              │                     │
├──────────────┴──────────────┴──────────────┴────────────────────┤
│                          SETTINGS                                │
│  Profile · Preferences · Notifications · Security · Team Access │
│  Carrier Config · AI Settings · Compliance Rules · State Guide  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Feature Deep Dive

### 1. New Submission + AI Risk Assessment

The core workflow. A broker submission arrives (text paste, PDF, Word doc, or Excel spreadsheet). The underwriter drops it into the system.

**What happens under the hood:**

```
  Step 1: FILE PARSING (browser-side, no upload)
  ┌─────────────────────────────────────────┐
  │  PDF  ──► pdfjs-dist                    │
  │  DOCX ──► mammoth.js                    │  All run entirely
  │  XLSX ──► SheetJS                       │  in the browser
  │  TXT  ──► native FileReader             │
  └──────────────────┬──────────────────────┘
                     │ raw text
  Step 2: COMPLIANCE ENGINE (synchronous, no API)
  ┌──────────────────▼──────────────────────┐
  │  compliance.js checks:                  │
  │  • Is this a small group? (state rules) │
  │  • Does GI apply? (prohibits decline)   │
  │  • Community rating required?           │
  │  • Adverse action deadline (days)       │
  │  • Prohibited risk factors to strip     │
  └──────────────────┬──────────────────────┘
                     │ compliance context injected into prompt
  Step 3: AI ASSESSMENT (Claude Sonnet 4)
  ┌──────────────────▼──────────────────────┐
  │  System prompt includes:                │
  │  • Base underwriting instructions       │
  │  • Active carrier appetite + rules      │
  │  • State compliance rules               │
  │  • Protected class prohibitions         │
  │                                         │
  │  Returns structured JSON:               │
  │  • riskScore (0–100)                    │
  │  • subScores (4 dimensions)             │
  │  • recommendation (APPROVE/REFER/DECLINE│
  │  • confidenceLevel (0–100)              │
  │  • reasoningPoints (3–5 bullets)        │
  │  • missingInfoFlags                     │
  │  • complianceNotes                      │
  │  • carrierAppetiteMatch                 │
  └──────────────────┬──────────────────────┘
                     │
  Step 4: VALIDATION OVERRIDE
  ┌──────────────────▼──────────────────────┐
  │  validateAIRecommendation():            │
  │  If AI says DECLINE but GI applies →    │
  │  Override to REFER + log reason         │
  │  (AI cannot override a law)             │
  └──────────────────┬──────────────────────┘
                     │
  Step 5: AUDIT ENTRY
  ┌──────────────────▼──────────────────────┐
  │  Every assessment logged:               │
  │  timestamp · user · input hash ·        │
  │  AI output · any overrides applied      │
  └─────────────────────────────────────────┘
```

**Risk Score Dimensions:**

```
  Overall Risk Score (0–100)
  ├── Liability Risk      (workplace, industry exposure)
  ├── Financial Stability (revenue, years in business, entity type)
  ├── Claims History      (prior claims count, totals, recency)
  └── Industry Risk       (carrier appetite, sector baseline)

  Decision Zones:
  ┌──────────────┬──────────────────────┬───────────────────┐
  │   0 – 39     │      40 – 69         │     70 – 100      │
  │  AUTO-APPROVE│   HUMAN REVIEW       │   AUTO-DECLINE    │
  │  (low risk)  │   (refer to UW)      │   (high risk)     │
  └──────────────┴──────────────────────┴───────────────────┘
  Note: thresholds configurable per carrier. Confidence < 60% always → REFER.
```

---

### 2. Compliance Engine

This is what separates Uniblox from a generic AI tool. The compliance engine runs **before** the AI, and its output overrides AI decisions when the law requires it.

```
  compliance.js — 7 exported functions, all synchronous, zero API calls

  checkStateCompliance(submission)
  │ Input: { state, employeeCount, selfFunded, ... }
  │ Output: { guaranteedIssue, communityRatingRequired,
  │           adverseActionNoticeDays, prohibitedRiskFactors, ... }
  │
  validateAIRecommendation(aiRec, submission)
  │ If GI + small group + AI says DECLINE → override to REFER
  │ If ERISA self-funded → state rules preempted (federal law wins)
  │
  getAdverseActionDeadline(submission)
  │ Returns days by state (e.g. CA=30, NY=15, IL=5 per statute)
  │
  checkCarrierAppetite(industry, carrier)
  │ Normalizes 'ACCEPT'→'ACCEPTABLE', 'DECLINE'→'OUTSIDE_APPETITE'
  │ (keeps AI vocabulary and grid vocabulary in sync)
  │
  generateAdverseActionNotice(submission, reasons, carrier)
  │ Produces regulatory-compliant plain-text letter with:
  │   • State statute citation
  │   • Decline reasons (no internal scores exposed to broker)
  │   • Continuance offer language (if CA or applicable state)
  │   • Rights and reconsideration instructions
  │
  checkContinuanceRequirement(submission)
  │ CA Insurance Code § 10712 — 60-day continuance offer
  │
  injectStateRulesIntoPrompt(state, basePrompt)
    Appends GI thresholds, prohibited factors, and deadlines
    directly into Claude's system prompt before every call
```

**State Coverage:**

```
  Full regulatory detail (GI, community rating, adverse action, special rules):
  CA  NY  IL  TX  FL  WA  MA  NJ  PA  GA

  Standard ACA / federal baseline rules:
  All remaining 41 states + DC
```

---

### 3. Carrier Configuration

Each carrier has its own appetite grid, thresholds, and custom rules that are injected directly into the AI prompt for every submission evaluated against that carrier.

```
  Per-Carrier Configuration:
  ┌─────────────────────────────────────────────────────────┐
  │ CARRIER PROFILE      INDUSTRY APPETITE (17 industries) │
  │ • Name / NAIC        ┌──────────────┬──────────────┐   │
  │ • Legal entity       │ Industry     │ Appetite     │   │
  │ • Primary contact    ├──────────────┼──────────────┤   │
  │ • Contract start     │ Technology   │ ACCEPT       │   │
  │                      │ Restaurant   │ DECLINE      │   │
  │ AUTOMATION           │ Healthcare   │ ACCEPT       │   │
  │ ┌──────────────────┐ │ Manufacturing│ MARGINAL     │   │
  │ │ 0──[35]────[75]──100 └──────────────┴──────────────┘   │
  │ │  Approve Review Decline                            │   │
  │ └──────────────────┘                                │   │
  │ STATE AVAILABILITY   CUSTOM RULES (→ AI prompt)     │   │
  │ Toggle 51 states     Plain-English rules injected   │   │
  │                      into every Claude API call     │   │
  └─────────────────────────────────────────────────────────┘
```

---

### 4. EOI Management (Evidence of Insurability)

For employees requesting life insurance above the guaranteed issue amount. PHI-aware workflow with full audit trail.

```
  Employee requests > GI amount
         │
         ▼
  EOI form generated
         │
         ▼
  Medical review (PHI-protected)
         │
  ┌──────┴──────┐
  │             │
  APPROVED    DECLINED
  │             │
  Issue at    Issue at     ← Both paths documented
  requested   GI amount       with regulatory language
  amount
```

**Status workflow:** `PENDING` → `IN_REVIEW` → `PENDING_INFO` → `APPROVED` / `DECLINED`

---

### 5. Team & Access Control

Role-based access with fully customizable permissions.

```
  BUILT-IN ROLES (system, non-deletable):
  ┌──────────────────────┬──────────────────────────────────────────┐
  │ Role                 │ Key Permissions                          │
  ├──────────────────────┼──────────────────────────────────────────┤
  │ Admin                │ All permissions                          │
  │ Senior Underwriter   │ Approve, Decline, Override AI            │
  │ Underwriter          │ Review, Make Decisions                   │
  │ Compliance Officer   │ Edit Rules, View Audit                   │
  │ Enrollment Coord.    │ Manage Enrollments                       │
  │ Broker Relations     │ Read-only Submissions                    │
  │ Viewer               │ Read-only Reports                        │
  └──────────────────────┴──────────────────────────────────────────┘

  CUSTOM ROLES: Create from scratch or copy from any built-in role.
  12 granular permissions across 5 groups:
  Submissions · Underwriting · Enrollment · Analytics · Platform
```

---

### 6. AI Assistant (Copilot)

A context-aware AI chat panel accessible from any page via the ✦ icon.

```
  Top Nav ──► ✦ AI Assistant
                │
                ▼
  System prompt includes live app state snapshot:
  • Current user + role
  • Active carrier
  • Pending / referred / approved / declined counts
  • Last 5 submissions (id, employer, status, risk, state)
  • Active enrollment count
  • All configured carriers
                │
                ▼
  Claude can:
  • Answer questions about the queue
  • Explain risk scores and reasoning
  • Draft adverse action notices or broker comms
  • Explain state-specific regulations
  • Navigate the user to a specific page (action block)
  • Summarize portfolio statistics

  Navigation hint format (parsed by the panel):
  {"action":"navigate","path":"/submissions/pending","label":"Go to Pending"}
```

---

### 7. Analytics Suite

```
  PORTFOLIO DASHBOARD
  ├── Approval / Referral / Decline rate trends (12 months)
  ├── Industry concentration chart (submission volume by sector)
  ├── Risk score distribution histogram
  ├── State heatmap (submission volume by geography)
  └── Decision velocity (avg. time to decision over time)

  MODEL PERFORMANCE
  ├── AI accuracy vs. human final decision (calibration)
  ├── Confidence level distribution
  ├── Override rate by recommendation type
  └── False positive / negative analysis

  AUDIT LOG
  ├── Every AI assessment, human decision, override, and compliance action
  ├── Tamper-evident (append-only in production)
  ├── 7-year retention (NAIC model audit law)
  └── Exportable (CSV, filtered by date / user / action type)
```

---

## System Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         BROWSER (Client)                         │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │                    React 18 + Vite 5                      │   │
│  │                                                          │   │
│  │  ┌──────────────┐   ┌──────────────┐   ┌─────────────┐  │   │
│  │  │  AppShell    │   │ SettingsShell│   │   21 Pages  │  │   │
│  │  │  (Sidebar +  │   │ (own nav,    │   │  (one file  │  │   │
│  │  │   TopNav)    │   │  no sidebar) │   │  per route) │  │   │
│  │  └──────┬───────┘   └──────────────┘   └─────────────┘  │   │
│  │         │                                                │   │
│  │  ┌──────▼───────────────────────────────────────────┐   │   │
│  │  │              Zustand Global Store                │   │   │
│  │  │  carriers · submissions · EOIs · enrollments     │   │   │
│  │  │  auditLog · notifications · currentUser · theme  │   │   │
│  │  └──────┬───────────────────────────────────────────┘   │   │
│  │         │                                                │   │
│  │  ┌──────▼──────────────────────────────────────────┐    │   │
│  │  │              Engine Layer                        │    │   │
│  │  │  ┌────────────┐ ┌───────────┐ ┌──────────────┐  │    │   │
│  │  │  │  ai.js     │ │compliance │ │ fileParser   │  │    │   │
│  │  │  │ 4 exports  │ │  .js      │ │  .js         │  │    │   │
│  │  │  │            │ │ 7 exports │ │ PDF/DOCX/    │  │    │   │
│  │  │  │ Claude API │ │ pure fns  │ │ XLSX/TXT     │  │    │   │
│  │  │  │ (fetch)    │ │ no API    │ │ in-browser   │  │    │   │
│  │  │  └─────┬──────┘ └───────────┘ └──────────────┘  │    │   │
│  │  └────────┼────────────────────────────────────────┘    │   │
│  └───────────┼──────────────────────────────────────────────┘   │
│              │ HTTPS / fetch                                     │
└──────────────┼───────────────────────────────────────────────────┘
               │
               ▼
   ┌───────────────────────┐
   │   api.anthropic.com   │
   │   Claude Sonnet 4     │
   │   (claude-sonnet-4-   │
   │    20250514)          │
   └───────────────────────┘

   No other external services. No backend. No database.
   The API key lives only in Zustand memory — never persisted to disk.
```

---

## AI Architecture

Four distinct AI call patterns, each with a purpose-built system prompt:

```
  callClaudeAPI()              — Underwriting risk assessment
  ┌───────────────────────────────────────────────────────┐
  │ System prompt layers (stacked in order):              │
  │  1. Base underwriting instructions + JSON schema      │
  │  2. Risk score calibration thresholds                 │
  │  3. Protected class prohibition (STRICT)              │
  │  4. Active carrier appetite grid + custom rules       │
  │  5. State compliance rules (GI, prohibited factors)   │
  │                                                       │
  │ Input:  raw submission text (any format, post-parse)  │
  │ Output: structured JSON (17 fields, strict schema)    │
  │ Tokens: max 2048 output                               │
  │ Retry:  once on failure (2s delay)                    │
  └───────────────────────────────────────────────────────┘

  analyzeGroupCensus()         — Census aggregate analysis
  ┌───────────────────────────────────────────────────────┐
  │ Receives: group-level aggregate stats ONLY            │
  │ (no individual employee records — HIPAA intentional)  │
  │ Output: risk observations + recommended actions       │
  │ Tokens: max 1024 output                               │
  └───────────────────────────────────────────────────────┘

  callAssistantAPI()           — AI Copilot (conversational)
  ┌───────────────────────────────────────────────────────┐
  │ System prompt includes live app state snapshot:       │
  │  • current user, role, carrier                        │
  │  • submission counts by status                        │
  │  • last 5 submissions (summary only)                  │
  │  • navigation hint instructions                       │
  │ Maintains full conversation history                   │
  │ Tokens: max 1024 output                               │
  └───────────────────────────────────────────────────────┘

  testConnection()             — API key validation ping
  ┌───────────────────────────────────────────────────────┐
  │ Minimal request (10 token output)                     │
  │ Returns: { success, ms, error? }                      │
  └───────────────────────────────────────────────────────┘
```

**AI Output Schema (Risk Assessment):**

```json
{
  "extractedData": {
    "employerName": "string",
    "industry": "string",
    "state": "2-letter code",
    "employeeCount": "number",
    "annualRevenue": "string",
    "yearsInBusiness": "number",
    "coverageRequested": ["Life", "Health", "Disability"],
    "priorClaims": "boolean",
    "claimDetails": "string",
    "businessEntityType": "string",
    "additionalRiskFactors": ["string"]
  },
  "dataCompleteness": 0.91,
  "riskScore": 28,
  "subScores": {
    "liabilityRisk": 22,
    "financialStability": 30,
    "claimsHistory": 10,
    "industryRisk": 25
  },
  "recommendation": "APPROVE",
  "confidenceLevel": 91,
  "reasoningPoints": ["3–5 specific bullets from this submission's data"],
  "missingInfoFlags": ["list of important missing fields"],
  "suggestedNextSteps": ["2–3 actionable steps"],
  "adverseActionReason": "plain English for broker (no internal scores)",
  "complianceNotes": ["GI applies", "Community rating required"],
  "carrierAppetiteMatch": "ACCEPTABLE"
}
```

---

## Data Model

```
  CARRIER
  ├── id, name, legalName, naicNumber
  ├── status, contractStart, primaryContact
  ├── submissionCount, confidenceMinimum
  ├── autoApproveThreshold, autoDeclineThreshold
  ├── industryAppetite: { [industry]: 'ACCEPT'|'MARGINAL'|'DECLINE' }
  ├── maxGroupSize: { [industry]: number }
  ├── states: 'ALL' | string[]
  ├── customRules: string (→ injected into AI prompt)
  └── apiEndpoint, ediFormat, deliveryMethod, reportFormat

  SUBMISSION
  ├── id (SUB-YYYY-NNN), carrierId
  ├── employerName, industry, state, employeeCount
  ├── annualRevenue, yearsInBusiness, businessEntityType
  ├── coverageTypes[], requestedEffectiveDate
  ├── brokerName, brokerLicense, brokerEmail
  ├── status: PENDING|PROCESSING|REFERRED|APPROVED|DECLINED
  ├── priority: low|medium|high
  ├── riskScore (0–100), confidenceLevel (0–100)
  ├── recommendation: APPROVE|REFER|DECLINE
  ├── carrierAppetiteMatch: ACCEPTABLE|MARGINAL|OUTSIDE_APPETITE
  ├── subScores: { liabilityRisk, financialStability, claimsHistory, industryRisk }
  ├── reasoning[], missingInfoFlags[], suggestedNextSteps[]
  ├── priorClaims, claimsCount, claimsTotal
  ├── adverseActionDeadline (ISO date), adverseActionSent
  ├── dataCompleteness (0–1)
  ├── lowConfidenceFlag
  └── messages[] (AI copilot conversation history per submission)

  EOI (Evidence of Insurability)
  ├── id (EOI-YYYY-NNN), submissionId
  ├── employeeName, coverageType, requestedAmount, giAmount
  ├── status: PENDING|IN_REVIEW|PENDING_INFO|APPROVED|DECLINED
  └── submittedAt, reviewedAt, reviewedBy, notes

  ENROLLMENT
  ├── id, carrierId, groupName, effectiveDate
  ├── status: Active|Pending Start|Terminated
  ├── employeeCount, enrolledCount, participationRate
  └── coverageTypes[], premiumAmount, censusFile

  STATE_RULES (per state)
  ├── stateName, smallGroupLimit, guaranteedIssue
  ├── guaranteedIssueUpTo, communityRatingRequired
  ├── autoDeclinePermitted, autoDeclineConditions
  ├── adverseActionNoticeDays, adverseActionNoticeFormat
  ├── adverseActionRequiredLanguage, regulatoryReference
  ├── prohibitedRiskFactors[]
  ├── specialRequirements[]
  ├── filingRequirements, continuanceRequired, continuanceDays
  └── insuranceDepartmentName, insuranceDepartmentWebsite
```

---

## Application Routes

```
  /                          → redirect to /submissions
  /submissions               → All Submissions (list + filter)
  /submissions/new           → New Submission (paste / upload)
  /submissions/pending       → Pending Review queue
  /submissions/archive       → Decisions Archive
  /submissions/:id           → Submission Detail (full AI assessment)
  /underwriting/queue        → Underwriting Queue (prioritised)
  /underwriting/risk         → Risk Assessment workspace
  /underwriting/eoi          → EOI Management
  /enrollment/active         → Active Enrollments
  /enrollment/portal         → Employee Portal preview
  /enrollment/census         → Census Upload + AI analysis
  /analytics/portfolio       → Portfolio Dashboard (charts)
  /analytics/performance     → AI Model Performance metrics
  /analytics/audit           → Audit Log
  /settings                  → redirect to /settings/profile
  /settings/profile          → User Profile
  /settings/preferences      → App Preferences
  /settings/notifications    → Notification Settings
  /settings/security         → Security (2FA, sessions, API tokens)
  /settings/team             → Team & Access (members, roles, SSO, API keys)
  /settings/billing          → Billing & Plan
  /settings/carrier          → Carrier Configuration
  /settings/ai               → AI Settings (model, prompt, key)
  /settings/compliance       → Compliance Rules (toggle, add, delete)
  /settings/states           → State Guidelines (51 states)
```

---

## Tech Stack

```
  Layer           Technology              Why
  ─────────────── ─────────────────────── ──────────────────────────────────
  Framework       React 18 + Vite 5       Fast HMR, modern bundling
  Styling         Tailwind CSS 3          CSS variable design tokens, dark mode
  Routing         React Router v6         Nested layouts, two-shell architecture
  State           Zustand                 Simple, no boilerplate, persists in memory
  UI Primitives   Radix UI                Accessible, unstyled, composable
  Charts          Recharts                Responsive, composable chart primitives
  Icons           Lucide React            Consistent 24px icon set
  Toasts          Sonner                  Non-blocking feedback
  AI              Anthropic Claude API    claude-sonnet-4-20250514
  PDF Parsing     pdfjs-dist              Mozilla's battle-tested PDF renderer
  Word Parsing    mammoth.js              DOCX → plain text, in-browser
  Excel Parsing   SheetJS (xlsx)          XLS/XLSX → JSON, in-browser
  Deployment      Vercel                  Zero-config, SPA routing, CDN
```

---

## Project Structure

```
uniblox/
├── public/
│   └── favicon.ico
│
├── src/
│   ├── engine/                 Core logic — no UI
│   │   ├── ai.js               All Claude API calls (4 functions)
│   │   ├── compliance.js       State insurance rule enforcement (7 functions)
│   │   └── fileParser.js       Browser-side PDF/DOCX/XLSX/TXT parsing
│   │
│   ├── store/
│   │   ├── useAppStore.js      Zustand store — single source of truth
│   │   └── sampleData.js       Seed data: carriers, submissions, state rules
│   │
│   ├── components/
│   │   ├── layout/             Shell components
│   │   │   ├── AppShell.jsx        Main app shell (sidebar + topnav + outlet)
│   │   │   ├── Sidebar.jsx         Collapsible navigation sidebar
│   │   │   ├── TopNav.jsx          Sticky top bar (AI, What's New, notifs, avatar)
│   │   │   ├── SettingsShell.jsx   Settings-specific shell (own sidebar nav)
│   │   │   ├── AIAssistantPanel.jsx Copilot slide-in panel (right)
│   │   │   ├── DocsSupportPanel.jsx Docs & support slide-in panel
│   │   │   └── WhatsNewPanel.jsx   Product changelog slide-in panel
│   │   │
│   │   ├── shared/             Reusable page-level components
│   │   │   ├── PageHeader.jsx      Title + subtitle + actions row
│   │   │   ├── Banner.jsx          Info / warning / error banners
│   │   │   ├── KPICard.jsx         Metric card with trend indicator
│   │   │   ├── RiskScore.jsx       Risk score ring/bar component
│   │   │   └── ErrorBoundary.jsx   React error boundary
│   │   │
│   │   └── ui/                 Design system primitives
│   │       ├── button.jsx          Variants: default, secondary, destructive, ghost
│   │       ├── badge.jsx           StatusBadge + Badge (colored tags)
│   │       ├── input.jsx           Input, Textarea, Select, FormGroup
│   │       ├── card.jsx            Surface card wrapper
│   │       ├── dialog.jsx          Modal dialog (Radix)
│   │       ├── tabs.jsx            Tab navigation (Radix)
│   │       ├── switch.jsx          Toggle switch (Radix)
│   │       ├── slider.jsx          Range slider (Radix)
│   │       ├── checkbox.jsx        Checkbox (Radix)
│   │       ├── progress.jsx        Progress bar
│   │       └── tooltip.jsx         Tooltip (Radix)
│   │
│   ├── pages/                  One file per route (24 pages)
│   │   ├── Submissions.jsx
│   │   ├── NewSubmission.jsx       File upload + AI analysis trigger
│   │   ├── SubmissionDetail.jsx    Full AI assessment + copilot
│   │   ├── PendingReview.jsx
│   │   ├── DecisionsArchive.jsx
│   │   ├── UnderwritingQueue.jsx
│   │   ├── RiskAssessment.jsx
│   │   ├── EOIManagement.jsx
│   │   ├── ActiveEnrollments.jsx
│   │   ├── EmployeePortal.jsx
│   │   ├── CensusUpload.jsx
│   │   ├── PortfolioDashboard.jsx
│   │   ├── ModelPerformance.jsx
│   │   ├── AuditLog.jsx
│   │   ├── Profile.jsx
│   │   ├── Preferences.jsx
│   │   ├── Notifications.jsx
│   │   ├── Security.jsx
│   │   ├── TeamAccess.jsx          Members + roles modal + SSO + API keys
│   │   ├── Billing.jsx
│   │   ├── CarrierConfig.jsx       Full carrier CRUD + appetite grid
│   │   ├── AISettings.jsx          Live prompt editor + key management
│   │   ├── ComplianceRules.jsx     Toggle / add / delete rules
│   │   └── StateGuidelines.jsx     51-state regulatory reference
│   │
│   ├── App.jsx                 Router config + route tree
│   ├── main.jsx                React root mount
│   └── index.css               Tailwind directives + CSS design tokens
│
├── package.json
├── vite.config.js
└── tailwind.config.js
```

---

## Design System

Uniblox uses a CSS variable token system that powers both light and dark mode. All colors are referenced semantically — components never hardcode hex values.

```css
  /* Surface tokens */
  --surface-primary     /* main card / panel background */
  --surface-secondary   /* page background, sidebar */
  --surface-hover       /* hover states */

  /* Ink (text) tokens */
  --ink-primary         /* headings, primary labels */
  --ink-secondary       /* body text, descriptions */
  --ink-tertiary        /* placeholders, timestamps */

  /* Semantic color tokens */
  --brand               /* primary blue — CTAs, active states */
  --brand-light         /* tinted blue — selected rows, highlights */
  --positive            /* green — approvals, success */
  --positive-light      /* tinted green — success backgrounds */
  --caution             /* amber — warnings, pending */
  --caution-light       /* tinted amber — warning backgrounds */
  --destructive         /* red — declines, errors, danger */
  --destructive-light   /* tinted red — error backgrounds */
  --line                /* border color */
```

---

## Key Architectural Decisions

### 1. Compliance Runs Before AI
State regulations are checked synchronously (zero latency) before every API call. The compliance engine then injects the applicable rules into the Claude system prompt. If the AI recommendation violates a law (e.g., declining a guaranteed-issue small group), `validateAIRecommendation()` overrides it before the result is ever shown to the underwriter.

### 2. Two Layout Shells
Settings use a dedicated `SettingsShell` (no sidebar, dedicated nav tree) while all operational pages use `AppShell`. This mirrors the UX pattern used by Stripe, Linear, and GitHub — settings feel categorically different from workflow.

### 3. One Vocabulary Contract
The carrier's industry appetite grid stores raw values (`ACCEPT / MARGINAL / DECLINE`). The Claude AI schema outputs `ACCEPTABLE / MARGINAL / OUTSIDE_APPETITE`. `checkCarrierAppetite()` normalizes at the boundary. Every component and every AI prompt speaks the same language.

### 4. No Backend, No Upload
File parsing (PDF via pdfjs-dist, Word via mammoth.js, Excel via SheetJS) runs entirely in the browser. Only the Claude API call leaves the machine. The API key lives only in Zustand memory — it is never written to `localStorage`, `sessionStorage`, or cookies.

### 5. Census Privacy by Design
`analyzeGroupCensus()` receives only aggregate statistics (averages, totals, distributions) — never individual employee records. Individual PII never leaves the browser, which keeps the prototype HIPAA-adjacent by design.

---

## Getting Started

### Prerequisites
- Node.js 18+
- An [Anthropic API key](https://console.anthropic.com) (for live AI features)

### Run locally

```bash
git clone https://github.com/mdskmohan/Uniblox.git
cd Uniblox
npm install
npm run dev
# → http://localhost:5173
```

### Build for production

```bash
npm run build       # output → dist/
npm run preview     # serve dist/ locally at :4173
```

### Connect the AI

1. Open the app → click your avatar (top-right) → **Settings**
2. Navigate to **AI Settings**
3. Paste your Anthropic API key → **Save Key**
4. Click **Test Connection** — should confirm the model and latency
5. All underwriting analyses, census AI, and the AI Assistant are now live

> The key lives in browser memory only. It is never written anywhere. Refreshing the page clears it.

---

## Is This Production-Ready?

**What is production-quality:**
- Full underwriting workflow, end-to-end, with real Claude API calls
- Compliance engine is a faithful implementation of real state insurance rules
- Role-based access, permission system, audit log — all architecturally sound
- UI/UX is polished to a commercial standard — dark mode, responsive, accessible
- Error handling, retry logic, loading states, empty states — throughout

**What would need to be added before real launch:**
- A backend API and database (submissions, carriers, users persist in memory today)
- Auth (JWT/session-based, currently simulated with a hardcoded user)
- True audit log immutability (append-only table, tamper-evident)
- HIPAA Business Associate Agreement with Anthropic before processing real PHI
- Rate limiting, API key rotation, and key storage in a secrets manager
- State rules expanded to all 51 states (full detail currently covers 10 states)
- Penetration testing and SOC 2 readiness

**Summary:** This is a **high-fidelity, fully interactive prototype** that demonstrates every major workflow at commercial quality. It is ready to show to investors, design partners, and enterprise prospects. The architecture is production-aligned — the main gap is a backend and auth layer.

---

## Screenshots

The app ships with realistic seed data across multiple carriers, submissions, EOIs, and enrollments — no setup needed to explore the full workflow.

```
  New Submission → Upload PDF / paste text → AI scores in ~5 seconds
  Submission Detail → Full risk breakdown, sub-scores, compliance notes, copilot
  Underwriting Queue → Sorted by priority, risk, and adverse action deadlines
  Carrier Config → Full appetite grid, state toggles, automation thresholds
  Team & Access → Role cards with permission modal, custom roles, invite flow
  State Guidelines → All 51 states, searchable, full regulatory detail for 10
  Audit Log → Every decision, immutable, exportable
  AI Assistant → Context-aware copilot, knows your queue live
```

---

## License

MIT — see `LICENSE`

---

*All carrier names, submission data, and employee records are synthetic and used for demonstration purposes only. No real insurance decisions are made by this software.*
