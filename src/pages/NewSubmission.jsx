import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { CheckCircle2, AlertCircle, Loader2, ChevronDown, ChevronUp, Info } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { callClaudeAPI } from '@/engine/ai'
import { checkStateCompliance, validateAIRecommendation, checkCarrierAppetite, getAdverseActionDeadline } from '@/engine/compliance'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select, FormGroup } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Banner } from '@/components/shared/Banner'
import { RiskGauge, SubScoreBar, ConfidenceBar } from '@/components/shared/RiskScore'
import { StatusBadge } from '@/components/ui/badge'
import { generateId, formatCurrency, addDays } from '@/lib/utils'
import { cn } from '@/lib/utils'

const STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']

const INDUSTRIES = ['Technology','Healthcare','Finance','Legal','Professional Services',
  'Education','Retail','Manufacturing','Restaurant','Construction','Hospitality','Transportation',
  'Agriculture','Nonprofit','Real Estate','Energy']

const EXAMPLES = {
  'Restaurant Group Chicago': `Employer: Riverside Restaurant Group LLC
Industry: Restaurant / Food Service
State of Operations: Illinois
Employee Count: 45 full-time employees
Annual Revenue: $2.1 million (last fiscal year)
Years in Business: 4 years (established 2020)
Business Entity: LLC

Coverage Requested: Life Insurance ($50,000 GI), Group Health (PPO), Short-Term Disability

Prior Claims History: Yes — 3 workers compensation claims in last 24 months
  • Claim 1: Kitchen slip/fall — $42,000 settled 2023
  • Claim 2: Repetitive stress (wrist) — $27,000 settled 2022
  • Claim 3: Burn injury — $58,000 settled 2023

Additional Risk Factors: Full bar service (alcohol license), seasonal revenue variation (25% higher summer), high employee turnover (~85% annually)

Broker: Marcus Thompson, IL-BRK-44821
Requested Effective Date: March 1, 2024`,

  'Tech Startup Austin': `Employer: TechNova Solutions Inc.
Industry: Technology / SaaS Software
State: Texas
Employees: 127 (all W-2, 90% remote)
Annual Revenue: $8.5 million ARR
Years in Business: 7 years (Series B funded)
Entity Type: Corporation

Coverage Requested: Life Insurance, Group Medical (HDHP+HSA), Dental, Vision

Prior Claims: None — no prior group insurance claims. Clean history.

Broker: Angela Rodriguez, TX-BRK-98231
Effective Date: February 1, 2024
Notes: Growing tech company, recently expanded headcount by 40 employees. Seeking competitive benefits package for talent retention.`,

  'Manufacturing Ohio': `Employer: Great Lakes Manufacturing Corp.
Industry: Heavy Manufacturing / Metal Fabrication
State: Ohio
Employees: 89 (all on-site, unionized)
Annual Revenue: $12.3 million
Years in Business: 22 years

Coverage: Group Life ($100,000 voluntary), Long-Term Disability

Claims History: 2 prior claims past 2 years
  • Workers comp: machinery-related hand injury — $55,000 (2023)
  • Repetitive stress disability claim — $28,000 (2022)

OSHA: Compliant — last inspection 2023, no violations. Safety program in place.
Equipment: CNC mills, lathes, press brakes. All maintained per OEM schedule.

Broker: Robert Fielding, OH-BRK-11294`,

  'Healthcare NYC': `Employer: Northeast Hospital Group
Industry: Healthcare / Hospital System
State: New York
Employees: 312 (physicians, nurses, admin staff)
Annual Revenue: $78 million
Years in Business: 34 years (nonprofit)
Entity: Nonprofit Corporation

Coverage: Group Life, Comprehensive Health Plan, Long-Term Care

Prior Claims (3 years): 4 claims totaling $312,000
  • LTC claim — $156,000 (2023, resolved)
  • Short-term disability — $82,000 (2022)
  • Life insurance — $48,000 (2022)
  • LTC claim — $26,000 (2021)

New York Large Group: 101+ employees — experience rating applies per NY Insurance Law Article 43.
Note: As a healthcare employer, comprehensive benefits are essential for staff retention.

Broker: Christine Park, NY-BRK-55671`
}

const AI_STEPS = [
  'Reading submission and extracting data...',
  'Checking carrier appetite and state compliance...',
  'Applying underwriting rules and scoring risk...',
  'Generating assessment and recommendations...',
]

