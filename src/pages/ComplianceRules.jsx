import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, PauseCircle, Trash2, Plus, AlertTriangle } from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Banner } from '@/components/shared/Banner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input, FormGroup } from '@/components/ui/input'
import { cn } from '@/lib/utils'

const INITIAL_RULES = [
  { id: 1, category: 'Protected Classes',  rule: 'Prohibited factors excluded from all risk scoring', status: 'Active', ref: 'HIPAA, ADA, GINA' },
  { id: 2, category: 'Guaranteed Issue',   rule: 'Auto-decline blocked for GI-eligible small groups', status: 'Active', ref: 'State-specific' },
  { id: 3, category: 'Community Rating',   rule: 'Health-status rating prohibited for applicable states', status: 'Active', ref: 'ACA, state law' },
  { id: 4, category: 'Adverse Action',     rule: 'Notice generated and tracked for all declines',     status: 'Active', ref: 'ECOA, state law' },
  { id: 5, category: 'ERISA Preemption',   rule: 'State regs preempted for self-funded plans',        status: 'Active', ref: 'ERISA § 514' },
  { id: 6, category: 'PHI / HIPAA',        rule: 'EOI decisions require manual authorization',        status: 'Active', ref: 'HIPAA Privacy Rule' },
  { id: 7, category: 'Audit Trail',        rule: '7-year immutable log of all AI decisions',          status: 'Active', ref: 'State regulations' },
  { id: 8, category: 'Confidence Routing', rule: 'Below 60% confidence → mandatory human review',    status: 'Active', ref: 'Internal policy' },
  { id: 9, category: 'Disparate Impact',   rule: 'Override patterns monitored for bias',             status: 'Active', ref: 'Title VII, FHA' },
]

const CATEGORY_OPTIONS = [
  'Protected Classes', 'Guaranteed Issue', 'Community Rating', 'Adverse Action',
  'ERISA Preemption', 'PHI / HIPAA', 'Audit Trail', 'Confidence Routing', 'Disparate Impact', 'Custom',
]

const BLANK_FORM = { category: 'Custom', rule: '', ref: '' }

export default function ComplianceRules() {
  const [rules,   setRules]   = useState(INITIAL_RULES)
  const [dirty,   setDirty]   = useState(false)
  const [adding,  setAdding]  = useState(false)
  const [form,    setForm]    = useState(BLANK_FORM)
  const [confirm, setConfirm] = useState(null) // id pending delete

  function toggleStatus(id) {
    setRules((rs) => rs.map((r) =>
      r.id === id ? { ...r, status: r.status === 'Active' ? 'Paused' : 'Active' } : r
    ))
    setDirty(true)
  }

  function deleteRule(id) {
    setRules((rs) => rs.filter((r) => r.id !== id))
    setDirty(true)
    setConfirm(null)
    toast.success('Rule removed')
  }

  function addRule() {
    if (!form.rule.trim()) { toast.error('Rule description is required'); return }
    const newRule = { id: Date.now(), ...form, status: 'Active' }
    setRules((rs) => [...rs, newRule])
    setDirty(true)
    setAdding(false)
    setForm(BLANK_FORM)
    toast.success('Rule added')
  }

  function saveChanges() {
    toast.success('Compliance rules saved')
    setDirty(false)
  }

  const active = rules.filter((r) => r.status === 'Active').length
  const paused = rules.filter((r) => r.status === 'Paused').length

  return (
    <div className="max-w-3xl space-y-5">
      <div className="flex items-start justify-between gap-4">
        <PageHeader
          title="Compliance Rules"
          subtitle="Rules enforced by the compliance engine on every submission."
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {dirty && (
            <Button onClick={saveChanges}>Save Changes</Button>
          )}
          <Button variant="secondary" onClick={() => { setAdding(true); setForm(BLANK_FORM) }}>
            <Plus size={14} /> Add Rule
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-3 text-sm text-ink-secondary">
        <span><strong className="text-ink-primary">{active}</strong> active</span>
        {paused > 0 && <span><strong className="text-caution-text">{paused}</strong> paused</span>}
        <span className="text-ink-tertiary">· {rules.length} total</span>
      </div>

      {paused > 0 && (
        <Banner variant="warning">
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className="flex-shrink-0" />
            <span>{paused} rule{paused > 1 ? 's are' : ' is'} paused. Paused rules are NOT enforced.</span>
          </div>
        </Banner>
      )}

      <div className="card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Category</th>
              <th>Rule</th>
              <th>Status</th>
              <th>Reference</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rules.map((r) => (
              <tr key={r.id} className={cn(r.status === 'Paused' && 'opacity-60')}>
                <td>
                  <Badge variant="info">{r.category}</Badge>
                </td>
                <td className="font-medium text-sm">{r.rule}</td>
                <td>
                  <button
                    onClick={() => toggleStatus(r.id)}
                    className="flex items-center gap-1.5 text-xs font-medium transition-colors hover:opacity-80"
                  >
                    {r.status === 'Active'
                      ? <><CheckCircle2 size={13} className="text-positive" /><span className="text-positive-text">Active</span></>
                      : <><PauseCircle  size={13} className="text-caution"  /><span className="text-caution-text">Paused</span></>
                    }
                  </button>
                </td>
                <td className="text-xs text-ink-tertiary font-mono">{r.ref}</td>
                <td>
                  {confirm === r.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => deleteRule(r.id)}
                        className="text-xs text-destructive-text hover:underline"
                      >Confirm</button>
                      <span className="text-ink-tertiary">·</span>
                      <button
                        onClick={() => setConfirm(null)}
                        className="text-xs text-ink-secondary hover:underline"
                      >Cancel</button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirm(r.id)}
                      className="text-ink-tertiary hover:text-destructive-text transition-colors"
                      title="Delete rule"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add rule form */}
      {adding && (
        <div className="card p-5 space-y-4 border-brand/40">
          <div className="font-semibold text-sm">New Compliance Rule</div>
          <div className="grid grid-cols-2 gap-4">
            <FormGroup label="Category">
              <select
                value={form.category}
                onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                           focus:outline-none focus:border-brand text-ink-primary"
              >
                {CATEGORY_OPTIONS.map((c) => <option key={c}>{c}</option>)}
              </select>
            </FormGroup>
            <FormGroup label="Regulatory Reference">
              <Input
                value={form.ref}
                onChange={(e) => setForm((f) => ({ ...f, ref: e.target.value }))}
                placeholder="e.g. HIPAA § 164.512"
              />
            </FormGroup>
          </div>
          <FormGroup label="Rule Description">
            <Input
              value={form.rule}
              onChange={(e) => setForm((f) => ({ ...f, rule: e.target.value }))}
              placeholder="Describe what this rule enforces…"
            />
          </FormGroup>
          <div className="flex items-center gap-2">
            <Button size="sm" onClick={addRule}>Add Rule</Button>
            <Button size="sm" variant="secondary" onClick={() => { setAdding(false); setForm(BLANK_FORM) }}>Cancel</Button>
          </div>
        </div>
      )}
    </div>
  )
}
