/**
 * compliance.js
 *
 * Pure-function compliance engine that enforces state insurance regulations
 * against submission data and AI recommendations. None of these functions call
 * the Claude API — they run entirely client-side against the static state rules
 * in sampleData.js.
 *
 * Exports:
 *  - checkStateCompliance         — evaluates a submission against its state's rules
 *  - validateAIRecommendation     — overrides AI DECLINE to REFER when GI laws prohibit it
 *  - getAdverseActionDeadline     — returns the number of days the carrier has to send notice
 *  - checkCarrierAppetite         — looks up an industry in the active carrier's appetite grid
 *  - generateAdverseActionNotice  — builds a regulatory-compliant plain-text adverse action letter
 *  - checkContinuanceRequirement  — checks if CA continuance rules apply to a submission
 *  - injectStateRulesIntoPrompt   — appends a state-compliance section to a Claude system prompt
 *
 * Design notes:
 *  - All functions are synchronous and side-effect-free (easy to unit-test)
 *  - `getStateRules()` in sampleData.js returns a default ruleset for unknown states
 *    so these functions never throw on missing state data
 */

import { getStateRules } from '../store/sampleData'

// ─── checkStateCompliance ─────────────────────────────────────────────────────
/**
 * Evaluates a submission against the regulatory rules for its state.
 * Determines whether guaranteed issue, community rating, or auto-decline
 * restrictions apply based on the group's employee count.
 *
 * @param {object} submission  - Submission object from Zustand store
 * @param {string} submission.state          - 2-letter state code
 * @param {number} submission.employeeCount  - Total eligible employees
 * @param {boolean} [submission.selfFunded]  - Whether the group is self-insured (ERISA)
 * @returns {object}  Compliance result with rulesApplied, complianceNotes, flags
 */
export function checkStateCompliance(submission) {
  const rules = getStateRules(submission.state)
  const isSmallGroup = submission.employeeCount <= rules.smallGroupLimit
  const prohibitedStripped = []
  const rulesApplied = []
  const complianceNotes = []
  const specialRequirements = []

  // Guaranteed Issue check
  if (rules.guaranteedIssue && isSmallGroup) {
    rulesApplied.push(`GI: Guaranteed issue applies (${submission.employeeCount} ≤ ${rules.guaranteedIssueUpTo} employees)`)
    complianceNotes.push(`Guaranteed issue: must accept this group regardless of health history.`)
  }

  // Community rating check
  if (rules.communityRatingRequired && isSmallGroup) {
    rulesApplied.push('Community rating required for this group')
    complianceNotes.push('Premium must be community-rated. Health status may not affect pricing.')
  }

  // Auto-decline check
  if (!rules.autoDeclinePermitted && isSmallGroup) {
    rulesApplied.push(`Auto-decline prohibited: ${rules.autoDeclineConditions}`)
    complianceNotes.push(`${rules.stateName} prohibits auto-decline for small groups.`)
  }

  // Prohibited risk factors
  rules.prohibitedRiskFactors.forEach((factor) => {
    prohibitedStripped.push(factor)
    rulesApplied.push(`Prohibited factor stripped from assessment: "${factor}"`)
  })

  // Special requirements
  if (rules.specialRequirements) {
    rules.specialRequirements.forEach((req) => specialRequirements.push(req))
  }

  // Adverse action notice deadline
  rulesApplied.push(`Adverse action notice deadline: ${rules.adverseActionNoticeDays} days (${rules.regulatoryReference})`)

  return {
    state: submission.state,
    stateName: rules.stateName,
    isSmallGroup,
    smallGroupLimit: rules.smallGroupLimit,
    guaranteedIssue: rules.guaranteedIssue && isSmallGroup,
    communityRatingRequired: rules.communityRatingRequired && isSmallGroup,
    autoDeclinePermitted: isSmallGroup ? !rules.guaranteedIssue : rules.autoDeclinePermitted,
    prohibitedFactorsStripped: prohibitedStripped,
    adverseActionNoticeDays: rules.adverseActionNoticeDays,
    regulatoryReference: rules.regulatoryReference,
    rulesApplied,
    complianceNotes,
    specialRequirements,
    continuanceRequired: rules.continuanceRequired,
    continuanceDays: rules.continuanceDays,
    erisa: submission.selfFunded || false,
  }
}

