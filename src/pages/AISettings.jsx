import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, Wifi, WifiOff, CheckCircle2 } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, FormGroup } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/PageHeader'
import { Banner } from '@/components/shared/Banner'
import { testConnection, MODEL } from '@/engine/ai'
import { cn } from '@/lib/utils'

const BASE_PROMPT = `You are an expert insurance underwriting AI assistant for a B2B insurance underwriting platform.
Your role is to assist human underwriters by analyzing group insurance submissions.
You are ADVISORY ONLY — all final decisions are made by human underwriters.

[CARRIER RULES INJECTION POINT]
=== ACTIVE CARRIER: {carrier_name} ===
{carrier_custom_rules}
=== END CARRIER RULES ===

[STATE RULES INJECTION POINT]
=== STATE COMPLIANCE RULES: {state} ===
{state_specific_rules}
=== END STATE RULES ===

[COMPLIANCE CONSTRAINTS]
- Never use protected characteristics in risk scoring
- Never recommend DECLINE for GI-eligible small groups
- Always note when confidence is below 60%
- Flag missing information that affects accuracy

[OUTPUT FORMAT]
Respond only with valid JSON matching the required schema.`

const COMPLIANCE_ITEMS = [
  'Protected characteristics excluded from all AI scoring',
  'Disparate impact monitoring enabled',
  'State-specific prohibited factors enforced',
  'EOI decisions require human authorization',
  'HIPAA mode active for health data',
  'Adverse action notices required for all declines',
  'Audit trail captures all AI decisions',
]

