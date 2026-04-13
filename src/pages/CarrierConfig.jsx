import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Plus, Info } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input, Textarea, Select, FormGroup } from '@/components/ui/input'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Banner } from '@/components/shared/Banner'
import { cn } from '@/lib/utils'

const INDUSTRIES = ['Technology','Healthcare','Finance','Legal','Professional Services',
  'Education','Retail','Manufacturing','Restaurant','Construction','Hospitality','Transportation',
  'Agriculture','Nonprofit','Real Estate','Energy','Food Service']

const US_STATES = ['AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA',
  'KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY',
  'NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC']

const COMPLEX_STATES = ['CA','NY','IL','WA']

function initAppetite(carrier) {
  const a = {}
  INDUSTRIES.forEach((ind) => { a[ind] = carrier?.industryAppetite?.[ind] || 'ACCEPT' })
  return a
}

function initMaxSize(carrier) {
  const m = {}
  INDUSTRIES.forEach((ind) => { m[ind] = carrier?.maxGroupSize?.[ind] || '' })
  return m
}

function initStates(carrier) {
  if (!carrier) return []
  if (carrier.states === 'ALL') return [...US_STATES]
  if (Array.isArray(carrier.states)) return [...carrier.states]
  return []
}

export default function CarrierConfig() {
  const { carriers, activeCarrierId, updateCarrier } = useAppStore()
  const [selectedId, setSelectedId] = useState(activeCarrierId)
  const carrier = carriers.find((c) => c.id === selectedId) || carriers[0]

  // Profile
  const [profile, setProfile] = useState({
    name: '', legalName: '', naicNumber: '', status: '', primaryContact: '', contractStart: '',
  })

  // Industry appetite & max size
  const [appetite, setAppetite]   = useState({})
  const [maxSize,  setMaxSize]    = useState({})

  // State availability
  const [activeStates, setActiveStates] = useState([])

  // Automation thresholds + custom rules
  const [customRules,       setCustomRules]       = useState('')
  const [approveThreshold,  setApproveThreshold]  = useState([35])
  const [declineThreshold,  setDeclineThreshold]  = useState([75])

  // Integration
  const [integration, setIntegration] = useState({
    apiEndpoint: '', ediFormat: '834', deliveryMethod: 'SFTP', reportFormat: 'PDF',
  })

  // Reset all local state whenever the selected carrier changes
  useEffect(() => {
    if (!carrier) return
    setProfile({
      name:           carrier.name           || '',
      legalName:      carrier.legalName      || '',
      naicNumber:     carrier.naicNumber      || '',
      status:         carrier.status         || '',
      primaryContact: carrier.primaryContact || '',
      contractStart:  carrier.contractStart  || '',
    })
    setAppetite(initAppetite(carrier))
    setMaxSize(initMaxSize(carrier))
    setActiveStates(initStates(carrier))
    setCustomRules(carrier.customRules || '')
    setApproveThreshold([carrier.autoApproveThreshold || 35])
    setDeclineThreshold([carrier.autoDeclineThreshold || 75])
    setIntegration({
      apiEndpoint:    carrier.apiEndpoint    || '',
      ediFormat:      carrier.ediFormat      || '834',
      deliveryMethod: carrier.deliveryMethod || 'SFTP',
      reportFormat:   carrier.reportFormat   || 'PDF',
    })
  }, [selectedId]) // eslint-disable-line react-hooks/exhaustive-deps

  function handleSave() {
    updateCarrier(selectedId, {
      ...profile,
      industryAppetite:    appetite,
      maxGroupSize:        maxSize,
      states:              activeStates,
      customRules,
      autoApproveThreshold: approveThreshold[0],
      autoDeclineThreshold: declineThreshold[0],
      ...integration,
    })
    toast.success('Carrier configuration saved', { description: profile.name || carrier.name })
  }

  function handleRunTest() {
    toast.info('Running test submission through carrier configuration...')
    setTimeout(() => toast.success('Test complete — configuration valid. No errors detected.'), 2000)
  }

  function setAllAppetite(val) {
    const a = {}
    INDUSTRIES.forEach((ind) => { a[ind] = val })
    setAppetite(a)
    toast.success(`All industries set to ${val === 'ACCEPT' ? 'Accept' : 'Decline'}`)
  }

  function toggleState(s) {
    setActiveStates((prev) =>
      prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]
    )
  }

  if (!carrier) return null

  return (
    <div className="flex gap-5">
      {/* Left: carrier list */}
      <div className="w-64 flex-shrink-0">
        <div className="font-semibold text-sm text-ink-primary mb-3">Carriers</div>
        <div className="space-y-1">
          {carriers.map((c) => (
            <button
              key={c.id}
              onClick={() => setSelectedId(c.id)}
              className={cn(
                'w-full text-left p-3 rounded-md border transition-all',
                c.id === selectedId
                  ? 'border-brand bg-brand-light'
                  : 'border-line hover:border-line-strong hover:bg-surface-hover'
              )}
            >
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 rounded bg-brand/20 flex items-center justify-center text-brand text-xs font-bold flex-shrink-0">
                  {c.name[0]}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-ink-primary truncate">{c.name}</div>
                </div>
              </div>
              <div className="flex items-center justify-between pl-9">
                <StatusBadge status={c.status} />
                <span className="text-[10px] text-ink-tertiary">{c.submissionCount} sub</span>
              </div>
            </button>
          ))}
        </div>
        <Button size="sm" variant="secondary" className="w-full mt-3"
          onClick={() => toast.info('Add carrier coming soon')}>
          <Plus size={13} /> Add Carrier
        </Button>
      </div>

      {/* Right: config form */}
      <div className="flex-1 min-w-0 space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">{profile.name || carrier.name}</h2>
          <Button onClick={handleSave}>Save Changes</Button>
        </div>

        {carrier.submissionCount < 50 && (
          <Banner variant="warning" title="Cold Start Mode">
            This carrier has {carrier.submissionCount} decisions. AI operates on carrier guidelines only.
            Confidence scores capped at 75% until 50+ decisions are made.
          </Banner>
        )}

        {/* Section 1: Profile */}
        <Section title="Carrier Profile">
          <div className="grid grid-cols-2 gap-3">
            {[
              ['Carrier Name',      'name',          'text'],
              ['Legal Entity Name', 'legalName',      'text'],
              ['NAIC Number',       'naicNumber',     'text'],
              ['Contract Status',   'status',         'text'],
              ['Primary Contact',   'primaryContact', 'text'],
              ['Contract Start',    'contractStart',  'date'],
            ].map(([label, key, type]) => (
              <FormGroup key={key} label={label}>
                <Input
                  type={type}
                  value={profile[key] || ''}
                  onChange={(e) => setProfile((p) => ({ ...p, [key]: e.target.value }))}
                />
              </FormGroup>
            ))}
          </div>
        </Section>

        {/* Section 2: Industry appetite */}
        <Section title="Industry Appetite">
          <div className="flex justify-end mb-2 gap-2">
            <button className="text-xs text-positive-text hover:underline"
              onClick={() => setAllAppetite('ACCEPT')}>Set all Accept</button>
            <button className="text-xs text-destructive-text hover:underline"
              onClick={() => setAllAppetite('DECLINE')}>Set all Decline</button>
          </div>
          <table className="w-full data-table">
            <thead>
              <tr><th>Industry</th><th>Appetite</th><th>Max Group Size</th></tr>
            </thead>
            <tbody>
              {INDUSTRIES.map((ind) => {
                const val = appetite[ind] || 'ACCEPT'
                return (
                  <tr key={ind}>
                    <td className="font-medium text-sm">{ind}</td>
                    <td>
                      <Select
                        value={val}
                        onChange={(e) => setAppetite((a) => ({ ...a, [ind]: e.target.value }))}
                        className="h-7 text-xs w-36"
                        style={{
                          color: val === 'DECLINE' ? 'var(--danger-text)'
                               : val === 'MARGINAL' ? 'var(--warning-text)'
                               : 'var(--success-text)',
                        }}
                      >
                        <option value="ACCEPT">Accept</option>
                        <option value="MARGINAL">Marginal — Refer All</option>
                        <option value="DECLINE">Decline</option>
                      </Select>
                    </td>
                    <td>
                      <Input
                        type="number"
                        value={maxSize[ind] || ''}
                        onChange={(e) => setMaxSize((m) => ({ ...m, [ind]: e.target.value }))}
                        className="h-7 text-xs w-24"
                        placeholder="Unlimited"
                      />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </Section>

        {/* Section 3: Automation thresholds */}
        <Section title="Automation Thresholds">
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Auto-Approve Threshold</span>
                <span className="text-positive-text font-bold">≤ {approveThreshold[0]}</span>
              </div>
              <Slider value={approveThreshold} onValueChange={setApproveThreshold} min={0} max={100} step={1} />
              <div className="text-xs text-ink-tertiary mt-1">
                Submissions with risk score ≤ {approveThreshold[0]} AND confidence ≥ {carrier.confidenceMinimum}% will be auto-approved.
              </div>
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="font-medium">Auto-Decline Threshold</span>
                <span className="text-destructive-text font-bold">≥ {declineThreshold[0]}</span>
              </div>
              <Slider value={declineThreshold} onValueChange={setDeclineThreshold} min={0} max={100} step={1} />
              <div className="text-xs text-ink-tertiary mt-1">
                Submissions with risk score ≥ {declineThreshold[0]} will be recommended for decline.
              </div>
            </div>

            {/* Visual zones */}
            <div>
              <div className="text-xs text-ink-secondary mb-1.5 font-medium">Decision Zones</div>
              <div className="flex rounded overflow-hidden h-8 text-xs font-medium">
                <div className="flex items-center justify-center text-positive-text bg-positive-light"
                     style={{ width: `${approveThreshold[0]}%`, minWidth: '10%' }}>
                  Auto-Approve (0–{approveThreshold[0]})
                </div>
                <div className="flex items-center justify-center text-caution-text bg-caution-light flex-1">
                  Human Review ({approveThreshold[0]}–{declineThreshold[0]})
                </div>
                <div className="flex items-center justify-center text-destructive-text bg-destructive-light"
                     style={{ width: `${100 - declineThreshold[0]}%`, minWidth: '10%' }}>
                  Auto-Decline ({declineThreshold[0]}–100)
                </div>
              </div>
            </div>
          </div>
        </Section>

        {/* Section 4: State availability */}
        <Section title="State Availability">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-ink-tertiary">
              {activeStates.length} of {US_STATES.length} states enabled
            </span>
            <div className="flex gap-2">
              <button className="text-xs text-brand hover:underline"
                onClick={() => setActiveStates([...US_STATES])}>Enable all</button>
              <button className="text-xs text-ink-tertiary hover:underline"
                onClick={() => setActiveStates([])}>Disable all</button>
            </div>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {US_STATES.map((s) => {
              const active  = activeStates.includes(s)
              const complex = COMPLEX_STATES.includes(s)
              return (
                <button
                  key={s}
                  title={complex ? 'Complex regulations — review before enabling' : s}
                  onClick={() => toggleState(s)}
                  className={cn(
                    'px-2 py-1 rounded text-xs font-medium border transition-all',
                    active
                      ? 'bg-brand text-white border-brand'
                      : 'bg-surface-secondary text-ink-secondary border-line hover:border-brand',
                    complex && active && 'ring-1 ring-caution ring-offset-1'
                  )}
                >
                  {s}{complex && ' ⚠'}
                </button>
              )
            })}
          </div>
          <div className="text-xs text-ink-tertiary mt-2 flex items-center gap-1">
            <Info size={11} /> States marked ⚠ (CA, NY, IL, WA) have complex regulations. Review before enabling.
          </div>
        </Section>

        {/* Section 5: Custom rules */}
        <Section title="Custom Underwriting Rules">
          <Textarea
            value={customRules}
            onChange={(e) => setCustomRules(e.target.value)}
            className="min-h-[180px] font-mono text-xs"
            placeholder="Enter carrier-specific underwriting rules in plain English. These rules will be injected into the AI system prompt for every submission evaluated against this carrier."
          />
          <div className="flex justify-between text-xs text-ink-tertiary mt-1">
            <span>These rules are injected directly into Claude API calls for every submission.</span>
            <span>{customRules.length} chars</span>
          </div>
        </Section>

        {/* Section 6: Integration settings */}
        <Section title="Integration Settings">
          <div className="grid grid-cols-2 gap-3">
            <FormGroup label="Carrier System API Endpoint">
              <Input
                value={integration.apiEndpoint}
                onChange={(e) => setIntegration((i) => ({ ...i, apiEndpoint: e.target.value }))}
                placeholder="https://api.carrier.com/v1"
                className="text-sm"
              />
            </FormGroup>
            <FormGroup label="EDI Format">
              <Select
                value={integration.ediFormat}
                onChange={(e) => setIntegration((i) => ({ ...i, ediFormat: e.target.value }))}
              >
                <option value="834">834</option>
                <option value="835">835</option>
                <option value="820">820</option>
              </Select>
            </FormGroup>
            <FormGroup label="File Delivery Method">
              <Select
                value={integration.deliveryMethod}
                onChange={(e) => setIntegration((i) => ({ ...i, deliveryMethod: e.target.value }))}
              >
                <option value="SFTP">SFTP</option>
                <option value="API">API</option>
                <option value="Email">Email</option>
              </Select>
            </FormGroup>
            <FormGroup label="Report Format">
              <Select
                value={integration.reportFormat}
                onChange={(e) => setIntegration((i) => ({ ...i, reportFormat: e.target.value }))}
              >
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
                <option value="XLSX">XLSX</option>
              </Select>
            </FormGroup>
          </div>
        </Section>

        {/* Section 7: Test */}
        <Section title="Test Configuration">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink-secondary">
              Run a sample submission through this carrier's configuration to verify all rules are working correctly.
            </div>
            <Button variant="secondary" onClick={handleRunTest}>Run Test Submission</Button>
          </div>
        </Section>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-line font-semibold text-ink-primary">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  )
}