// ─── validateAIRecommendation ─────────────────────────────────────────────────
/**
 * Validates an AI-generated recommendation against state law.
 * If the AI recommends DECLINE for a guaranteed-issue small group, this
 * function overrides it to REFER and explains the regulatory reason.
 * ERISA self-funded plans bypass state rules entirely (federal preemption).
 *
 * @param {'APPROVE'|'REFER'|'DECLINE'} aiRecommendation  - Recommendation from callClaudeAPI
 * @param {object}  submission  - Same submission object passed to checkStateCompliance
 * @returns {{isValid: boolean, overrideRequired: boolean, overriddenTo?: string, overrideReason?: string, note?: string}}
 */
export function validateAIRecommendation(aiRecommendation, submission) {
  const rules = getStateRules(submission.state)
  const isSmallGroup = submission.employeeCount <= rules.smallGroupLimit

  // Rule 1: Cannot auto-decline a GI small group
  if (
    aiRecommendation === 'DECLINE' &&
    rules.guaranteedIssue &&
    isSmallGroup &&
    !submission.selfFunded
  ) {
    return {
      isValid: false,
      overrideRequired: true,
      overrideReason: `${rules.stateName} requires guaranteed issue for small groups (≤${rules.smallGroupLimit} employees). Auto-decline is not permitted. Per ${rules.regulatoryReference}.`,
      overriddenTo: 'REFER',
      regulatoryReference: rules.regulatoryReference,
    }
  }

  // Rule 2: ERISA self-funded — state rules preempted
  if (submission.selfFunded) {
    return {
      isValid: true,
      overrideRequired: false,
      overrideReason: null,
      overriddenTo: null,
      note: 'Federal ERISA rules apply. State regulations preempted for this self-funded plan.',
    }
  }

  return {
    isValid: true,
    overrideRequired: false,
    overrideReason: null,
    overriddenTo: null,
  }
}

// ─── getAdverseActionDeadline ─────────────────────────────────────────────────
/**
 * Returns the number of calendar days the carrier has to deliver an adverse
 * action notice, per the submission's state regulations.
 *
 * @param {object} submission
 * @param {string} submission.state  - 2-letter state code
 * @returns {number}  Days until notice is due (e.g., 30, 45, 60)
 */
export function getAdverseActionDeadline(submission) {
  const rules = getStateRules(submission.state)
  return rules.adverseActionNoticeDays
}

// ─── checkCarrierAppetite ──────────────────────────────────────────────────────
/**
 * Looks up an industry in the active carrier's appetite grid and normalizes
 * the raw grid value to match the vocabulary used by the Claude AI schema.
 * This ensures UI checks are consistent whether the value came from the AI or
 * from this function.
 *
 * Mapping:
 *  'ACCEPT'  → 'ACCEPTABLE'       (positive, carrier writes this industry)
 *  'DECLINE' → 'OUTSIDE_APPETITE' (carrier will not write this industry)
 *  'MARGINAL'→ 'MARGINAL'         (routes to manual review)
 *  anything else → 'UNKNOWN'
 *
 * @param {string} industry  - Industry name (must match keys in carrier.industryAppetite)
 * @param {object} carrier   - Carrier object from Zustand store
 * @returns {'ACCEPTABLE'|'MARGINAL'|'OUTSIDE_APPETITE'|'UNKNOWN'}
 */
export function checkCarrierAppetite(industry, carrier) {
  if (!carrier || !carrier.industryAppetite) return 'UNKNOWN'
  const raw = carrier.industryAppetite[industry]
  if (raw === 'ACCEPT')  return 'ACCEPTABLE'
  if (raw === 'DECLINE') return 'OUTSIDE_APPETITE'
  if (raw === 'MARGINAL') return 'MARGINAL'
  return 'UNKNOWN'
}

// ─── generateAdverseActionNotice ─────────────────────────────────────────────
/**
 * Generates a regulatory-compliant plain-text adverse action notice letter.
 * Includes state-specific regulatory references, continuance language (if required
 * by the state), and contact information. Suitable for direct delivery to brokers.
 *
 * @param {object}   submission       - Submission containing employer, broker, state, id
 * @param {string[]} declineReasons   - Human-readable reason strings (no internal scores)
 * @param {object}   [carrier]        - Active carrier for letterhead and contact details
 * @returns {string}  Formatted multi-line plain-text notice
 */
