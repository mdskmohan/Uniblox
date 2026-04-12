import { useState } from 'react'
import { toast } from 'sonner'
import {
  CreditCard, CheckCircle2, Zap, Shield, BarChart2,
  Download, ChevronRight, Users, Activity, AlertTriangle
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'

const PLANS = [
  {
    id: 'growth',
    name: 'Growth',
    price: '$499',
    period: '/mo',
    desc: 'For growing underwriting teams',
    features: ['Up to 5 users', '500 submissions/mo', '3 carriers', 'Standard support', 'API access'],
    current: false,
  },
  {
    id: 'professional',
    name: 'Professional',
    price: '$1,299',
    period: '/mo',
    desc: 'For established insurance operations',
    features: ['Up to 20 users', 'Unlimited submissions', 'Unlimited carriers', 'Priority support (4h SLA)', 'API + Webhooks', 'SSO / SAML', 'Custom compliance rules'],
    current: true,
    badge: 'Current Plan',
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    desc: 'For large carriers and MGAs',
    features: ['Unlimited users', 'Dedicated infrastructure', 'White-label portal', '24/7 dedicated support', 'Custom AI model fine-tuning', 'On-premise option', 'SLA guarantees'],
    current: false,
    cta: 'Contact Sales',
  },
]

const INVOICES = [
  { id: 'INV-2024-012', date: 'Jan 1, 2024',  amount: '$1,299.00', status: 'paid' },
  { id: 'INV-2023-011', date: 'Dec 1, 2023',  amount: '$1,299.00', status: 'paid' },
  { id: 'INV-2023-010', date: 'Nov 1, 2023',  amount: '$1,299.00', status: 'paid' },
  { id: 'INV-2023-009', date: 'Oct 1, 2023',  amount: '$1,299.00', status: 'paid' },
]

const USAGE = [
  { label: 'Team Members',  used: 6,   limit: 20,    unit: 'users' },
  { label: 'Submissions',   used: 284, limit: null,  unit: 'this month' },
  { label: 'Carriers',      used: 3,   limit: null,  unit: 'configured' },
  { label: 'API Calls',     used: 12847, limit: null, unit: 'this month' },
]

export default function Billing() {
  const [billingTab, setBillingTab] = useState('overview')

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Billing & Plan"
        subtitle="Manage your subscription, payment method, and invoices."
      />

      {/* Tabs */}
      <div className="flex border-b border-line mb-5 -mt-2">
        {[
          { id: 'overview', label: 'Overview' },
          { id: 'plans',    label: 'Plans' },
          { id: 'invoices', label: 'Invoices' },
        ].map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setBillingTab(id)}
            className={cn(
              'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              billingTab === id
                ? 'text-brand border-brand'
                : 'text-ink-secondary border-transparent hover:text-ink-primary'
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── OVERVIEW ── */}
      {billingTab === 'overview' && (
        <div className="space-y-5">
          {/* Current plan card */}
          <div className="card p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg font-bold text-ink-primary">Professional Plan</span>
                  <Badge variant="success">Active</Badge>
                </div>
                <div className="text-sm text-ink-secondary">$1,299 / month · Renews February 1, 2024</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => setBillingTab('plans')}>
                Change Plan
              </Button>
            </div>

            <div className="mt-4 pt-4 border-t border-line grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-ink-tertiary mb-1">Next invoice</div>
                <div className="text-sm font-semibold text-ink-primary">$1,299.00 on Feb 1, 2024</div>
              </div>
              <div>
                <div className="text-xs text-ink-tertiary mb-1">Billing cycle</div>
                <div className="text-sm font-semibold text-ink-primary">Monthly</div>
              </div>
            </div>
          </div>

          {/* Usage */}
          <div className="card p-5">
            <div className="font-semibold text-ink-primary mb-4">Current Usage</div>
            <div className="space-y-4">
              {USAGE.map(({ label, used, limit, unit }) => (
                <div key={label}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-ink-secondary">{label}</span>
                    <span className="font-medium text-ink-primary">
                      {used.toLocaleString()} {limit ? `/ ${limit}` : ''} <span className="text-ink-tertiary font-normal">{unit}</span>
                    </span>
                  </div>
                  {limit && (
                    <div className="h-1.5 bg-surface-secondary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          used / limit > 0.9 ? 'bg-destructive' : used / limit > 0.7 ? 'bg-caution' : 'bg-brand'
                        )}
                        style={{ width: `${Math.min((used / limit) * 100, 100)}%` }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Payment method */}
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="font-semibold text-ink-primary">Payment Method</div>
              <Button variant="secondary" size="sm" onClick={() => toast.info('Update payment method')}>
                Update
              </Button>
            </div>
            <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-line">
              <div className="w-10 h-7 bg-white border border-line rounded flex items-center justify-center">
                <CreditCard size={16} className="text-ink-secondary" />
              </div>
              <div>
                <div className="text-sm font-medium text-ink-primary">Visa ending in 4242</div>
                <div className="text-xs text-ink-tertiary">Expires 08/26</div>
              </div>
              <Badge variant="success" className="ml-auto">Default</Badge>
            </div>
          </div>
        </div>
      )}

      {/* ── PLANS ── */}
      {billingTab === 'plans' && (
        <div className="grid grid-cols-3 gap-4">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                'card p-5 flex flex-col',
                plan.current && 'ring-2 ring-brand'
              )}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-bold text-ink-primary">{plan.name}</div>
                {plan.badge && <Badge variant="info" className="text-[10px]">{plan.badge}</Badge>}
              </div>
              <div className="text-xs text-ink-secondary mb-4">{plan.desc}</div>
              <div className="mb-4">
                <span className="text-2xl font-bold text-ink-primary">{plan.price}</span>
                <span className="text-sm text-ink-tertiary">{plan.period}</span>
              </div>
              <ul className="space-y-2 flex-1 mb-5">
                {plan.features.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-ink-secondary">
                    <CheckCircle2 size={13} className="text-positive flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              {plan.current ? (
                <Button disabled className="w-full">Current Plan</Button>
              ) : (
                <Button
                  variant={plan.id === 'enterprise' ? 'secondary' : 'primary'}
                  className="w-full"
                  onClick={() => toast.info(plan.id === 'enterprise' ? 'Contacting sales...' : `Upgrading to ${plan.name}`)}
                >
                  {plan.cta || `Upgrade to ${plan.name}`}
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── INVOICES ── */}
      {billingTab === 'invoices' && (
        <div className="card overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Invoice</th>
                <th>Date</th>
                <th>Amount</th>
                <th>Status</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {INVOICES.map((inv) => (
                <tr key={inv.id}>
                  <td className="font-mono text-sm">{inv.id}</td>
                  <td className="text-sm text-ink-secondary">{inv.date}</td>
                  <td className="text-sm font-medium text-ink-primary">{inv.amount}</td>
                  <td>
                    <Badge variant={inv.status === 'paid' ? 'success' : 'warning'}>
                      {inv.status === 'paid' ? 'Paid' : 'Pending'}
                    </Badge>
                  </td>
                  <td>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toast.info(`Downloading ${inv.id}`)}
                    >
                      <Download size={13} /> PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
