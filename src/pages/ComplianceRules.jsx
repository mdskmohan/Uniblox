import { PageHeader } from '@/components/shared/PageHeader'
import { Banner } from '@/components/shared/Banner'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

const RULES = [
  { category:'Protected Classes',    rule:'Prohibited factors excluded from all risk scoring', status:'Active', ref:'HIPAA, ADA, GINA' },
  { category:'Guaranteed Issue',     rule:'Auto-decline blocked for GI-eligible small groups', status:'Active', ref:'State-specific' },
  { category:'Community Rating',     rule:'Health-status rating prohibited for applicable states', status:'Active', ref:'ACA, state law' },
  { category:'Adverse Action',       rule:'Notice generated and tracked for all declines',     status:'Active', ref:'ECOA, state law' },
  { category:'ERISA Preemption',     rule:'State regs preempted for self-funded plans',        status:'Active', ref:'ERISA § 514' },
  { category:'PHI / HIPAA',          rule:'EOI decisions require manual authorization',        status:'Active', ref:'HIPAA Privacy Rule' },
  { category:'Audit Trail',          rule:'7-year immutable log of all AI decisions',          status:'Active', ref:'State regulations' },
  { category:'Confidence Routing',   rule:'Below 60% confidence → mandatory human review',    status:'Active', ref:'Internal policy' },
  { category:'Disparate Impact',     rule:'Override patterns monitored for bias',              status:'Active', ref:'Title VII, FHA' },
]

export default function ComplianceRules() {
  return (
    <div className="max-w-3xl">
      <PageHeader title="Compliance Rules" subtitle="Active compliance engine rules governing AI behavior." />

      <Banner variant="info" className="mb-5">
        These rules are automatically enforced by the compliance engine on every submission.
        They cannot be overridden by individual underwriters — only compliance officers can modify these settings.
      </Banner>

      <div className="card overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr><th>Category</th><th>Rule</th><th>Status</th><th>Reference</th></tr>
          </thead>
          <tbody>
            {RULES.map((r) => (
              <tr key={r.rule}>
                <td>
                  <Badge variant="info">{r.category}</Badge>
                </td>
                <td className="font-medium text-sm">{r.rule}</td>
                <td>
                  <div className="flex items-center gap-1.5 text-positive-text text-xs font-medium">
                    <CheckCircle2 size={13} /> {r.status}
                  </div>
                </td>
                <td className="text-xs text-ink-tertiary font-mono">{r.ref}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