export default function NewSubmission() {
  const navigate = useNavigate()
  const { apiKey, getActiveCarrier, addSubmission, addAuditEntry, carriers, activeCarrierId, setActiveCarrier } = useAppStore()

  const [mode, setMode] = useState('paste') // 'paste' | 'form'
  const [text, setText] = useState('')
  const [state, setState] = useState('')
  const [erisa, setErisa] = useState(false)
  const [running, setRunning] = useState(false)
  const [step, setStep]   = useState(-1)
  const [result, setResult] = useState(null)
  const [complianceCheck, setComplianceCheck] = useState(null)
  const [appetiteCheck, setAppetiteCheck] = useState(null)

  // Structured form fields
  const [form, setForm] = useState({
    employerName:'', industry:'', businessEntityType:'', yearsInBusiness:'',
    annualRevenue:'', employeeCount:'', coverageLife: false, coverageHealth: false,
    coverageDisability: false, coverageDental: false, coverageVision: false, coverageLTC: false,
    effectiveDate:'', brokerName:'', brokerLicense:'',
    priorClaims: false, claimsCount:'', claimsTotal:'', largestClaim:'', claimsDescription:'',
    additionalRisk:'', specialCircumstances:''
  })

  const carrier = getActiveCarrier()

  // Compliance preview for selected state
  const statePreview = state ? checkStateCompliance({ state, employeeCount: parseInt(form.employeeCount) || 10, selfFunded: erisa }) : null

  // Carrier appetite check based on form industry
  const industryForAppetite = mode === 'form' ? form.industry : null
  const industryAppetiteResult = industryForAppetite && carrier
    ? checkCarrierAppetite(industryForAppetite, carrier)
    : null

  async function handleAnalyze() {
    if (!apiKey) {
      toast.error('API key required', { description: 'Add your Claude API key in Settings → AI Model Settings.' })
      navigate('/settings/ai')
      return
    }

    const submissionText = mode === 'paste' ? text : buildFormText()
    if (!submissionText.trim()) {
      toast.error('Please enter submission details first.')
      return
    }
    if (submissionText.trim().split(/\s+/).length < 10) {
      toast.warning('Submission appears incomplete — AI accuracy may be reduced.')
    }

    setRunning(true)
    setStep(0)
    setResult(null)

    try {
      const parsed = await callClaudeAPI({
        userMessage: `Please analyze this group insurance submission:\n\n${submissionText}`,
        carrier,
        state: state || null,
        apiKey,
        onStep: (s) => setStep(s),
      })

      setStep(3)

      // Run compliance validation
      const subState = parsed.extractedData?.state || state
      const empCount = parsed.extractedData?.employeeCount || parseInt(form.employeeCount) || 10
      const compliance = checkStateCompliance({ state: subState, employeeCount: empCount, selfFunded: erisa })
      const validation = validateAIRecommendation(parsed.recommendation, { state: subState, employeeCount: empCount, selfFunded: erisa })

      // Override if needed
      let finalRec = parsed.recommendation
      let overrideNote = null
      if (validation.overrideRequired) {
        finalRec = validation.overriddenTo
        overrideNote = validation.overrideReason
        parsed.complianceNotes = [...(parsed.complianceNotes || []), `COMPLIANCE OVERRIDE: ${validation.overrideReason}`]
      }

      // Cap confidence for cold-start carriers
      let confidence = parsed.confidenceLevel
      if (carrier && carrier.submissionCount < 50) {
        confidence = Math.min(confidence, 75)
      }

      // Check carrier appetite
      const appetite = checkCarrierAppetite(parsed.extractedData?.industry || form.industry, carrier)
      setAppetiteCheck(appetite)

      setComplianceCheck({ ...compliance, validation, overrideNote })
      setResult({ ...parsed, confidenceLevel: confidence, recommendation: finalRec, overrideNote, appetite })

      // Auto-save to store
      const id = generateId()
      const newSub = {
        id,
        employerName: parsed.extractedData?.employerName || 'Unknown',
        industry:     parsed.extractedData?.industry || 'Unknown',
        state:        subState,
        employeeCount:parsed.extractedData?.employeeCount || empCount,
        annualRevenue:parsed.extractedData?.annualRevenue,
        yearsInBusiness: parsed.extractedData?.yearsInBusiness,
        businessEntityType: parsed.extractedData?.businessEntityType,
        coverageTypes: parsed.extractedData?.coverageRequested || [],
        brokerName:   form.brokerName || 'Unknown',
        brokerLicense:form.brokerLicense,
        submittedAt:  new Date().toISOString(),
        status:       finalRec === 'APPROVE' ? 'APPROVED' : finalRec === 'DECLINE' ? 'DECLINED' : 'REFERRED',
        priority:     parsed.riskScore >= 70 ? 'high' : parsed.riskScore >= 40 ? 'medium' : 'low',
        assignedUnderwriter: null,
        carrierId:    activeCarrierId,
        riskScore:    parsed.riskScore,
        confidenceLevel: confidence,
        recommendation: finalRec,
        carrierAppetiteMatch: appetite,
        selfFunded: erisa,
        priorClaims: parsed.extractedData?.priorClaims,
        subScores:   parsed.subScores,
        dataCompleteness: parsed.dataCompleteness,
        reasoning:   parsed.reasoningPoints,
        missingInfoFlags: parsed.missingInfoFlags,
        suggestedNextSteps: parsed.suggestedNextSteps,
        complianceNotes: parsed.complianceNotes,
        adverseActionDeadline: finalRec === 'DECLINE' ? addDays(new Date().toISOString(), getAdverseActionDeadline({ state: subState })) : null,
        adverseActionSent: false,
        messages: [],
        documents: [],
      }
      addSubmission(newSub)

      addAuditEntry({
        id: `AUD-${Date.now()}`,
        timestamp: new Date().toISOString(),
        eventType: 'AI Decision',
        submissionId: id,
        employer: newSub.employerName,
        modelVersion: 'claude-sonnet-4-20250514',
        inputHash: Math.random().toString(36).substring(2, 10),
        riskScore: parsed.riskScore,
        aiRecommendation: finalRec,
        confidenceLevel: confidence,
        humanOverride: false,
        finalDecision: newSub.status,
        decidedBy: 'AI (Pending Human Review)',
        notes: overrideNote || '',
      })

      toast.success('Assessment complete', { description: `${newSub.employerName} — ${finalRec}` })
    } catch (err) {
      const msg = err.message === 'API_KEY_MISSING' ? 'API key not configured.' : err.message
      toast.error('Assessment failed', { description: msg })
    } finally {
      setRunning(false)
    }
  }

  function buildFormText() {
    const coverages = ['Life','Health','Disability','Dental','Vision','LTC']
      .filter((c) => form[`coverage${c}`]).join(', ')
    return `Employer: ${form.employerName}
Industry: ${form.industry}
Entity Type: ${form.businessEntityType}
State: ${state}
Employees: ${form.employeeCount}
Annual Revenue: ${form.annualRevenue}
Years in Business: ${form.yearsInBusiness}
Coverage Requested: ${coverages}
Effective Date: ${form.effectiveDate}
Broker: ${form.brokerName} (${form.brokerLicense})
Prior Claims: ${form.priorClaims ? `Yes — ${form.claimsCount} claims totaling ${form.claimsTotal}. ${form.claimsDescription}` : 'No'}
Additional Risk Factors: ${form.additionalRisk}
Special Circumstances: ${form.specialCircumstances}`
  }

  const recColor = result?.recommendation === 'APPROVE' ? 'bg-positive-light border-positive text-positive-text'
    : result?.recommendation === 'DECLINE'              ? 'bg-destructive-light border-destructive text-destructive-text'
    : 'bg-caution-light border-caution text-caution-text'

  return (
    <div className="flex gap-0 border border-line rounded-md overflow-hidden bg-surface-primary"
         style={{ height: 'calc(100vh - 100px)' }}>

      {/* ── LEFT PANEL ── */}
      <div className="w-[55%] border-r border-line overflow-y-auto p-6 flex flex-col gap-4">
        <div>
          <h2 className="text-xl font-semibold text-ink-primary">New Submission</h2>
          <p className="text-sm text-ink-secondary mt-0.5">Analyze a broker submission with AI underwriting</p>
        </div>

        {/* Carrier selector */}
        <FormGroup label="Active Carrier">
          <Select value={activeCarrierId} onChange={(e) => setActiveCarrier(e.target.value)}>
            {carriers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
          </Select>
        </FormGroup>

        {/* State */}
        <FormGroup label="State of Situs" required>
          <Select value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select state...</option>
            {STATES.map((s) => <option key={s} value={s}>{s}</option>)}
          </Select>
        </FormGroup>

        {/* ERISA toggle */}
        <div className="flex items-center justify-between p-3 bg-surface-secondary border border-line rounded-md">
          <div>
            <div className="text-sm font-medium text-ink-primary">Self-funded / ERISA governed plan</div>
            <div className="text-xs text-ink-tertiary">Enables federal ERISA rules; preempts state insurance regulations</div>
          </div>
          <Switch checked={erisa} onCheckedChange={setErisa} />
        </div>

        {/* ERISA notice */}
        {erisa && (
          <Banner variant="info" title="ERISA Federal Preemption Active">
            Federal ERISA rules apply for this self-funded plan. State insurance regulations are preempted.
            All state-specific auto-decline restrictions are disabled.
          </Banner>
        )}

        {/* State compliance preview */}
        {statePreview && !erisa && (
          <div className="bg-surface-secondary border border-line rounded-md p-3">
            <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">
              {statePreview.stateName || state} Compliance Preview
            </div>
            {[
              ['GI Limit', statePreview.guaranteedIssue ? `≤${statePreview.smallGroupLimit} employees` : 'Not applicable'],
              ['Auto-Decline', statePreview.autoDeclinePermitted ? 'Permitted (large groups)' : 'PROHIBITED for small groups'],
              ['Adverse Action', `${statePreview.adverseActionNoticeDays} days`],
              ['Community Rating', statePreview.communityRatingRequired ? 'Required' : 'Not required'],
              ['Regulatory Ref', statePreview.regulatoryReference],
            ].map(([k, v]) => (
              <div key={k} className="flex justify-between text-xs py-1 border-b border-line last:border-0">
                <span className="text-ink-secondary">{k}</span>
                <span className="text-ink-primary font-medium text-right max-w-[55%]">{v}</span>
              </div>
            ))}
          </div>
        )}

        {/* Carrier appetite check for form mode */}
        {industryAppetiteResult && industryAppetiteResult !== 'UNKNOWN' && (
          <Banner
            variant={industryAppetiteResult === 'OUTSIDE_APPETITE' ? 'danger' : industryAppetiteResult === 'MARGINAL' ? 'warning' : 'success'}
            title={`Carrier Appetite: ${industryAppetiteResult === 'OUTSIDE_APPETITE' ? 'Outside Appetite' : industryAppetiteResult === 'ACCEPTABLE' ? 'Acceptable' : 'Marginal'}`}
          >
            {industryAppetiteResult === 'OUTSIDE_APPETITE'
              ? `${carrier?.name} does not write coverage for ${form.industry}. Consider reassigning to a different carrier or declining immediately.`
              : industryAppetiteResult === 'MARGINAL'
              ? `${form.industry} is marginal for ${carrier?.name}. All cases in this industry are routed to manual review.`
              : `${form.industry} is an accepted industry for ${carrier?.name}.`
            }
          </Banner>
        )}

        {/* Mode toggle */}
        <div className="flex border border-line rounded overflow-hidden">
          {['paste','form'].map((m) => (
            <button key={m} onClick={() => setMode(m)}
              className={cn(
                'flex-1 py-2 text-sm transition-colors',
                mode === m ? 'bg-brand text-white' : 'text-ink-secondary hover:bg-surface-hover'
              )}>
              {m === 'paste' ? 'Paste Submission' : 'Structured Form'}
            </button>
          ))}
        </div>

        {/* Paste mode */}
        {mode === 'paste' && (
          <div>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              className="min-h-[220px] text-sm"
              placeholder="Paste the broker's submission here. Include: employer name, industry, state, employee count, annual revenue, prior claims history, coverage types requested, and any additional risk factors. The AI will extract and structure all information automatically."
            />
            <div className="flex gap-2 mt-2 flex-wrap">
              <span className="text-xs text-ink-tertiary self-center">Load example:</span>
              {Object.keys(EXAMPLES).map((ex) => (
                <button
                  key={ex}
                  onClick={() => setText(EXAMPLES[ex])}
                  className="px-2 py-1 text-xs bg-surface-secondary border border-line rounded
                             hover:border-brand hover:text-brand transition-colors"
                >
                  {ex}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Structured form */}
        {mode === 'form' && (
          <div className="space-y-4">
            <FormGroup label="Employer Name" required>
              <Input value={form.employerName} onChange={(e) => setForm({...form, employerName: e.target.value})} placeholder="Acme Corporation" />
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Industry" required>
                <Select value={form.industry} onChange={(e) => setForm({...form, industry: e.target.value})}>
                  <option value="">Select...</option>
                  {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Entity Type">
                <Select value={form.businessEntityType} onChange={(e) => setForm({...form, businessEntityType: e.target.value})}>
                  <option value="">Select...</option>
                  {['LLC','Corporation','Partnership','Sole Proprietor','Nonprofit','Government/Public'].map((t) => <option key={t}>{t}</option>)}
                </Select>
              </FormGroup>
              <FormGroup label="Years in Business">
                <Input type="number" min="0" value={form.yearsInBusiness} onChange={(e) => setForm({...form, yearsInBusiness: e.target.value})} placeholder="5" />
              </FormGroup>
              <FormGroup label="Annual Revenue">
                <Input value={form.annualRevenue} onChange={(e) => setForm({...form, annualRevenue: e.target.value})} placeholder="$5M" />
              </FormGroup>
              <FormGroup label="Employee Count" required>
                <Input type="number" min="1" value={form.employeeCount} onChange={(e) => setForm({...form, employeeCount: e.target.value})} placeholder="50" />
              </FormGroup>
              <FormGroup label="Effective Date">
                <Input type="date" value={form.effectiveDate} onChange={(e) => setForm({...form, effectiveDate: e.target.value})} />
              </FormGroup>
            </div>
            <FormGroup label="Coverage Types">
              <div className="grid grid-cols-3 gap-2">
                {['Life','Health','Disability','Dental','Vision','LTC'].map((cov) => (
                  <label key={cov} className="flex items-center gap-2 p-2 border border-line rounded cursor-pointer hover:border-brand hover:bg-brand-light transition-colors text-sm">
                    <input type="checkbox" checked={form[`coverage${cov}`]} onChange={(e) => setForm({...form, [`coverage${cov}`]: e.target.checked})} className="accent-brand" />
                    {cov}
                  </label>
                ))}
              </div>
            </FormGroup>
            <div className="grid grid-cols-2 gap-3">
              <FormGroup label="Broker Name">
                <Input value={form.brokerName} onChange={(e) => setForm({...form, brokerName: e.target.value})} />
              </FormGroup>
              <FormGroup label="Broker License #">
                <Input value={form.brokerLicense} onChange={(e) => setForm({...form, brokerLicense: e.target.value})} />
              </FormGroup>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-secondary border border-line rounded-md">
              <div className="text-sm font-medium text-ink-primary flex-1">Prior Claims (last 3 years)</div>
              <Switch checked={form.priorClaims} onCheckedChange={(v) => setForm({...form, priorClaims: v})} />
            </div>
            {form.priorClaims && (
              <div className="grid grid-cols-2 gap-3">
                <FormGroup label="Number of Claims"><Input type="number" value={form.claimsCount} onChange={(e) => setForm({...form, claimsCount: e.target.value})} /></FormGroup>
                <FormGroup label="Total Claims Amount"><Input value={form.claimsTotal} onChange={(e) => setForm({...form, claimsTotal: e.target.value})} placeholder="$45,000" /></FormGroup>
                <FormGroup label="Largest Single Claim" className="col-span-2"><Input value={form.largestClaim} onChange={(e) => setForm({...form, largestClaim: e.target.value})} placeholder="$28,000" /></FormGroup>
                <FormGroup label="Claims Description" className="col-span-2"><Textarea value={form.claimsDescription} onChange={(e) => setForm({...form, claimsDescription: e.target.value})} className="min-h-[80px]" /></FormGroup>
              </div>
            )}
            <FormGroup label="Additional Risk Factors">
              <Textarea value={form.additionalRisk} onChange={(e) => setForm({...form, additionalRisk: e.target.value})} className="min-h-[80px]" placeholder="Any additional risk factors, industry hazards, special circumstances..." />
            </FormGroup>
          </div>
        )}

        <Button size="xl" onClick={handleAnalyze} loading={running} disabled={running}>
          {running ? 'Analyzing...' : '🔍 Analyze Submission'}
        </Button>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="w-[45%] overflow-y-auto p-6">
        {!running && !result && (
          <div className="flex flex-col items-center justify-center h-full text-center py-16">
            <svg viewBox="0 0 80 80" className="w-20 h-20 mb-4 opacity-30" fill="none">
              <rect x="10" y="8" width="45" height="58" rx="4" stroke="currentColor" strokeWidth="3" />
              <circle cx="57" cy="57" r="14" stroke="currentColor" strokeWidth="3" />
              <line x1="67" y1="67" x2="74" y2="74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
              <line x1="20" y1="24" x2="44" y2="24" stroke="currentColor" strokeWidth="2" />
              <line x1="20" y1="32" x2="40" y2="32" stroke="currentColor" strokeWidth="2" />
              <line x1="20" y1="40" x2="36" y2="40" stroke="currentColor" strokeWidth="2" />
            </svg>
            <h3 className="text-lg font-semibold text-ink-primary mb-1">AI Assessment</h3>
            <p className="text-sm text-ink-secondary max-w-xs">
              Complete the submission form and click Analyze to receive an instant underwriting assessment.
            </p>
          </div>
        )}

        {/* Processing state */}
        {running && (
          <div className="flex flex-col gap-3 py-8">
            <div className="text-base font-semibold text-ink-primary mb-2">Running Assessment...</div>
            {AI_STEPS.map((label, i) => (
              <div key={i} className={cn('flex items-center gap-3 text-sm transition-all',
                i < step ? 'text-positive' : i === step ? 'text-ink-primary' : 'text-ink-tertiary')}>
                {i < step
                  ? <CheckCircle2 size={16} className="text-positive flex-shrink-0" />
                  : i === step
                  ? <Loader2 size={16} className="animate-spin text-brand flex-shrink-0" />
                  : <div className="w-4 h-4 rounded-full border border-line flex-shrink-0" />
                }
                {label}
              </div>
            ))}
          </div>
        )}

        {/* Results */}
        {result && !running && (
          <div className="space-y-4">
            {/* Compliance section */}
            {complianceCheck && (
              <Section title="Compliance Check" defaultOpen>
                {complianceCheck.erisa && (
                  <Banner variant="info" title="ERISA Federal Preemption" className="mb-3">
                    Self-funded plan. Federal ERISA governs. State regulations preempted.
                  </Banner>
                )}
                {complianceCheck.overrideNote && (
                  <Banner variant="warning" title="AI Recommendation Overridden" className="mb-3">
                    {complianceCheck.overrideNote}
                  </Banner>
                )}
                <div className="space-y-1">
                  {complianceCheck.rulesApplied?.map((r, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs py-1">
                      <CheckCircle2 size={12} className="text-positive flex-shrink-0 mt-0.5" />
                      <span className="text-ink-secondary">{r}</span>
                    </div>
                  ))}
                  {complianceCheck.prohibitedFactorsStripped?.length > 0 && (
                    <Banner variant="warning" className="mt-2 text-xs">
                      Stripped from assessment: {complianceCheck.prohibitedFactorsStripped.join(', ')}
                    </Banner>
                  )}
                </div>
              </Section>
            )}

            {/* Extracted data */}
            <Section title={`Extracted Data — ${Math.round(result.dataCompleteness * 100)}% complete`} defaultOpen>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                {Object.entries(result.extractedData || {}).map(([k, v]) => {
                  if (Array.isArray(v)) v = v.join(', ')
                  const label = k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())
                  return (
                    <div key={k} className="py-1 border-b border-line">
                      <div className="text-xs text-ink-tertiary">{label}</div>
                      <div className={cn('text-xs font-medium mt-0.5', v ? 'text-ink-primary' : 'text-ink-tertiary')}>
                        {v || '⚠ Not provided'}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="mt-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-secondary">Data completeness</span>
                  <span className="text-ink-primary font-medium">{Math.round(result.dataCompleteness * 100)}%</span>
                </div>
                <div className="h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                  <div className="h-full bg-brand rounded-full" style={{ width: `${result.dataCompleteness * 100}%` }} />
                </div>
              </div>
            </Section>

            {/* Risk assessment */}
            <Section title="Risk Assessment" defaultOpen>
              {result.confidenceLevel < 60 && (
                <Banner variant="warning" title="Low AI Confidence — Human Review Required" className="mb-3">
                  Confidence {result.confidenceLevel}% is below 60% threshold. Auto-routing to human review.
                  Accept AI Recommendation is disabled.
                </Banner>
              )}
              <div className="flex items-start gap-6 mb-4">
                <RiskGauge score={result.riskScore} />
                <div className="flex-1">
                  <div className="text-xs text-ink-secondary mb-1">Confidence</div>
                  <ConfidenceBar confidence={result.confidenceLevel} />
                  <div className="mt-3 space-y-0">
                    {Object.entries(result.subScores || {}).map(([k, v]) => (
                      <SubScoreBar key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} score={v} />
                    ))}
                  </div>
                </div>
              </div>
            </Section>

            {/* Recommendation */}
            <Section title="Recommendation" defaultOpen>
              <div className={cn('flex items-start gap-3 p-4 rounded-md border mb-2', recColor)}>
                <span className="text-2xl">
                  {result.recommendation === 'APPROVE' ? '✓' : result.recommendation === 'DECLINE' ? '✗' : '⚡'}
                </span>
                <div>
                  <div className="text-lg font-semibold">{result.recommendation}</div>
                  {result.overrideNote && (
                    <div className="text-xs mt-1 opacity-80">Original AI recommendation overridden by state compliance rules.</div>
                  )}
                  {result.carrierAppetiteMatch === 'OUTSIDE_APPETITE' && (
                    <div className="text-xs mt-1 opacity-80">⚠ Outside carrier appetite for this industry.</div>
                  )}
                </div>
              </div>
            </Section>

            {/* Reasoning */}
            <Section title="Reasoning" defaultOpen>
              <ul className="space-y-2">
                {result.reasoningPoints?.map((pt, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                    <span className="text-brand font-bold flex-shrink-0 mt-0.5">•</span>
                    {pt}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Missing info */}
            {result.missingInfoFlags?.length > 0 && (
              <Section title="Missing Information">
                <div className="space-y-2">
                  {result.missingInfoFlags.map((flag, i) => (
                    <div key={i} className="flex items-center justify-between p-2 bg-surface-secondary border border-line rounded text-sm">
                      <div className="flex items-center gap-2">
                        <AlertCircle size={13} className="text-caution flex-shrink-0" />
                        <span className="text-ink-primary">{flag}</span>
                      </div>
                      <button
                        onClick={() => toast.success(`Added to broker queue: "${flag}"`)}
                        className="text-xs text-brand hover:underline whitespace-nowrap ml-2"
                      >
                        Request
                      </button>
                    </div>
                  ))}
                </div>
              </Section>
            )}

            {/* Next steps */}
            <Section title="Suggested Next Steps">
              <ul className="space-y-1.5">
                {result.suggestedNextSteps?.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <span className="w-5 h-5 rounded-full bg-brand-light text-brand text-xs flex items-center justify-center font-medium flex-shrink-0">{i + 1}</span>
                    {s}
                  </li>
                ))}
              </ul>
            </Section>

            {/* Human review controls */}
            <Section title="Human Review Controls" defaultOpen>
              <div className="flex flex-col gap-2">
                <Button
                  variant="primary"
                  disabled={result.confidenceLevel < 60 || result.overrideNote || result.carrierAppetiteMatch === 'OUTSIDE_APPETITE'}
                  onClick={() => toast.success('AI recommendation accepted and saved.')}
                >
                  Accept AI Recommendation
                </Button>
                {(result.confidenceLevel < 60 || result.overrideNote) && (
                  <p className="text-xs text-caution-text">
                    {result.confidenceLevel < 60
                      ? 'Disabled: confidence below 60% — manual review required.'
                      : 'Disabled: compliance override in effect — requires compliance officer approval.'}
                  </p>
                )}
                <Button variant="secondary" onClick={() => toast.info('Override modal — available in Submission Detail view')}>
                  Override Decision
                </Button>
                <Button variant="secondary" onClick={() => toast.info('Request sent to broker communication queue')}>
                  Request More Info
                </Button>
              </div>
            </Section>

            {/* Footer actions */}
            <div className="flex gap-2 pt-2">
              <Button variant="secondary" className="flex-1" onClick={() => toast.success('Saved to underwriting queue')}>
                Save to Queue
              </Button>
              <Button variant="secondary" className="flex-1" onClick={() => toast.info('Generating full report...')}>
                Generate Full Report
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function Section({ title, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-line rounded-md overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center justify-between px-4 py-3 bg-surface-secondary
                   hover:bg-surface-hover transition-colors text-sm font-medium text-ink-primary"
      >
        {title}
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
      </button>
      {open && <div className="p-4 bg-surface-primary">{children}</div>}
    </div>
  )
}
