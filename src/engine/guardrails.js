/**
 * guardrails.js
 *
 * AI safety and input/output guardrail layer for Uniblox.
 * All functions are synchronous and side-effect-free — they run between
 * the raw user input and the Claude API call, and again between the raw
 * Claude response and the application consuming it.
 *
 * Pipeline position:
 *
 *   User input (file/text)
 *        │
 *        ▼
 *   sanitizeSubmissionInput()   ← strips injection, flags PII, enforces limits
 *        │
 *        ▼
 *   callClaudeAPI()             ← sends to Claude
 *        │
 *        ▼
 *   validateUnderwritingOutput() ← validates schema, clamps ranges, fills gaps
 *        │
 *        ▼
 *   applyConfidenceFloor()       ← code-level override (prompt alone isn't enough)
 *        │
 *        ▼
 *   Application consumes result
 *
 * Exports:
 *  sanitizeSubmissionInput(text)     → { text, flags, hasPII, hasInjection, truncated }
 *  validateUnderwritingOutput(parsed)→ { valid, issues, result }
 *  applyConfidenceFloor(parsed)      → parsed (mutated copy with override if needed)
 *  GUARDRAIL_VERSION                 → string (for audit log)
 */

export const GUARDRAIL_VERSION = '1.0.0'

// ─── Constants ────────────────────────────────────────────────────────────────

const MAX_INPUT_CHARS = 12_000   // ~3,000 tokens — enough for any real submission

// Prompt injection patterns — adversarial instructions trying to hijack the model
const INJECTION_PATTERNS = [
  /ignore\s+(all\s+)?(previous|prior|above|earlier)\s+instructions?/i,
  /disregard\s+(all\s+)?(previous|prior|above)\s+instructions?/i,
  /forget\s+(everything|all|the\s+above)/i,
  /you\s+are\s+now\s+(a\s+)?(?!an?\s+expert)/i,   // "you are now X" (not "you are now an expert")
  /new\s+instructions?\s*:/i,
  /system\s*prompt\s*:/i,
  /\[INST\]/i,                                      // Llama instruction format injection
  /<\|im_start\|>/i,                                // ChatML injection
  /\|ENDOFTEXT\|/i,
  /###\s*(instruction|system|prompt)/i,
  /act\s+as\s+(if\s+you\s+are\s+)?(?!an?\s+(underwriting|insurance|risk))/i,
  /roleplay\s+as/i,
  /pretend\s+(you\s+are|to\s+be)/i,
  /override\s+(safety|compliance|guardrail)/i,
  /bypass\s+(the\s+)?(filter|guardrail|rule|policy)/i,
  /jailbreak/i,
  /DAN\s+mode/i,
]

// PII patterns — detected and flagged (not stripped, but surfaced to the underwriter)
const PII_PATTERNS = [
  { name: 'SSN',           pattern: /\b\d{3}-\d{2}-\d{4}\b/g },
  { name: 'SSN (compact)', pattern: /\b\d{9}\b/g },
  { name: 'DOB',           pattern: /\b(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}\b/g },
  { name: 'Credit card',   pattern: /\b(?:4\d{12}(?:\d{3})?|5[1-5]\d{14}|3[47]\d{13}|3(?:0[0-5]|[68]\d)\d{11})\b/g },
  { name: 'Bank routing',  pattern: /\b0\d{8}\b/g },
]

// Protected class keywords — flag if submission text explicitly contains these
// (they should not reach the model as factors)
const PROTECTED_CLASS_KEYWORDS = [
  'race', 'ethnicity', 'nationality', 'religion', 'sex', 'gender',
  'pregnancy', 'marital status', 'disability', 'genetic', 'age discrimination',
  'sexual orientation', 'gender identity',
]

// Required fields in the underwriting JSON output
const REQUIRED_OUTPUT_FIELDS = [
  'riskScore', 'recommendation', 'confidenceLevel',
  'reasoningPoints', 'extractedData', 'subScores', 'carrierAppetiteMatch',
]

const VALID_RECOMMENDATIONS = ['APPROVE', 'REFER', 'DECLINE']
const VALID_APPETITE_MATCHES = ['ACCEPTABLE', 'MARGINAL', 'OUTSIDE_APPETITE', 'UNKNOWN']
const CONFIDENCE_FLOOR       = 60   // below this → always REFER

// ─── sanitizeSubmissionInput ──────────────────────────────────────────────────
/**
 * Sanitizes raw submission text before it is sent to the Claude API.
 *
 * Checks performed (in order):
 *  1. Length guard — truncates at MAX_INPUT_CHARS with a visible notice appended
 *  2. Prompt injection detection — scans for adversarial instruction patterns
 *  3. PII detection — identifies SSNs, DOBs, credit card numbers (flagged, not removed)
 *  4. Protected class keyword detection — surfaces fields that must not influence scoring
 *
 * The function never silently modifies the submission content — if PII or protected
 * class keywords are detected, they are flagged so the underwriter can review the
 * input and decide whether to proceed. Only actual injection attempts cause the
 * text to be modified (stripped).
 *
 * @param {string} text  - Raw submission text from paste or file parse
 * @returns {{
 *   text:           string,   sanitized text ready for API
 *   flags:          string[], human-readable list of all issues found
 *   hasPII:         boolean,
 *   hasInjection:   boolean,
 *   hasProtectedClass: boolean,
 *   truncated:      boolean,
 *   piiTypes:       string[], e.g. ['SSN', 'DOB']
 *   charCount:      number,
 * }}
 */
