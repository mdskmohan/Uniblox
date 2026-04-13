# Uniblox — AI-Native Group Insurance Underwriting Platform

> **Live Prototype →** [uniblox-dun.vercel.app](https://uniblox-dun.vercel.app?_vercel_share=IEDe2H0uBR236PuVWpEoDzqOZhs8TJDr)
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
│   │   ├── fileParser.js       Browser-side PDF/DOCX/XLSX/TXT parsing
│   │   └── guardrails.js       AI safety layer — input sanitization, output validation, confidence floor
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

## AI Guardrails

Uniblox treats AI safety as an engineering problem, not a policy problem. Guardrails are implemented in code (`src/engine/guardrails.js`) and run on every underwriting call — they cannot be bypassed by a clever prompt or a model hallucination.

### The Guardrail Pipeline

```
  Raw submission text (from paste or file)
          │
          ▼
  ┌─────────────────────────────────────────────────────────┐
  │  LAYER 1 — INPUT SANITIZATION (before API call)        │
  │  sanitizeSubmissionInput()                              │
  │                                                         │
  │  ① Length guard                                         │
  │     Max 12,000 chars (~3,000 tokens)                    │
  │     Truncated text gets a visible notice appended       │
  │                                                         │
  │  ② Prompt injection detection                           │
  │     Scans for: "ignore previous instructions",          │
  │     "you are now", "new instructions:", "[INST]",       │
  │     "jailbreak", "DAN mode", ChatML injection, etc.     │
  │     Matched text → replaced with [CONTENT REMOVED]      │
  │     Flag surfaced to underwriter in the UI              │
  │                                                         │
  │  ③ PII detection (flag, not strip)                      │
  │     Detects: SSN (XXX-XX-XXXX), DOB (MM/DD/YYYY),       │
  │     credit card numbers, bank routing numbers           │
  │     Flagged with type so underwriter can review         │
  │     PII is not used in scoring (prompt instruction)     │
  │                                                         │
  │  ④ Protected class keyword detection                    │
  │     Flags: race, ethnicity, nationality, religion,      │
  │     sex, gender, pregnancy, disability, genetic, etc.   │
  │     These are called out to the model explicitly        │
  │     as prohibited factors                               │
  └──────────────────────┬──────────────────────────────────┘
                         │ sanitized text
                         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  LAYER 2 — SYSTEM PROMPT GUARDRAILS (inside the call)  │
  │  buildSystemPrompt() in ai.js                           │
  │                                                         │
  │  ① Protected class prohibition (hardcoded)              │
  │     "NEVER use: race, color, national origin, sex,      │
  │      age, disability, genetic information"              │
  │                                                         │
  │  ② Advisory-only framing                                │
  │     "You are ADVISORY ONLY — all final decisions        │
  │      are made by human underwriters"                    │
  │                                                         │
  │  ③ Confidence floor instruction                         │
  │     "If confidence < 60%, always recommend REFER"       │
  │                                                         │
  │  ④ State compliance rules injected                      │
  │     GI laws, prohibited factors, notice deadlines       │
  │     specific to the submission's state                  │
  │                                                         │
  │  ⑤ No internal scores in adverse action reason          │
  │     "adverseActionReason: plain English for broker,     │
  │      no internal scores"                                │
  └──────────────────────┬──────────────────────────────────┘
                         │ Claude response (raw JSON)
                         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  LAYER 3 — OUTPUT VALIDATION (after API response)      │
  │  validateUnderwritingOutput()                           │
  │                                                         │
  │  ① Required field presence check                        │
  │     riskScore, recommendation, confidenceLevel,         │
  │     reasoningPoints, extractedData, subScores,          │
  │     carrierAppetiteMatch — all must exist               │
  │                                                         │
  │  ② riskScore: clamp to 0–100, force integer             │
  │  ③ recommendation: must be APPROVE|REFER|DECLINE        │
  │     → defaults to REFER if invalid                      │
  │  ④ confidenceLevel: clamp to 0–100                      │
  │  ⑤ subScores: all 4 dimensions validated, range-clamped │
  │  ⑥ carrierAppetiteMatch: enum validation                 │
  │  ⑦ Arrays that must be arrays (reasoningPoints, etc.)   │
  │  ⑧ dataCompleteness: clamp to 0.0–1.0                   │
  └──────────────────────┬──────────────────────────────────┘
                         │ validated JSON
                         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  LAYER 4 — COMPLIANCE OVERRIDE (law beats the model)   │
  │  validateAIRecommendation() in compliance.js            │
  │                                                         │
  │  If AI says DECLINE AND guaranteed issue applies:       │
  │  → Force to REFER, log override reason + statute        │
  │  ERISA self-funded plans: state rules preempted         │
  └──────────────────────┬──────────────────────────────────┘
                         │
                         ▼
  ┌─────────────────────────────────────────────────────────┐
  │  LAYER 5 — CONFIDENCE FLOOR (code, not just prompt)    │
  │  applyConfidenceFloor()                                 │
  │                                                         │
  │  If confidenceLevel < 60 AND recommendation ≠ REFER:   │
  │  → Force to REFER                                       │
  │  → Append override note to complianceNotes             │
  │  Note: relying on a prompt instruction alone for a      │
  │  safety override is not sufficient. Code always wins.  │
  └──────────────────────┬──────────────────────────────────┘
                         │ final result + _guardrails metadata
                         ▼
                   Application / UI
```

### Guardrail Metadata

Every `callClaudeAPI()` response includes a `_guardrails` field so the UI can surface warnings to the underwriter:

```javascript
result._guardrails = {
  version:                   '1.0.0',
  inputFlags:                [],        // warnings from input sanitization
  outputIssues:              [],        // schema normalization notes
  confidenceOverride:        false,     // true if confidence floor fired
  confidenceOverrideReason:  null,
  inputTruncated:            false,
  piiDetected:               false,
  piiTypes:                  [],        // e.g. ['SSN', 'DOB']
  injectionDetected:         false,
  protectedClassFound:       false,
}
```

### What Each Guardrail Prevents

| Guardrail | Attack / Failure It Prevents |
|-----------|------------------------------|
| Prompt injection filter | Broker embeds "ignore all previous instructions" in their PDF |
| PII detection | SSNs / DOBs in a submission text reaching the model as scoring inputs |
| Protected class detection | Racial or disability language in a submission influencing the risk score |
| Input length limit | Submission engineered to overflow the context window and distort output |
| Output schema validation | Model hallucinating extra fields or returning out-of-range scores |
| Confidence floor (code) | Model says APPROVE at 45% confidence — blocked regardless of prompt |
| GI compliance override | Model recommends DECLINE for a guaranteed-issue small group |
| ERISA preemption | State GI rules incorrectly applied to self-funded federal plans |
| Advisory-only framing | Model claiming to make a binding decision |
| No scores in adverse notice | Internal scoring model leaked to brokers via adverse action letter |

---

## Prototype → Production Roadmap

This section maps the delta between today's prototype and a production-grade system. Written as a phased delivery plan a technical team could execute.

```
  PROTOTYPE TODAY                   PRODUCTION TARGET
  ─────────────────────────────     ──────────────────────────────────
  In-memory Zustand state     →     PostgreSQL + REST API
  Hardcoded user (John Doe)   →     Auth (JWT, MFA, SSO/SAML)
  No persistence              →     Data survives sessions / users
  Client-only API key         →     Server-side key proxy
  10 state rules (full)       →     51 states (full)
  No email / notifications    →     Real email (adverse action notices)
  Manual audit log            →     Immutable append-only audit table
  Single tenant               →     Multi-tenant with org isolation
```

### Phase 1 — Foundation (Weeks 1–6)
*Goal: real data persistence, real auth, secure AI proxy*

```
  ┌─────────────────────────────────────────────────────────┐
  │  Backend API (Node/Express or Next.js API routes)       │
  │  ├── POST /api/submissions       create + store         │
  │  ├── GET  /api/submissions/:id   fetch with RBAC check  │
  │  ├── POST /api/carriers          CRUD                   │
  │  ├── POST /api/audit             append-only log entry  │
  │  └── POST /api/ai/analyze        proxy → Anthropic API  │
  │       ↑ API key never touches the browser in production │
  │                                                         │
  │  Database (PostgreSQL / Supabase)                       │
  │  ├── carriers          (NAIC, appetite, thresholds)     │
  │  ├── submissions       (all fields, immutable history)  │
  │  ├── decisions         (separate table, append-only)    │
  │  ├── eois              (PHI-adjacent, encrypted at rest) │
  │  ├── enrollments                                        │
  │  ├── audit_log         (insert-only, signed rows)       │
  │  ├── users             (hashed passwords, MFA secrets)  │
  │  └── roles_permissions (custom role definitions)       │
  │                                                         │
  │  Auth                                                   │
  │  ├── Email + password with bcrypt                       │
  │  ├── TOTP-based MFA (already shown in Security UI)      │
  │  ├── Session tokens (httpOnly cookies)                  │
  │  └── SAML/SSO (already wired in Team & Access UI)       │
  └─────────────────────────────────────────────────────────┘
```

**Key decisions at this phase:**
- Move the Anthropic API key to the server. It should never be in a browser in production.
- Add row-level security (RLS) in PostgreSQL so users only see their own org's data.
- Replace `console.warn` guardrail logging with structured server-side logs.

---

### Phase 2 — Production AI Hardening (Weeks 7–10)
*Goal: full guardrails, monitoring, HIPAA readiness*

```
  ┌─────────────────────────────────────────────────────────┐
  │  Guardrail enhancements                                 │
  │  ├── Rate limiting per user (max N analyses/hour)       │
  │  ├── Input PII scrubber with redaction (not just flag)  │
  │  ├── Output drift monitor (alert if avg score shifts)   │
  │  ├── Human review sampling (5% of AI decisions audited) │
  │  └── Expand state rules to all 51 states                │
  │                                                         │
  │  Observability                                          │
  │  ├── Structured logging (every AI call: input hash,     │
  │  │   output, guardrail events, latency, model version)  │
  │  ├── Dashboards: recommendation distribution,           │
  │  │   override rates, guardrail trigger frequency        │
  │  └── Alerting: spike in DECLINE rate, confidence drop   │
  │                                                         │
  │  HIPAA Readiness                                        │
  │  ├── Sign BAA with Anthropic (enterprise agreement)     │
  │  ├── EOI data encrypted at rest (AES-256)               │
  │  ├── PHI access logs separate from general audit log    │
  │  └── Data retention policy (7 years per NAIC model law) │
  └─────────────────────────────────────────────────────────┘
```

---

### Phase 3 — Agentic Workflows (Weeks 11–16)
*Goal: autonomous processing for routine submissions — see Agentic Architecture below*

---

### Phase 4 — Enterprise & Scale (Post-launch)
*Goal: multi-carrier SaaS, marketplace, advanced AI*

```
  ┌─────────────────────────────────────────────────────────┐
  │  Multi-tenancy                                          │
  │  ├── Org-level data isolation                           │
  │  ├── Per-org carrier configurations                     │
  │  ├── White-label option for MGAs                        │
  │  └── Usage-based billing (per decision, per carrier)    │
  │                                                         │
  │  Advanced AI                                            │
  │  ├── Fine-tuned model on historical decisions           │
  │  ├── Carrier-specific model calibration                 │
  │  ├── Continuous learning from human overrides           │
  │  └── Predictive renewal risk (not just new business)    │
  │                                                         │
  │  Integrations                                           │
  │  ├── Carrier systems (EDI 834/835 via existing config)  │
  │  ├── Broker portals (API submission intake)             │
  │  ├── AMS360 / BenefitPoint / Agency Zoom               │
  │  └── DocuSign / HelloSign for EOI collection            │
  └─────────────────────────────────────────────────────────┘
```

---

## Future State: Agentic Architecture

Today, every AI action in Uniblox is a single-shot call — the model receives input, returns structured output, and stops. A human makes every decision and takes every action.

The next evolution is **agentic AI**: systems that reason across multiple steps, use tools, take actions, and loop until a task is complete — with humans approving key checkpoints rather than doing all the work.

### What an Agent Is (vs. What We Have Today)

```
  TODAY — Single-shot LLM calls
  ─────────────────────────────
  Input → [Claude] → Output
  One call. Human reads result. Human acts.

  FUTURE — Agentic loop
  ──────────────────────────────────────────────────────
  Goal → [Agent reasons] → picks tool → tool runs
           ↑                                  │
           └──── observes result ─────────────┘
                       │
              [Agent reasons again]
                       │
              task complete OR escalate to human
```

### The Three Agentic Workflows for Uniblox

#### Agent 1 — Submission Intake Agent
*Handles routine, low-risk submissions end-to-end without human intervention*

```
  TRIGGER: New submission arrives (broker portal, email, API)
  │
  ▼
  [Agent: Intake]
  Tools available:
  ├── parse_document(file)         → extract text from PDF/DOCX/XLSX
  ├── check_completeness(data)     → identify missing fields
  ├── request_missing_info(email)  → email broker for what's missing
  ├── run_compliance_check(sub)    → compliance.js (already exists)
  └── run_ai_assessment(sub)       → callClaudeAPI (already exists)
  │
  ▼
  Decision tree:
  ├── Risk score ≤ 35 + confidence ≥ 80 + GI check pass
  │     → AUTO-APPROVE: issue quote, notify broker, log decision
  │
  ├── Risk score ≥ 75 + confidence ≥ 80 + no GI conflict
  │     → AUTO-DECLINE: generate adverse action notice, send to broker
  │
  └── Everything else (score 36–74, or confidence < 80)
        → REFER: assign to underwriter queue with full AI context

  Human checkpoint: underwriter reviews all REFER cases.
  Human override: available on any auto-approved or auto-declined case.
```

#### Agent 2 — Missing Information Agent
*Proactively resolves incomplete submissions without underwriter involvement*

```
  TRIGGER: Submission has missingInfoFlags.length > 0
  │
  ▼
  [Agent: Missing Info]
  Tools available:
  ├── identify_gaps(assessment)     → list of missing fields + why they matter
  ├── draft_broker_request(gaps)    → generate polite, specific info request
  ├── send_email(broker, message)   → send via email provider
  ├── set_deadline(days)            → flag submission for follow-up in N days
  ├── receive_response(email)       → parse broker reply for new data
  └── re_run_assessment(sub)        → updated analysis with new data
  │
  ▼
  Loop: re-run until either:
  ├── dataCompleteness ≥ 0.85 → proceed to decision
  └── deadline exceeded       → escalate to underwriter with full history

  Human checkpoint: underwriter handles all deadline-exceeded cases.
  Audit trail: every email sent/received logged with timestamps.
```

#### Agent 3 — Adverse Action Agent
*Monitors deadlines and generates/delivers compliant notices automatically*

```
  TRIGGER: Scheduled check (runs daily)
  │
  ▼
  [Agent: Adverse Action Monitor]
  Tools available:
  ├── get_pending_notices()          → all declined submissions with no notice sent
  ├── check_deadline(sub)            → days remaining per state rules
  ├── generate_notice(sub, reasons)  → compliance.js (already exists)
  ├── send_notice(broker, notice)    → email/certified mail integration
  └── mark_notice_sent(sub_id)       → update submission record
  │
  ▼
  Escalation rules:
  ├── > 5 days remaining → schedule automatically
  ├── 2–5 days remaining → notify underwriter to review before sending
  └── < 2 days remaining → emergency alert to compliance officer

  Human checkpoint: compliance officer approves notices with < 5 days remaining.
  Regulatory requirement: adverse action notices are legally required documents.
```

### Agentic Architecture Design

```
  ┌──────────────────────────────────────────────────────────────┐
  │                    ORCHESTRATION LAYER                        │
  │  Agent Router — decides which agent handles an incoming event │
  └──────────┬───────────────────┬──────────────────────────────┘
             │                   │
  ┌──────────▼────────┐ ┌────────▼──────────────────────────────┐
  │   Agent Runtime   │ │          Tool Registry                 │
  │                   │ │                                        │
  │  • Reasoning loop │ │  parse_document()  → fileParser.js     │
  │  • Context window │ │  run_compliance()  → compliance.js     │
  │  • Tool calling   │ │  run_assessment()  → ai.js             │
  │  • Step logging   │ │  send_email()      → email provider    │
  │  • Max step limit │ │  query_db()        → backend API       │
  │    (prevents inf. │ │  update_record()   → backend API       │
  │     loops)        │ │  escalate_human()  → notification svc  │
  └──────────┬────────┘ └───────────────────────────────────────┘
             │
  ┌──────────▼──────────────────────────────────────────────────┐
  │                  HUMAN-IN-THE-LOOP GATES                     │
  │                                                              │
  │  Every agent has defined escalation conditions:              │
  │  • Confidence below threshold → mandatory human review       │
  │  • Legal document (adverse action notice) → human approval   │
  │  • Amount above auto-approve threshold → queue for UW        │
  │  • Agent stuck (3+ failed tool calls) → escalate immediately │
  │  • Max steps reached without resolution → escalate           │
  │                                                              │
  │  Principle: agents handle volume. Humans handle edge cases.  │
  └─────────────────────────────────────────────────────────────┘
```

### Implementation Path for Agents

The prototype already contains most of the tool logic — it just isn't yet wrapped in an agent runtime. Here's what would need to be built:

| What's needed | What we already have | What's missing |
|---------------|---------------------|----------------|
| Document parsing tool | `fileParser.js` — complete | API wrapper |
| Compliance check tool | `compliance.js` — complete | API wrapper |
| AI assessment tool | `callClaudeAPI()` — complete | API wrapper |
| Adverse action notice tool | `generateAdverseActionNotice()` — complete | Email integration |
| Agent reasoning loop | — | Build with Anthropic tool use API |
| Tool call schema | — | Define JSON tool schemas |
| Step logging / audit | Audit log architecture exists | Connect agent steps to it |
| Human escalation gate | Queue + notification UI exists | Connect to agent output |

**Recommended approach:** Use Anthropic's [tool use API](https://docs.anthropic.com/en/docs/build-with-claude/tool-use) to wrap the existing engine functions as tools. The agent reasoning loop is then a `while` loop that calls Claude with available tools, executes whichever tool Claude selects, feeds the result back, and repeats until Claude returns a `stop` response or a gate condition fires.

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
- 5-layer AI guardrail pipeline — prompt injection, PII detection, schema validation, confidence floor, GI compliance override
- Role-based access, permission system, audit log — all architecturally sound
- UI/UX is polished to a commercial standard — dark mode, responsive, accessible
- Error handling, retry logic, loading states, empty states — throughout

**What would need to be added before real launch:**
- A backend API and database (submissions, carriers, users persist in memory today)
- Auth (JWT/session-based, currently simulated with a hardcoded user)
- Server-side API key proxy (key must never be in the browser in production)
- True audit log immutability (append-only table, tamper-evident)
- HIPAA Business Associate Agreement with Anthropic before processing real PHI
- Rate limiting and API key rotation
- State rules expanded to all 51 states (full detail currently covers 10 states)
- Penetration testing and SOC 2 readiness

**Summary:** This is a **high-fidelity, fully interactive prototype** that demonstrates every major workflow at commercial quality. It is ready to show to investors, design partners, and enterprise prospects. The architecture is production-aligned — the main gap is a backend, auth layer, and server-side API proxy.

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
