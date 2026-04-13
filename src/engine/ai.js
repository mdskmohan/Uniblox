/**
 * ai.js
 *
 * Central AI engine for all Claude API calls in Uniblox. This module is the
 * single source of truth for interacting with the Anthropic Claude API from
 * the browser. It intentionally uses the `anthropic-dangerous-direct-browser-access`
 * header, which must be enabled for client-side API access.
 *
 * Exports:
 *  - callClaudeAPI        — underwriting risk-assessment analysis (JSON response)
 *  - analyzeGroupCensus   — aggregate census statistics analysis (JSON response)
 *  - testConnection       — lightweight API ping to verify key + connectivity
 *  - callAssistantAPI     — conversational AI assistant with live app context
 *  - MODEL                — exported model ID constant (used in AISettings for display)
 *
 * Error handling contract:
 *  All exported functions throw `new Error('API_KEY_MISSING')` when no key is
 *  provided, so callers can distinguish auth errors from network errors and show
 *  the appropriate UI (e.g., link to AI Settings vs. generic retry message).
 *
 * Security note:
 *  The API key is stored only in Zustand state (memory) and never written to
 *  localStorage, sessionStorage, or cookies by this module. Key persistence
 *  across sessions is handled by the AI Settings page (opt-in).
 */

import { injectStateRulesIntoPrompt } from './compliance'
import {
  sanitizeSubmissionInput,
  validateUnderwritingOutput,
  applyConfidenceFloor,
  GUARDRAIL_VERSION,
} from './guardrails'

const API_URL = 'https://api.anthropic.com/v1/messages'
const MODEL   = 'claude-sonnet-4-20250514'

// ─── Base system prompt ───────────────────────────────────────────────────────
function buildSystemPrompt(carrier, state) {
  const base = `You are an expert insurance underwriting AI assistant for a B2B insurance underwriting platform.
Your role is to assist human underwriters by analyzing group insurance submissions and providing structured risk assessments.
You are ADVISORY ONLY — all final decisions are made by human underwriters. You never make binding decisions.

RESPONSE FORMAT: Respond ONLY with valid JSON. No markdown, no preamble, no explanation outside the JSON.

RISK SCORING CALIBRATION:
- 0–39: Low risk → recommend APPROVE
- 40–69: Medium risk → recommend REFER (to human underwriter for review)
- 70–100: High risk → recommend DECLINE
- If confidence is below 60%, always recommend REFER regardless of risk score.

PROTECTED CLASS COMPLIANCE:
You must NEVER use the following in your assessment: race, color, national origin, sex, age, disability, genetic information, or any other protected characteristic. Strip these factors from your analysis entirely.

JSON OUTPUT SCHEMA (respond with exactly this structure):
{
  "extractedData": {
    "employerName": "string",
    "industry": "string",
    "state": "string (2-letter abbreviation)",
    "employeeCount": "number or null",
    "annualRevenue": "string or null",
    "yearsInBusiness": "number or null",
    "coverageRequested": ["array of strings"],
    "priorClaims": "boolean or null",
    "claimDetails": "string or null",
    "businessEntityType": "string or null",
    "additionalRiskFactors": ["array of strings"]
  },
  "dataCompleteness": "number 0-1 (fraction of key fields extracted)",
  "riskScore": "integer 0-100",
  "subScores": {
    "liabilityRisk": "integer 0-100",
    "financialStability": "integer 0-100",
    "claimsHistory": "integer 0-100",
    "industryRisk": "integer 0-100"
  },
  "recommendation": "APPROVE | REFER | DECLINE",
  "confidenceLevel": "integer 0-100",
  "reasoningPoints": ["3-5 specific bullet strings based on this submission's actual data"],
  "missingInfoFlags": ["list of important missing fields with why they matter"],
  "suggestedNextSteps": ["2-3 actionable steps based on recommendation"],
  "adverseActionReason": "string or null (plain English for brokers — no internal scores)",
  "complianceNotes": ["list of compliance observations"],
  "carrierAppetiteMatch": "ACCEPTABLE | MARGINAL | OUTSIDE_APPETITE"
}`

  // Inject carrier rules
  const carrierSection = carrier
    ? `\n\n=== ACTIVE CARRIER: ${carrier.name} ===
Auto-Approve Threshold: Risk score ≤ ${carrier.autoApproveThreshold} with confidence ≥ ${carrier.confidenceMinimum}%
Auto-Decline Threshold: Risk score ≥ ${carrier.autoDeclineThreshold}
Industry Appetite: ${JSON.stringify(carrier.industryAppetite, null, 2)}
Custom Underwriting Rules:
${carrier.customRules}
=== END CARRIER RULES ===`
    : ''

  let prompt = base + carrierSection

  // Inject state rules if provided
  if (state) {
    prompt = injectStateRulesIntoPrompt(state, prompt)
  }

  return prompt
}

