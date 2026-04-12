# Uniblox — Smarter Group Benefits, Faster Decisions

> **Prototype** — A fully functional front-end demo of an AI-assisted group insurance underwriting platform. No backend required; all data runs in-browser.

---

## What is this?

Uniblox helps insurance carriers and MGAs decide whether to insure a group of employees — faster, more consistently, and with full regulatory compliance.

Today, when a company wants to offer health, life, or disability benefits to its employees, it submits an application to an insurance carrier. An underwriter (a human expert) reads through the details — the industry, company size, employee demographics, coverage requested — and makes a decision: approve it, decline it, or refer it for more review.

This process is slow (can take days), inconsistent (depends on which underwriter you get), and hard to audit.

**This prototype shows what that process looks like when AI does the heavy lifting.** An underwriter pastes or uploads the broker submission, and within seconds gets a structured risk score, a compliance check, a recommendation (approve / decline / refer), and a full explanation — all powered by Claude AI.

---

## What the prototype covers

| Module | What it does |
|--------|-------------|
| **New Submission** | Paste text or upload a PDF/Word/Excel broker submission. AI scores the risk (0–100), flags compliance issues, and gives a recommendation with reasoning. |
| **Submission Detail** | Full AI assessment breakdown — risk sub-scores, confidence level, carrier appetite check, compliance notes, and an AI copilot for follow-up questions. |
| **Underwriting Queue** | Prioritised list of submissions needing a human decision, sorted by risk and urgency. |
| **EOI Management** | Evidence of Insurability workflow — for employees who want more life insurance than the guaranteed amount. PHI-aware with full audit trail. |
| **Carrier Configuration** | Per-carrier industry appetite grid, GI limits, auto-approve/decline thresholds, and custom underwriting rules injected into the AI prompt. |
| **Active Enrollments** | Track enrolled groups, participation rates, and census data. |
| **Employee Portal Preview** | Shows what the enrollment experience looks like from an employee's perspective. |
| **Census Upload** | Upload an employee census file; AI analyses the aggregate demographics and flags risks. |
| **Portfolio Dashboard** | Charts showing approval rates, industry concentration, risk score distribution, and 12-month decision trends. |
| **Model Performance** | AI accuracy metrics, calibration curves, and confidence analysis. |
| **Audit Log** | Immutable, exportable log of every AI decision, human override, and compliance action — 7-year retention per regulation. |
| **Compliance Engine** | Client-side enforcement of state insurance regulations (guaranteed issue, community rating, adverse action deadlines) — no API call needed. |
| **AI Assistant** | Copilot-style chat (✦ icon in the top nav) that understands your live queue and can answer questions, draft communications, and navigate the app. |

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React 18 + Vite 5 |
| Styling | Tailwind CSS 3 (CSS variable design tokens, dark mode) |
| Routing | React Router v6 |
| State | Zustand |
| UI Primitives | Radix UI |
| Charts | Recharts |
| AI | Anthropic Claude API (direct browser) |
| File Parsing | pdfjs-dist, mammoth, SheetJS (all in-browser) |

---

## Getting Started

### Prerequisites

- Node.js 18+

### Install and run

```bash
git clone https://github.com/mdskmohan/Uniblox.git
cd Uniblox
npm install
npm run dev
# → http://localhost:5173
```

### Build for production

```bash
npm run build
npm run preview
```

---

## AI Features Setup

1. Go to **Settings → AI Model Settings** (click your avatar top-right → Settings)
2. Paste your API key into **AI API Key** and click **Save**
3. Click **Test Connection** to verify

> The key lives in browser memory only — it is never written to localStorage or sent anywhere except `api.anthropic.com`. Refreshing the page clears it.

---

## Project Structure

```
src/
├── engine/
│   ├── ai.js           # All Claude API calls (risk assessment, copilot, census, ping)
│   ├── compliance.js   # State insurance rules enforced as pure JS (no API needed)
│   └── fileParser.js   # Browser-side file parsing (PDF, Word, Excel, CSV, TXT)
│
├── store/
│   ├── useAppStore.js  # Zustand global store — single source of truth
│   └── sampleData.js   # Seed data: carriers, submissions, EOIs, enrollments
│
├── components/
│   ├── layout/         # AppShell, Sidebar, TopNav, SettingsShell, AI panel
│   ├── shared/         # PageHeader, Banner, KPICard, RiskScore, ErrorBoundary
│   └── ui/             # Button, Badge, Input, Dialog, Tabs, Switch, Card, etc.
│
├── pages/              # One file per route (21 pages total)
└── index.css           # Tailwind directives + CSS design tokens
```

---

## Key Design Decisions

**Compliance runs before AI** — `compliance.js` checks state regulations (guaranteed issue, community rating, prohibited risk factors) instantly on every interaction. The AI system prompt is then injected with the applicable state rules so its recommendation already accounts for them.

**One vocabulary** — The carrier's appetite grid stores raw values (`ACCEPT / DECLINE`). The AI returns `ACCEPTABLE / OUTSIDE_APPETITE`. `checkCarrierAppetite()` normalises at the source so the UI only ever sees one set of values.

**Two layout shells** — Settings use a separate `SettingsShell` (no sidebar, own nav) while operational pages use `AppShell`. This matches the Stripe / Linear / GitHub pattern — settings feel distinct from the main workflow.

**No backend needed** — File parsing (PDF, Word, Excel) runs entirely in the browser. The only external call is to the Anthropic API. Everything else is local state.

---

*All carrier names, submission data, and employee records are synthetic and for demonstration purposes only.*