export default function AISettings() {
  const { apiKey, setApiKey } = useAppStore()

  const [inputKey,   setInputKey]   = useState(apiKey || '')
  const [showKey,    setShowKey]    = useState(false)
  const [connStatus, setConnStatus] = useState(null)
  const [testing,    setTesting]    = useState(false)

  const [promptText,  setPromptText]  = useState(BASE_PROMPT)
  const [promptDirty, setPromptDirty] = useState(false)

  const [settings, setSettings] = useState({
    generateRationale:    true,
    showSubScores:        true,
    includeCitations:     true,
    showReasoningBroker:  false,
    autoApproveConf:      80,
    autoDeclineConf:      80,
    lowConfThreshold:     60,
  })

  async function handleSaveKey() {
    if (!inputKey.trim()) { toast.error('API key cannot be empty'); return }
    setApiKey(inputKey.trim())
    toast.success('API key saved')
  }

  async function handleTest() {
    const key = inputKey.trim() || apiKey
    if (!key) { toast.error('Enter an API key first'); return }
    setTesting(true)
    const result = await testConnection(key)
    setConnStatus(result)
    setTesting(false)
    if (result.success) toast.success(`Connected — ${result.ms}ms response time`)
    else toast.error('Connection failed', { description: result.error })
  }

  function toggle(key) {
    setSettings((s) => ({ ...s, [key]: !s[key] }))
  }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="AI Model Settings" />

      {/* API Connection */}
      <div className="card p-5 space-y-4">
        <div className="flex items-center justify-between">
          <div className="font-semibold">API Connection</div>
          <div className="flex items-center gap-2 text-sm">
            {apiKey
              ? connStatus?.success
                ? <><Wifi size={14} className="text-positive" /><span className="text-positive-text">Connected</span></>
                : <><Wifi size={14} className="text-ink-tertiary" /><span className="text-ink-secondary">Not tested</span></>
              : <><WifiOff size={14} className="text-ink-tertiary" /><span className="text-ink-tertiary">No key</span></>
            }
          </div>
        </div>

        <FormGroup label="AI API Key" hint="Your key is stored in browser memory only and never sent to any server except the AI model endpoint.">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                type={showKey ? 'text' : 'password'}
                value={inputKey}
                onChange={(e) => setInputKey(e.target.value)}
                placeholder="Enter your API key…"
                className="pr-10"
              />
              <button
                onClick={() => setShowKey((s) => !s)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary"
              >
                {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            <Button variant="secondary" onClick={handleSaveKey}>Save</Button>
            <Button variant="secondary" onClick={handleTest} loading={testing}>Test</Button>
          </div>
        </FormGroup>

        <div className="flex items-center justify-between text-sm">
          <span className="text-ink-secondary">Model</span>
          <span className="font-mono text-xs bg-surface-secondary border border-line px-2 py-1 rounded">{MODEL}</span>
        </div>

        {connStatus && (
          <div className={cn('text-xs p-2 rounded border', connStatus.success
            ? 'bg-positive-light border-positive/30 text-positive-text'
            : 'bg-destructive-light border-destructive/30 text-destructive-text')}>
            {connStatus.success
              ? `✓ Connected — Response time: ${connStatus.ms}ms`
              : `✗ Error: ${connStatus.error}`
            }
          </div>
        )}
      </div>

      {/* Automation thresholds */}
      <div className="card p-5">
        <div className="font-semibold mb-4">Global Automation Thresholds</div>
        <div className="text-xs text-ink-secondary mb-4">These are global defaults. Carrier-specific settings override these.</div>
        {[
          { label:'Auto-Approve Confidence Minimum', key:'autoApproveConf', desc:'Minimum confidence to auto-approve a submission.' },
          { label:'Auto-Decline Confidence Minimum', key:'autoDeclineConf', desc:'Minimum confidence to auto-decline.' },
          { label:'Low-Confidence Routing Threshold', key:'lowConfThreshold', desc:'Below this threshold, always route to human review.' },
        ].map(({ label, key, desc }) => (
          <div key={key} className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{label}</span>
              <span className="text-brand font-bold">{settings[key]}%</span>
            </div>
            <input
              type="range" min={0} max={100}
              value={settings[key]}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: +e.target.value }))}
              className="w-full accent-brand"
            />
            <div className="text-xs text-ink-tertiary mt-0.5">{desc}</div>
          </div>
        ))}
      </div>

      {/* Explainability settings */}
      <div className="card p-5 space-y-4">
        <div className="font-semibold">Explainability Settings</div>
        {[
          { label:'Always generate plain English rationale', key:'generateRationale', desc:'Include 3–5 bullet reasoning points in every assessment.' },
          { label:'Show risk sub-scores to underwriters',    key:'showSubScores',      desc:'Display liability, financial, claims, and industry sub-scores.' },
          { label:'Include regulatory citations',           key:'includeCitations',   desc:'Reference specific statutes in compliance notes.' },
        ].map(({ label, key, desc }) => (
          <Switch key={key} checked={settings[key]} onCheckedChange={() => toggle(key)} label={label} description={desc} />
        ))}
        <div className="border-t border-line pt-4">
          <Switch
            checked={settings.showReasoningBroker}
            onCheckedChange={() => toggle('showReasoningBroker')}
            label="Show AI reasoning to brokers"
            description="Enables brokers to see internal AI reasoning."
          />
          {settings.showReasoningBroker && (
            <Banner variant="warning" className="mt-2 text-xs">
              Exposing AI reasoning to brokers may create regulatory liability. Consult your compliance officer before enabling.
            </Banner>
          )}
        </div>
      </div>

      {/* Compliance checklist */}
      <div className="card p-5">
        <div className="font-semibold mb-4">Bias & Fairness Compliance</div>
        <div className="space-y-2">
          {COMPLIANCE_ITEMS.map((item) => (
            <div key={item} className="flex items-center gap-3 py-2 border-b border-line last:border-0">
              <CheckCircle2 size={16} className="text-positive flex-shrink-0" />
              <span className="text-sm text-ink-primary">{item}</span>
              <Badge variant="success" className="ml-auto">Compliant</Badge>
            </div>
          ))}
        </div>
      </div>

      {/* System prompt editor */}
      <div className="card p-5">
        <div className="flex items-center justify-between mb-1">
          <div className="font-semibold">System Prompt</div>
          {promptDirty && <span className="text-xs text-caution-text">Unsaved changes</span>}
        </div>
        <div className="text-xs text-ink-secondary mb-3">
          Base prompt used for all AI calls. Carrier and state rules are injected at the{' '}
          <span className="font-mono bg-surface-secondary px-1 rounded">[INJECTION POINT]</span> markers below.
          Changes take effect immediately on the next AI call.
        </div>
        <textarea
          value={promptText}
          onChange={(e) => { setPromptText(e.target.value); setPromptDirty(true) }}
          rows={14}
          className="w-full text-xs font-mono bg-surface-secondary border border-line rounded p-3
                     text-ink-primary resize-y focus:outline-none focus:border-brand transition-colors"
          spellCheck={false}
        />
        <div className="flex items-center gap-2 mt-3">
          <Button size="sm" onClick={() => { toast.success('System prompt saved'); setPromptDirty(false) }}
            disabled={!promptDirty}>
            Save Prompt
          </Button>
          <Button size="sm" variant="secondary"
            onClick={() => { setPromptText(BASE_PROMPT); setPromptDirty(false); toast.info('Reset to default') }}>
            Reset to Default
          </Button>
        </div>
      </div>

      <Button onClick={() => toast.success('AI settings saved')}>Save All Settings</Button>
    </div>
  )
}