// ─── callClaudeAPI ────────────────────────────────────────────────────────────
/**
 * Sends a group insurance submission to Claude for structured risk assessment.
 *
 * @param {object}   params
 * @param {string}   params.userMessage  - Raw submission text pasted/uploaded by the underwriter
 * @param {object}   [params.carrier]    - Active carrier object from Zustand store (injects appetite + rules)
 * @param {string}   [params.state]      - 2-letter state abbreviation (injects state compliance rules)
 * @param {string}   params.apiKey       - Claude API key from app settings
 * @param {Function} [params.onStep]     - Progress callback; called with step number (1, 2, 3)
 * @returns {Promise<object>}            - Parsed JSON matching the underwriting output schema
 * @throws {Error}  'API_KEY_MISSING'    - when apiKey is falsy
 * @throws {Error}  'AI returned invalid JSON...' - when response text cannot be parsed
 *
 * Retry logic: on first network/API failure, waits 2s and retries once before
 * surfacing the error to the caller.
 */
export async function callClaudeAPI({ userMessage, carrier, state, apiKey, onStep }) {
  if (!apiKey) {
    throw new Error('API_KEY_MISSING')
  }

  // ── Guardrail: sanitize input before sending to the model ────────────────
  const sanitized = sanitizeSubmissionInput(userMessage)
  if (sanitized.hasInjection) {
    console.warn(`[Guardrail v${GUARDRAIL_VERSION}] Prompt injection detected and stripped.`)
  }
  // Pass sanitization flags through so the UI can surface warnings to the underwriter
  const inputFlags = sanitized.flags

  const systemPrompt = buildSystemPrompt(carrier, state)

  const body = {
    model: MODEL,
    max_tokens: 2048,
    system: systemPrompt,
    messages: [{ role: 'user', content: sanitized.text }],
  }

  const makeRequest = async () => {
    const res = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify(body),
    })

    if (!res.ok) {
      const err = await res.json().catch(() => ({}))
      throw new Error(err.error?.message || `API error ${res.status}`)
    }

    return res.json()
  }

  let data
  try {
    if (onStep) onStep(1)
    data = await makeRequest()
  } catch (err) {
    // Retry once
    await new Promise((r) => setTimeout(r, 2000))
    data = await makeRequest()
  }

  if (onStep) onStep(2)

  const rawText = data.content?.[0]?.text || ''

  // ── Parse JSON from response ──────────────────────────────────────────────
  let rawParsed
  try {
    const cleaned = rawText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
    rawParsed = JSON.parse(cleaned)
  } catch {
    throw new Error('AI returned invalid JSON. Please try again.')
  }

  // ── Guardrail: validate and normalize the output schema ───────────────────
  const { valid, issues, result: validated } = validateUnderwritingOutput(rawParsed)
  if (!valid || issues.length > 0) {
    console.warn(`[Guardrail v${GUARDRAIL_VERSION}] Output validation issues:`, issues)
  }

  // ── Guardrail: apply confidence floor (code-level, not just prompt) ───────
  const { result: final, overrideApplied, overrideReason } = applyConfidenceFloor(validated)
  if (overrideApplied) {
    console.warn(`[Guardrail v${GUARDRAIL_VERSION}] Confidence floor override:`, overrideReason)
  }

  if (onStep) onStep(3)

  // Attach guardrail metadata so callers can surface warnings in the UI
  return {
    ...final,
    _guardrails: {
      version:              GUARDRAIL_VERSION,
      inputFlags,
      outputIssues:         issues,
      confidenceOverride:   overrideApplied,
      confidenceOverrideReason: overrideReason,
      inputTruncated:       sanitized.truncated,
      piiDetected:          sanitized.hasPII,
      piiTypes:             sanitized.piiTypes,
      injectionDetected:    sanitized.hasInjection,
      protectedClassFound:  sanitized.hasProtectedClass,
    },
  }
}

// ─── analyzeGroupCensus ───────────────────────────────────────────────────────
/**
 * Analyzes aggregate census statistics for a group enrollment using Claude.
 * Receives only group-level summary data — never individual employee records —
 * to avoid HIPAA concerns with raw PII leaving the system.
 *
 * @param {object} params
 * @param {object} params.censusStats  - Aggregate stats object from CensusUpload (averages, totals, distributions)
 * @param {string} params.apiKey       - Claude API key
 * @returns {Promise<object>}          - Parsed JSON with risk observations and recommended actions
 * @throws {Error}  'API_KEY_MISSING'  - when apiKey is falsy
 */