export function sanitizeSubmissionInput(text) {
  const flags             = []
  let   sanitized         = text
  let   hasPII            = false
  let   hasInjection      = false
  let   hasProtectedClass = false
  let   truncated         = false
  const piiTypes          = []

  // ── 1. Length guard ──────────────────────────────────────────────────────
  if (sanitized.length > MAX_INPUT_CHARS) {
    sanitized  = sanitized.slice(0, MAX_INPUT_CHARS)
    truncated  = true
    flags.push(`Input truncated to ${MAX_INPUT_CHARS.toLocaleString()} characters. Review the full document manually.`)
  }

  // ── 2. Prompt injection detection ────────────────────────────────────────
  for (const pattern of INJECTION_PATTERNS) {
    if (pattern.test(sanitized)) {
      hasInjection = true
      // Strip the matched injection text and replace with a placeholder
      sanitized = sanitized.replace(pattern, '[CONTENT REMOVED — POLICY VIOLATION]')
      flags.push('Potential prompt injection detected and removed. Review the original document.')
      break // one flag is enough — don't enumerate attack patterns to the user
    }
  }

  // ── 3. PII detection ─────────────────────────────────────────────────────
  for (const { name, pattern } of PII_PATTERNS) {
    if (pattern.test(sanitized)) {
      hasPII = true
      if (!piiTypes.includes(name)) piiTypes.push(name)
    }
    // Reset lastIndex for global regexes
    pattern.lastIndex = 0
  }
  if (hasPII) {
    flags.push(
      `PII detected in submission (${piiTypes.join(', ')}). ` +
      'Verify this data is appropriate to share with the AI. Individual PII is not used in scoring.'
    )
  }

  // ── 4. Protected class keyword detection ─────────────────────────────────
  const lowerText             = sanitized.toLowerCase()
  const foundProtectedClasses = PROTECTED_CLASS_KEYWORDS.filter((kw) =>
    lowerText.includes(kw)
  )
  if (foundProtectedClasses.length > 0) {
    hasProtectedClass = true
    flags.push(
      `Protected class references found: "${foundProtectedClasses.join('", "')}". ` +
      'These factors are prohibited from influencing the risk assessment per ECOA / ACA and have been flagged to the AI.'
    )
  }

  return {
    text:  sanitized,
    flags,
    hasPII,
    hasInjection,
    hasProtectedClass,
    truncated,
    piiTypes,
    charCount: sanitized.length,
  }
}

// ─── validateUnderwritingOutput ───────────────────────────────────────────────
/**
 * Validates and normalizes the JSON object returned by callClaudeAPI().
 *
 * Checks performed:
 *  1. Required field presence — all REQUIRED_OUTPUT_FIELDS must exist
 *  2. riskScore — must be integer 0–100 (clamped if out of range)
 *  3. recommendation — must be one of APPROVE | REFER | DECLINE (defaults to REFER)
 *  4. confidenceLevel — must be integer 0–100 (clamped if out of range)
 *  5. subScores — all 4 dimensions must be present and numeric (default 50 if missing)
 *  6. reasoningPoints — must be an array (converted if string)
 *  7. carrierAppetiteMatch — must be a valid enum value (defaults to UNKNOWN)
 *  8. extractedData — must be an object (defaults to empty object if missing)
 *
 * @param {object} parsed  - Raw parsed JSON from Claude response
 * @returns {{
 *   valid:   boolean,
 *   issues:  string[],  list of all problems found (may be non-empty even when valid=true for warnings)
 *   result:  object,    normalized output safe to consume
 * }}
 */
