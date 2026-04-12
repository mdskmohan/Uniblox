import { useState } from 'react'
import { toast } from 'sonner'
import { Banner } from '@/components/shared/Banner'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const BENEFITS = [
  { id:'life',       label:'Life Insurance',      icon:'🛡️', current:'$50,000',  options:['$50,000','$100,000','$250,000','$500,000'], monthlyCost:['$0','$12','$28','$54'], giLimit:50000 },
  { id:'health',     label:'Medical',             icon:'🏥', current:'PPO Plan', options:['Waive','HDHP + HSA','PPO Plan','Premium PPO'], monthlyCost:['$0','$180','$320','$485'], giLimit:null },
  { id:'dental',     label:'Dental',              icon:'🦷', current:'Basic',    options:['Waive','Basic','Enhanced'], monthlyCost:['$0','$25','$48'], giLimit:null },
  { id:'vision',     label:'Vision',              icon:'👁️', current:'Standard', options:['Waive','Standard','Enhanced'], monthlyCost:['$0','$8','$16'], giLimit:null },
  { id:'disability', label:'Short-Term Disability',icon:'📋',current:'60% salary',options:['Waive','60% salary','80% salary'], monthlyCost:['$0','$22','$38'], giLimit:6000 },
]

export default function EmployeePortal() {
  const [screen,    setScreen]    = useState('welcome') // welcome | benefits | beneficiaries | confirm
  const [elections, setElections] = useState({ life:'$50,000', health:'PPO Plan', dental:'Basic', vision:'Standard', disability:'60% salary' })
  const [eoiAlert,  setEoiAlert]  = useState(null)

  function handleElection(benefitId, option, monthlyCost, giLimit) {
    setElections((prev) => ({ ...prev, [benefitId]: option }))
    // EOI trigger
    if (benefitId === 'life' && giLimit) {
      const amt = parseInt(option.replace(/[$,]/g, '')) || 0
      if (amt > giLimit) {
        setEoiAlert(`The Life Insurance amount you selected ($${amt.toLocaleString()}) requires Evidence of Insurability. An EOI form will be sent to your email within 24 hours.`)
      } else {
        setEoiAlert(null)
      }
    }
  }

  function getTotalCost() {
    let total = 0
    BENEFITS.forEach((b) => {
      const idx = b.options.indexOf(elections[b.id] || b.current)
      const cost = parseFloat((b.monthlyCost[idx] || '0').replace('$','')) || 0
      total += cost
    })
    return total.toFixed(2)
  }

  return (
    <div>
      <Banner variant="info" className="mb-5">
        <strong>Carrier Preview Mode</strong> — This is how employees experience enrollment. No data is saved.
      </Banner>

      {/* Browser mockup */}
      <div className="border border-line rounded-lg overflow-hidden bg-surface-secondary">
        {/* Browser chrome */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-surface-tertiary border-b border-line">
          <div className="flex gap-1.5">
            {['bg-destructive','bg-caution','bg-positive'].map((c) => (
              <div key={c} className={cn('w-3 h-3 rounded-full', c)} />
            ))}
          </div>
          <div className="flex-1 mx-4 bg-surface-primary border border-line rounded px-3 py-1 text-xs text-ink-tertiary font-mono">
            enrollment.acme-carrier.com
          </div>
        </div>

        {/* Portal content */}
        <div className="bg-white dark:bg-surface-primary min-h-[600px] p-8 max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 pb-5 border-b border-line">
            <div>
              <div className="text-2xl font-semibold text-ink-primary">Benefits Enrollment</div>
              <div className="text-sm text-ink-secondary mt-0.5">Powered by Acme Life & Benefits</div>
            </div>
            <div className="w-12 h-12 rounded-lg bg-brand/10 flex items-center justify-center text-xl">🏢</div>
          </div>

          {/* Step indicators */}
          <div className="flex items-center gap-0 mb-8">
            {['Welcome','Benefits','Beneficiaries','Confirm'].map((step, i) => {
              const idx = ['welcome','benefits','beneficiaries','confirm'].indexOf(screen)
              return (
                <div key={step} className="flex items-center">
                  <div className={cn(
                    'flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold',
                    i <= idx ? 'bg-brand text-white' : 'bg-surface-tertiary text-ink-tertiary'
                  )}>
                    {i + 1}
                  </div>
                  <span className={cn('text-xs mx-2', i === idx ? 'text-ink-primary font-medium' : 'text-ink-tertiary')}>{step}</span>
                  {i < 3 && <div className={cn('w-8 h-0.5', i < idx ? 'bg-brand' : 'bg-line')} />}
                </div>
              )
            })}
          </div>

          {/* Welcome screen */}
          {screen === 'welcome' && (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">👋</div>
              <h2 className="text-2xl font-semibold mb-2">Welcome, Sarah Johnson</h2>
              <p className="text-ink-secondary mb-2">TechNova Solutions — Annual Benefits Enrollment</p>
              <div className="bg-surface-secondary border border-line rounded-md p-4 text-sm text-ink-secondary mb-8 inline-block">
                Enrollment window: <strong>Jan 15 – Feb 15, 2024</strong><br />
                Effective date: <strong>February 1, 2024</strong>
              </div>
              <div className="flex justify-center">
                <Button onClick={() => setScreen('benefits')}>Begin Enrollment →</Button>
              </div>
            </div>
          )}

          {/* Benefits selection */}
          {screen === 'benefits' && (
            <div>
              <h2 className="text-xl font-semibold mb-1">Select Your Benefits</h2>
              <p className="text-sm text-ink-secondary mb-5">Review and update your coverage elections below.</p>

              {eoiAlert && (
                <div className="bg-caution-light border border-caution/30 rounded-md p-3 mb-4 text-sm text-caution-text">
                  ⚠ {eoiAlert}
                </div>
              )}

              <div className="space-y-3 mb-6">
                {BENEFITS.map((b) => (
                  <div key={b.id} className="border border-line rounded-lg p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">{b.icon}</span>
                      <div>
                        <div className="font-semibold text-ink-primary">{b.label}</div>
                        <div className="text-xs text-ink-tertiary">Current: {elections[b.id] || b.current}</div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {b.options.map((opt, i) => (
                        <button
                          key={opt}
                          onClick={() => handleElection(b.id, opt, b.monthlyCost[i], b.giLimit)}
                          className={cn(
                            'p-2.5 rounded-md border text-left text-sm transition-all',
                            (elections[b.id] || b.current) === opt
                              ? 'border-brand bg-brand-light'
                              : 'border-line hover:border-brand hover:bg-brand-light'
                          )}
                        >
                          <div className="font-medium">{opt}</div>
                          <div className="text-xs text-ink-secondary">{b.monthlyCost[i]}/mo</div>
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between bg-surface-secondary border border-line rounded-md p-4 mb-5">
                <span className="text-sm font-medium">Monthly Premium Total</span>
                <span className="text-2xl font-bold text-ink-primary">${getTotalCost()}/mo</span>
              </div>

              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setScreen('welcome')}>← Back</Button>
                <Button onClick={() => setScreen('beneficiaries')}>Continue: Beneficiaries →</Button>
              </div>
            </div>
          )}

          {/* Beneficiaries */}
          {screen === 'beneficiaries' && (
            <div>
              <h2 className="text-xl font-semibold mb-1">Beneficiary Designation</h2>
              <p className="text-sm text-ink-secondary mb-5">Designate who receives your life insurance benefit.</p>
              <div className="space-y-3 mb-6">
                {[{ name:'Michael Johnson', rel:'Spouse', pct:100 }].map((b) => (
                  <div key={b.name} className="flex items-center justify-between p-4 border border-line rounded-lg">
                    <div>
                      <div className="font-medium">{b.name}</div>
                      <div className="text-sm text-ink-secondary">{b.rel}</div>
                    </div>
                    <div className="text-lg font-bold text-positive-text">{b.pct}%</div>
                  </div>
                ))}
                <button onClick={() => toast.info('Add beneficiary form available in full deployment')}
                  className="w-full p-3 border-2 border-dashed border-line rounded-lg text-sm text-ink-tertiary hover:border-brand hover:text-brand transition-colors">
                  + Add Beneficiary
                </button>
              </div>
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setScreen('benefits')}>← Back</Button>
                <Button onClick={() => setScreen('confirm')}>Continue: Review →</Button>
              </div>
            </div>
          )}

          {/* Confirmation */}
          {screen === 'confirm' && (
            <div>
              <h2 className="text-xl font-semibold mb-1">Review & Confirm</h2>
              <p className="text-sm text-ink-secondary mb-5">Review your elections before submitting.</p>
              <div className="space-y-2 mb-4">
                {BENEFITS.map((b) => {
                  const opted = elections[b.id] || b.current
                  const idx = b.options.indexOf(opted)
                  return (
                    <div key={b.id} className="flex items-center justify-between py-2 border-b border-line">
                      <span className="text-sm text-ink-secondary">{b.label}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium">{opted}</span>
                        <span className="text-sm text-ink-tertiary">{b.monthlyCost[idx]}/mo</span>
                      </div>
                    </div>
                  )
                })}
                <div className="flex items-center justify-between py-2">
                  <span className="font-semibold">Monthly Total</span>
                  <span className="text-xl font-bold text-ink-primary">${getTotalCost()}/mo</span>
                </div>
              </div>
              {eoiAlert && (
                <div className="bg-caution-light border border-caution/30 rounded-md p-3 mb-4 text-xs text-caution-text">
                  ⚠ {eoiAlert}
                </div>
              )}
              <div className="flex justify-between">
                <Button variant="secondary" onClick={() => setScreen('beneficiaries')}>← Back</Button>
                <Button onClick={() => { toast.success('Enrollment submitted! Effective Feb 1, 2024'); setScreen('welcome') }}>
                  Submit Enrollment ✓
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