export function generateAdverseActionNotice(submission, declineReasons, carrier) {
  const rules = getStateRules(submission.state)
  const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })

  const reasonsList = declineReasons
    .map((r, i) => `  ${i + 1}. ${r}`)
    .join('\n')

  return `
================================================================================
ADVERSE ACTION NOTICE
${carrier?.name || 'Carrier Name'}
${today}
================================================================================

RE: Group Insurance Application — Adverse Action Notice
Employer: ${submission.employerName}
State of Situs: ${submission.state}
Application Reference: ${submission.id}
Regulatory Authority: ${rules.regulatoryReference}

--------------------------------------------------------------------------------

Dear ${submission.brokerName || 'Broker'},

This notice is provided pursuant to ${rules.regulatoryReference} and applicable
federal law. After careful review of the above-referenced group insurance
application, we are unable to offer coverage at this time.

REASON(S) FOR ADVERSE ACTION:
${reasonsList}

This decision was reached based on underwriting guidelines applicable to the
${submission.state} market. Protected characteristics, genetic information,
and other prohibited factors were not considered in this determination.

YOUR RIGHTS:
You have the right to request reconsideration of this decision within 30 days
of this notice by submitting additional information to the address below.
${
  rules.continuanceRequired
    ? `\nCONTINUANCE OFFER:\nPer ${rules.stateName} law, you may be eligible for a ${rules.continuanceDays}-day continuation of any current coverage. Please contact us within 30 days to exercise this right.\n`
    : ''
}
REGULATORY CONTACT:
${rules.insuranceDepartmentName}
${rules.insuranceDepartmentWebsite || ''}

If you have questions, contact our underwriting department:
compliance@${(carrier?.name || 'carrier').toLowerCase().replace(/\s+/g, '')}.com

Sincerely,
Underwriting Department
${carrier?.name || 'Carrier Name'}

================================================================================
This notice was generated on ${today} and is required by ${rules.regulatoryReference}.
Retain this document for your records.
================================================================================
`.trim()
}

// ─── checkContinuanceRequirement ─────────────────────────────────────────────
/**
 * Checks whether California's 60-day continuance requirement applies.
 * Currently only implemented for CA; all other states return `{ required: false }`.
 * Expand this function as additional state continuance laws are added to sampleData.
 *
 * @param {object} submission
 * @param {string} submission.state  - 2-letter state code
 * @returns {{ required: boolean, days?: number, statute?: string, notice?: string }}
 */
export function checkContinuanceRequirement(submission) {
  if (submission.state !== 'CA') return { required: false }
  return {
    required: true,
    days: 60,
    statute: 'California Insurance Code § 10712',
    notice: `Per California law, the group is entitled to a 60-day continuance offer if this policy is nonrenewed or cancelled. A continuance offer letter must be issued within 30 days of the adverse action decision.`,
  }
}

// ─── injectStateRulesIntoPrompt ───────────────────────────────────────────────
/**
 * Appends a formatted state-compliance section to a Claude system prompt.
 * Called by `buildSystemPrompt()` in ai.js when the user provides a state.
 * This ensures the AI is aware of GI laws, prohibited risk factors, and adverse
 * action deadlines for the specific state before generating its assessment.
 *
 * @param {string} state       - 2-letter state code (e.g. 'CA', 'NY')
 * @param {string} basePrompt  - Existing system prompt text to append to
 * @returns {string}           - basePrompt with state compliance section appended
 */
export function injectStateRulesIntoPrompt(state, basePrompt) {
  const rules = getStateRules(state)

  const stateSection = `
=== STATE COMPLIANCE RULES: ${rules.stateName || state} (${state}) ===
Small Group Threshold: ${rules.smallGroupLimit} employees
Guaranteed Issue: ${rules.guaranteedIssue ? `Yes (for groups up to ${rules.guaranteedIssueUpTo} employees)` : 'No'}
Community Rating Required: ${rules.communityRatingRequired ? 'Yes — premium cannot vary by health status' : 'No'}
Auto-Decline Permitted: ${rules.autoDeclinePermitted ? 'Yes (for groups over threshold)' : 'NO — PROHIBITED for small groups'}
Adverse Action Notice: ${rules.adverseActionNoticeDays} calendar days
Regulatory Reference: ${rules.regulatoryReference}
Prohibited Risk Factors (DO NOT USE): ${rules.prohibitedRiskFactors.join(', ')}
Special Requirements: ${rules.specialRequirements?.join('; ') || 'None'}
${rules.continuanceRequired ? `Continuance Required: Yes — ${rules.continuanceDays} days` : ''}

COMPLIANCE INSTRUCTION: If this is a small group (≤${rules.smallGroupLimit} employees) and guaranteed issue applies, you MUST NOT recommend DECLINE. Recommend REFER instead and note the GI override in complianceNotes.
=== END STATE RULES ===
`
  return basePrompt + '\n\n' + stateSection
}