export function validateUnderwritingOutput(parsed) {
  const issues = []
  const result = { ...parsed }

  // ── 1. Required fields ────────────────────────────────────────────────────
  const missing = REQUIRED_OUTPUT_FIELDS.filter((f) => !(f in parsed))
  if (missing.length > 0) {
    issues.push(`Missing required fields: ${missing.join(', ')}`)
  }

  // ── 2. riskScore ──────────────────────────────────────────────────────────
  if (typeof result.riskScore !== 'number' || isNaN(result.riskScore)) {
    issues.push('riskScore is not a number — defaulted to 50 (REFER zone)')
    result.riskScore = 50
  } else if (result.riskScore < 0 || result.riskScore > 100) {
    issues.push(`riskScore ${result.riskScore} out of range — clamped to 0–100`)
    result.riskScore = Math.max(0, Math.min(100, Math.round(result.riskScore)))
  } else {
    result.riskScore = Math.round(result.riskScore)
  }

  // ── 3. recommendation ─────────────────────────────────────────────────────
  if (!VALID_RECOMMENDATIONS.includes(result.recommendation)) {
    issues.push(`Invalid recommendation "${result.recommendation}" — defaulted to REFER`)
    result.recommendation = 'REFER'
  }

  // ── 4. confidenceLevel ────────────────────────────────────────────────────
  if (typeof result.confidenceLevel !== 'number' || isNaN(result.confidenceLevel)) {
    issues.push('confidenceLevel is not a number — defaulted to 50')
    result.confidenceLevel = 50
  } else if (result.confidenceLevel < 0 || result.confidenceLevel > 100) {
    issues.push(`confidenceLevel ${result.confidenceLevel} out of range — clamped`)
    result.confidenceLevel = Math.max(0, Math.min(100, Math.round(result.confidenceLevel)))
  } else {
    result.confidenceLevel = Math.round(result.confidenceLevel)
  }

  // ── 5. subScores ──────────────────────────────────────────────────────────
  const SUB_SCORE_KEYS = ['liabilityRisk', 'financialStability', 'claimsHistory', 'industryRisk']
  if (!result.subScores || typeof result.subScores !== 'object') {
    issues.push('subScores missing — defaulted all dimensions to 50')
    result.subScores = { liabilityRisk: 50, financialStability: 50, claimsHistory: 50, industryRisk: 50 }
  } else {
    SUB_SCORE_KEYS.forEach((key) => {
      if (typeof result.subScores[key] !== 'number') {
        issues.push(`subScores.${key} missing or invalid — defaulted to 50`)
        result.subScores[key] = 50
      } else {
        result.subScores[key] = Math.max(0, Math.min(100, Math.round(result.subScores[key])))
      }
    })
  }

  // ── 6. reasoningPoints ────────────────────────────────────────────────────
  if (!Array.isArray(result.reasoningPoints)) {
    if (typeof result.reasoningPoints === 'string') {
      result.reasoningPoints = [result.reasoningPoints]
      issues.push('reasoningPoints was a string — wrapped in array')
    } else {
      result.reasoningPoints = ['Reasoning unavailable — please review manually.']
      issues.push('reasoningPoints missing or invalid — defaulted to placeholder')
    }
  }

  // ── 7. carrierAppetiteMatch ───────────────────────────────────────────────
  if (!VALID_APPETITE_MATCHES.includes(result.carrierAppetiteMatch)) {
    issues.push(`Invalid carrierAppetiteMatch "${result.carrierAppetiteMatch}" — defaulted to UNKNOWN`)
    result.carrierAppetiteMatch = 'UNKNOWN'
  }

  // ── 8. extractedData ──────────────────────────────────────────────────────
  if (!result.extractedData || typeof result.extractedData !== 'object') {
    issues.push('extractedData missing — defaulted to empty object')
    result.extractedData = {}
  }

  // ── 9. arrays that should be arrays ──────────────────────────────────────
  ;['missingInfoFlags', 'suggestedNextSteps', 'complianceNotes'].forEach((key) => {
    if (!Array.isArray(result[key])) {
      result[key] = result[key] ? [String(result[key])] : []
    }
  })

  // ── 10. dataCompleteness ─────────────────────────────────────────────────
  if (typeof result.dataCompleteness !== 'number') {
    result.dataCompleteness = 0.5
  } else {
    result.dataCompleteness = Math.max(0, Math.min(1, result.dataCompleteness))
  }

  const valid = missing.length === 0

  return { valid, issues, result }
}

// ─── applyConfidenceFloor ─────────────────────────────────────────────────────
/**
 * Applies a code-level confidence floor check AFTER the AI response is received
 * and validated. This is a deliberate redundancy — the system prompt already
 * instructs Claude to recommend REFER for low-confidence assessments, but
 * relying solely on a prompt instruction for a safety-critical override is not
 * sufficient. Code always wins over prompts.
 *
 * Rule: if confidenceLevel < CONFIDENCE_FLOOR (60), recommendation is forced
 * to REFER regardless of what the AI returned.
 *
 * @param {object} parsed  - Validated output from validateUnderwritingOutput()
 * @returns {{ result: object, overrideApplied: boolean, overrideReason: string|null }}
 */
export function applyConfidenceFloor(parsed) {
  if (parsed.confidenceLevel < CONFIDENCE_FLOOR && parsed.recommendation !== 'REFER') {
    const original = parsed.recommendation
    return {
      result: {
        ...parsed,
        recommendation: 'REFER',
        complianceNotes: [
          ...(parsed.complianceNotes || []),
          `Guardrail override: recommendation changed from ${original} to REFER. ` +
          `Confidence ${parsed.confidenceLevel}% is below the ${CONFIDENCE_FLOOR}% floor. ` +
          `Human review required before any binding decision.`,
        ],
      },
      overrideApplied: true,
      overrideReason:
        `Confidence ${parsed.confidenceLevel}% < ${CONFIDENCE_FLOOR}% floor. ` +
        `Auto-${original.toLowerCase()} blocked. Referred to human underwriter.`,
    }
  }

  return {
    result: parsed,
    overrideApplied: false,
    overrideReason: null,
  }
}