export async function analyzeGroupCensus({ censusStats, apiKey }) {
  if (!apiKey) throw new Error('API_KEY_MISSING')

  const systemPrompt = `You are an expert group insurance analyst. Analyze aggregate census statistics and provide risk profile observations.
IMPORTANT: You receive only aggregate statistics — no individual employee data. Your analysis is based entirely on group-level data.
Respond with valid JSON only.

JSON SCHEMA:
{
  "averageAgeAnalysis": "string",
  "coverageElectionPatterns": "string",
  "salaryDistributionInsight": "string",
  "industryBenchmarkComparison": "string",
  "groupRiskObservations": ["array of observation strings"],
  "recommendedActions": ["array of action strings"]
}`

  const body = {
    model: MODEL,
    max_tokens: 1024,
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Analyze this group census summary (aggregate statistics only):\n${JSON.stringify(censusStats, null, 2)}`,
      },
    ],
  }

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify(body),
  })

  if (!res.ok) throw new Error(`API error ${res.status}`)
  const data = await res.json()
  const text = data.content?.[0]?.text || ''
  const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
  return JSON.parse(cleaned)
}

// ─── testConnection ───────────────────────────────────────────────────────────
/**
 * Sends a minimal "ping" request to verify the API key and network connectivity.
 * Used by the AI Settings page to give instant feedback without running a real analysis.
 *
 * @param {string} apiKey  - Claude API key to validate
 * @returns {Promise<{success: boolean, ms: number, error?: string}>}
 *   success: true if the API responded with 2xx
 *   ms: round-trip time in milliseconds
 *   error: human-readable message if success is false
 */
export async function testConnection(apiKey) {
  const start = Date.now()
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 10,
      messages: [{ role: 'user', content: 'ping' }],
    }),
  })
  const ms = Date.now() - start
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    return { success: false, error: err.error?.message || `Status ${res.status}`, ms }
  }
  return { success: true, ms }
}

// ─── callAssistantAPI ─────────────────────────────────────────────────────────
/**
 * Powers the Copilot-style AI Assistant panel (AIAssistantPanel.jsx).
 * Injects a live snapshot of app state into the system prompt so Claude can
 * answer questions about the current queue, specific submissions, and workflows.
 *
 * Navigation hints: Claude may embed a JSON action block at the end of its
 * response — `{"action":"navigate","path":"...","label":"..."}` — which
 * AIAssistantPanel parses and renders as a clickable navigation button.
 *
 * @param {object}   params
 * @param {Array}    params.messages    - Full conversation history in Claude messages format
 *                                       [{ role: 'user'|'assistant', content: string }]
 * @param {object}   params.appContext  - Live slice of Zustand store:
 *                                       { submissions, carriers, enrollments, currentUser, activeCarrier }
 * @param {string}   params.apiKey      - Claude API key
 * @returns {Promise<string>}           - Raw assistant text (may contain trailing JSON action block)
 * @throws {Error}  'API_KEY_MISSING'   - when apiKey is falsy
 */
export async function callAssistantAPI({ messages, appContext, apiKey }) {
  if (!apiKey) throw new Error('API_KEY_MISSING')

  const { submissions = [], carriers = [], enrollments = [], currentUser = {}, activeCarrier } = appContext

  const pendingCount    = submissions.filter(s => s.status === 'PENDING').length
  const referredCount   = submissions.filter(s => s.status === 'REFERRED').length
  const approvedToday   = submissions.filter(s => s.status === 'APPROVED').length
  const declinedCount   = submissions.filter(s => s.status === 'DECLINED').length
  const activeEnrollments = enrollments.filter(e => e.status === 'Active' || e.status === 'Pending Start').length

  const systemPrompt = `You are an intelligent AI assistant embedded inside Uniblox, a B2B insurance underwriting platform.
You help underwriters, compliance officers, and administrators work faster and smarter.

CURRENT USER: ${currentUser.name} (${currentUser.role})
ACTIVE CARRIER: ${activeCarrier?.name || 'None selected'}

LIVE APP DATA SUMMARY:
- Total submissions: ${submissions.length}
- Pending review: ${pendingCount}
- Referred to human: ${referredCount}
- Approved: ${approvedToday}
- Declined: ${declinedCount}
- Active enrollments: ${activeEnrollments}
- Configured carriers: ${carriers.map(c => c.name).join(', ')}

RECENT SUBMISSIONS (last 5):
${submissions.slice(0, 5).map(s =>
  `• ${s.id} — ${s.groupName || s.employer || 'Unknown'} | ${s.status} | Risk: ${s.riskScore ?? 'N/A'} | ${s.industry || ''} | ${s.state || ''}`
).join('\n')}

YOUR CAPABILITIES:
You can help with:
- Answering questions about submissions, carriers, compliance rules, and platform features
- Explaining risk scores, underwriting decisions, and AI reasoning
- Walking through workflows (EOI, census upload, carrier configuration)
- Drafting adverse action notices, broker communications, or internal notes
- Summarizing portfolio statistics or finding patterns in the data above
- Explaining regulatory requirements by state

NAVIGATION HINTS:
When you suggest navigating somewhere, include a JSON action block at the END of your response (after your prose) like this:
{"action":"navigate","path":"/submissions/pending","label":"Go to Pending Review"}
Only include an action block when it would genuinely help the user get to their goal faster. One action block max.

RESPONSE STYLE:
- Be concise and direct — underwriters are busy
- Use plain English, not jargon
- Use bullet points (• character) for lists, NOT markdown (no **, no ##, no __)
- Do not use markdown formatting — responses are displayed as plain text
- If you don't know something specific to a submission (you only have summary data), say so clearly
- Never make binding underwriting decisions — you are advisory only`

  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages,
    }),
  })

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error?.message || `API error ${res.status}`)
  }

  const data = await res.json()
  return data.content?.[0]?.text || ''
}

export { MODEL }
