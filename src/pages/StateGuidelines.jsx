import { useState } from 'react'
import { getStateRules } from '@/store/sampleData'
import { PageHeader } from '@/components/shared/PageHeader'
import { Banner } from '@/components/shared/Banner'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

// States with full regulatory detail
const FEATURED_STATES = ['CA','NY','IL','TX','FL','WA','MA','NJ','PA','GA']

const STATE_NAMES = {
  AL:'Alabama', AK:'Alaska', AZ:'Arizona', AR:'Arkansas', CA:'California',
  CO:'Colorado', CT:'Connecticut', DE:'Delaware', FL:'Florida', GA:'Georgia',
  HI:'Hawaii', ID:'Idaho', IL:'Illinois', IN:'Indiana', IA:'Iowa',
  KS:'Kansas', KY:'Kentucky', LA:'Louisiana', ME:'Maine', MD:'Maryland',
  MA:'Massachusetts', MI:'Michigan', MN:'Minnesota', MS:'Mississippi', MO:'Missouri',
  MT:'Montana', NE:'Nebraska', NV:'Nevada', NH:'New Hampshire', NJ:'New Jersey',
  NM:'New Mexico', NY:'New York', NC:'North Carolina', ND:'North Dakota',
  OH:'Ohio', OK:'Oklahoma', OR:'Oregon', PA:'Pennsylvania', RI:'Rhode Island',
  SC:'South Carolina', SD:'South Dakota', TN:'Tennessee', TX:'Texas', UT:'Utah',
  VT:'Vermont', VA:'Virginia', WA:'Washington', WV:'West Virginia', WI:'Wisconsin',
  WY:'Wyoming', DC:'Washington D.C.',
}

const ALL_STATES = Object.keys(STATE_NAMES)

