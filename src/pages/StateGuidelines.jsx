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

  const q = search.trim().toUpperCase()
  const filtered = ALL_STATES.filter((s) =>
    !q || s.includes(q) || STATE_NAMES[s]?.toUpperCase().includes(search.trim().toUpperCase())
  )

  const featured = filtered.filter((s) => FEATURED_STATES.includes(s))
  const others   = filtered.filter((s) => !FEATURED_STATES.includes(s))

  return (
    <div className="flex gap-5">
      {/* Left: state selector */}
      <div className="w-56 flex-shrink-0">
        <PageHeader title="State Guidelines" className="mb-3" />
        <Input
          placeholder="Search states…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="mb-3"
        />

        {featured.length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider px-1 mb-1">
              Full Detail
            </div>
            {featured.map((s) => (
              <StateButton key={s} state={s} name={STATE_NAMES[s]} selected={selected} onClick={setSelected} />
            ))}
          </>
        )}

        {others.length > 0 && (
          <>
            <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider px-1 mb-1 mt-3">
              All States
            </div>
            <div className="flex flex-wrap gap-1">
              {others.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelected(s)}
                  title={STATE_NAMES[s]}
                  className={cn(
                    'px-2 py-1 text-xs rounded border transition-colors',
                    s === selected
                      ? 'bg-brand text-white border-brand'
                      : 'border-line text-ink-secondary hover:border-brand hover:text-brand'
                  )}
                >
                  {s}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: state detail */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-sm font-bold text-brand">
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
          {/* GI / Rating */}
          <DetailCard title="Guaranteed Issue & Rating">
            {[
              ['Small Group Limit',    `≤ ${rules.smallGroupLimit} employees`],
              ['Guaranteed Issue',     rules.guaranteedIssue ? `Yes (groups ≤ ${rules.guaranteedIssueUpTo})` : 'No'],
              ['Community Rating',     rules.communityRatingRequired ? 'Required' : 'Not required'],
              ['Regulatory Reference', rules.regulatoryReference],
            ]}
          </DetailCard>

          {/* Auto-decline */}
          <DetailCard title="Auto-Decline Rules">
            {[
              ['Auto-Decline Permitted', rules.autoDeclinePermitted ? 'Yes (large groups)' : 'PROHIBITED for small groups'],
              ['Conditions', rules.autoDeclineConditions],
            ]}
          </DetailCard>

          {/* Adverse action */}
          <DetailCard title="Adverse Action Requirements">
            {[
              ['Notice Deadline',   `${rules.adverseActionNoticeDays} calendar days`],
              ['Notice Format',     rules.adverseActionNoticeFormat?.replace(/_/g, ' ')],
              ['Required Language', rules.adverseActionRequiredLanguage],
            ]}
          </DetailCard>

          {/* Prohibited factors */}
          <DetailCard title="Prohibited Risk Factors">
            <div className="flex flex-wrap gap-1 mt-1">
              {rules.prohibitedRiskFactors.map((f) => (
                <Badge key={f} variant="danger" className="text-[11px]">{f}</Badge>
              ))}
            </div>
          </DetailCard>

          {/* Special requirements */}
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

          {/* Filing & continuance */}
          <DetailCard title="Filing & Continuance">
            {[
              ['Filing Requirements', rules.filingRequirements || 'Standard state filings'],
              ['Continuance Required', rules.continuanceRequired ? `Yes — ${rules.continuanceDays} days` : 'No'],
            ]}
          </DetailCard>
        </div>

        {/* Regulatory contact */}
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

function StateButton({ state, name, selected, onClick }) {
  return (
    <button
      onClick={() => onClick(state)}
      className={cn(
        'w-full text-left px-3 py-2 rounded text-sm border transition-colors mb-0.5 flex items-center gap-2',
        state === selected
          ? 'bg-brand-light border-brand text-brand font-medium'
          : 'border-transparent text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
      )}
    >
      <span className="font-mono text-[11px] text-ink-tertiary flex-shrink-0 w-6">{state}</span>
      <span className="truncate">{name}</span>
    </button>
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