export default function StateGuidelines() {
  const [search,   setSearch]   = useState('')
  const [selected, setSelected] = useState('CA')

  const rules = getStateRules(selected)

  const filtered = ALL_STATES.filter((s) =>
    !search.trim() ||
    s.includes(search.trim().toUpperCase()) ||
    STATE_NAMES[s]?.toUpperCase().includes(search.trim().toUpperCase())
  )

  return (
    <div className="flex gap-5 h-full">

      {/* Left: scrollable state list */}
      <div className="w-56 flex-shrink-0 flex flex-col">
        <div className="mb-3">
          <h1 className="text-base font-semibold text-ink-primary mb-2">State Guidelines</h1>
          <Input
            placeholder="Search states…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto space-y-0.5 pr-1"
             style={{ maxHeight: 'calc(100vh - 180px)' }}>
          {filtered.map((s) => (
            <button
              key={s}
              onClick={() => setSelected(s)}
              className={cn(
                'w-full text-left px-3 py-2 rounded text-sm border transition-colors flex items-center gap-2',
                s === selected
                  ? 'bg-brand-light border-brand text-brand font-medium'
                  : 'border-transparent text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
              )}
            >
              <span className="font-mono text-[11px] text-ink-tertiary flex-shrink-0 w-6">{s}</span>
              <span className="truncate">{STATE_NAMES[s]}</span>
              {FEATURED_STATES.includes(s) && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" title="Full detail available" />
              )}
            </button>
          ))}
          {filtered.length === 0 && (
            <div className="text-sm text-ink-tertiary px-3 py-4 text-center">No states match</div>
          )}
        </div>
        <div className="pt-2 border-t border-line mt-2">
          <div className="flex items-center gap-1.5 text-[11px] text-ink-tertiary">
            <span className="w-1.5 h-1.5 rounded-full bg-brand flex-shrink-0" />
            Full detail available
          </div>
        </div>
      </div>

      {/* Right: state detail */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-sm font-bold text-brand flex-shrink-0">
            {selected}
          </div>
          <div>
            <h2 className="text-xl font-semibold text-ink-primary">
              {STATE_NAMES[selected] || rules.stateName || selected}
            </h2>
            <div className="text-sm text-ink-secondary">
              {rules.insuranceDepartmentName || `${STATE_NAMES[selected] || selected} Department of Insurance`}
            </div>
          </div>
          {FEATURED_STATES.includes(selected)
            ? <Badge variant="info" className="ml-auto">Full Detail</Badge>
            : <Badge variant="gray" className="ml-auto">Standard Rules</Badge>
          }
        </div>

        {!FEATURED_STATES.includes(selected) && (
          <Banner variant="info" className="mb-4">
            Standard ACA / federal baseline rules apply for {STATE_NAMES[selected] || selected}.
            State-specific regulatory detail is available for CA, NY, IL, TX, FL, WA, MA, NJ, PA, and GA.
          </Banner>
        )}

        <div className="grid grid-cols-2 gap-4">
          <DetailCard title="Guaranteed Issue & Rating">
            {[
              ['Small Group Limit',    `≤ ${rules.smallGroupLimit} employees`],
              ['Guaranteed Issue',     rules.guaranteedIssue ? `Yes (groups ≤ ${rules.guaranteedIssueUpTo})` : 'No'],
              ['Community Rating',     rules.communityRatingRequired ? 'Required' : 'Not required'],
              ['Regulatory Reference', rules.regulatoryReference],
            ]}
          </DetailCard>

          <DetailCard title="Auto-Decline Rules">
            {[
              ['Auto-Decline Permitted', rules.autoDeclinePermitted ? 'Yes (large groups)' : 'PROHIBITED for small groups'],
              ['Conditions', rules.autoDeclineConditions],
            ]}
          </DetailCard>

          <DetailCard title="Adverse Action Requirements">
            {[
              ['Notice Deadline',   `${rules.adverseActionNoticeDays} calendar days`],
              ['Notice Format',     rules.adverseActionNoticeFormat?.replace(/_/g, ' ')],
              ['Required Language', rules.adverseActionRequiredLanguage],
            ]}
          </DetailCard>

          <DetailCard title="Prohibited Risk Factors">
            <div className="flex flex-wrap gap-1 mt-1">
              {rules.prohibitedRiskFactors.map((f) => (
                <Badge key={f} variant="danger" className="text-[11px]">{f}</Badge>
              ))}
            </div>
          </DetailCard>

          <DetailCard title="Special Requirements">
            {rules.specialRequirements?.length > 0 ? (
              <ul className="space-y-1">
                {rules.specialRequirements.map((r, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                    <span className="text-brand flex-shrink-0 font-bold">•</span>{r}
                  </li>
                ))}
              </ul>
            ) : <span className="text-sm text-ink-tertiary">None</span>}
          </DetailCard>

          <DetailCard title="Filing & Continuance">
            {[
              ['Filing Requirements', rules.filingRequirements || 'Standard state filings'],
              ['Continuance Required', rules.continuanceRequired ? `Yes — ${rules.continuanceDays} days` : 'No'],
            ]}
          </DetailCard>
        </div>

        <div className="card p-4 mt-4">
          <div className="font-semibold text-sm mb-2">Regulatory Contact</div>
          <div className="text-sm text-ink-secondary">
            {rules.insuranceDepartmentName || `${STATE_NAMES[selected] || selected} Department of Insurance`}
          </div>
          {rules.insuranceDepartmentWebsite && (
            <a
              href={rules.insuranceDepartmentWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-brand mt-1 block hover:underline"
            >
              {rules.insuranceDepartmentWebsite}
            </a>
          )}
          <div className="text-xs text-ink-tertiary mt-2">
            Last verified: January 2024 · Always verify with current regulatory sources before relying on this information.
          </div>
        </div>
      </div>
    </div>
  )
}

function DetailCard({ title, children }) {
  return (
    <div className="card p-4">
      <div className="font-semibold text-sm mb-3">{title}</div>
      {Array.isArray(children) ? (
        <div className="space-y-2">
          {children.map(([label, value]) => (
            <div key={label} className="border-b border-line pb-2 last:border-0">
              <div className="text-xs text-ink-tertiary">{label}</div>
              <div className="text-sm text-ink-primary mt-0.5">{value}</div>
            </div>
          ))}
        </div>
      ) : children}
    </div>
  )
}
