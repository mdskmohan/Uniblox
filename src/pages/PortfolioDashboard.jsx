import useAppStore from '@/store/useAppStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { KPICard, KPIGrid } from '@/components/shared/KPICard'
import { Banner } from '@/components/shared/Banner'
import { StatusBadge } from '@/components/ui/badge'
import { RiskScoreCell } from '@/components/shared/RiskScore'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts'
import { cn } from '@/lib/utils'

const STATUS_COLORS = {
  APPROVED:   'var(--success)',
  DECLINED:   'var(--danger)',
  REFERRED:   'var(--purple)',
  PENDING:    'var(--warning)',
  PROCESSING: 'var(--accent)',
}

const INDUSTRY_COLORS = [
  '#2383E2','#0F9D58','#F4A623','#D93025','#6940D6',
  '#00ACC1','#FF7043','#7CB342',
]

const TREND_DATA = [
  { month:'Feb', approve:68, refer:22, decline:10 },
  { month:'Mar', approve:71, refer:20, decline:9  },
  { month:'Apr', approve:65, refer:25, decline:10 },
  { month:'May', approve:74, refer:19, decline:7  },
  { month:'Jun', approve:70, refer:21, decline:9  },
  { month:'Jul', approve:76, refer:17, decline:7  },
  { month:'Aug', approve:72, refer:20, decline:8  },
  { month:'Sep', approve:69, refer:23, decline:8  },
  { month:'Oct', approve:75, refer:18, decline:7  },
  { month:'Nov', approve:78, refer:16, decline:6  },
  { month:'Dec', approve:73, refer:20, decline:7  },
  { month:'Jan', approve:73, refer:19, decline:8  },
]

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="custom-tooltip">
      <div className="font-semibold mb-1">{label}</div>
      {payload.map((p) => (
        <div key={p.name} className="flex items-center gap-2 text-xs">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span>{p.name}: {p.value}%</span>
        </div>
      ))}
    </div>
  )
}

export default function PortfolioDashboard() {
  const { submissions, enrollments } = useAppStore()

  // Status counts
  const statusData = ['APPROVED','DECLINED','REFERRED','PENDING','PROCESSING'].map((s) => ({
    name: s, value: submissions.filter((sub) => sub.status === s).length
  })).filter((d) => d.value > 0)

  // Industry distribution
  const industryCounts = {}
  submissions.forEach((s) => {
    industryCounts[s.industry] = (industryCounts[s.industry] || 0) + 1
  })
  const industryData = Object.entries(industryCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, value]) => ({ name, value }))

  // Risk histogram
  const buckets = Array.from({ length: 10 }, (_, i) => ({
    range: `${i * 10}–${i * 10 + 9}`,
    count: submissions.filter((s) => s.riskScore != null && s.riskScore >= i * 10 && s.riskScore < i * 10 + 10).length,
    fill: i < 4 ? 'var(--success)' : i < 7 ? 'var(--warning)' : 'var(--danger)',
  }))

  // Portfolio concentration
  const total = submissions.length
  const concentration = Object.entries(industryCounts)
    .map(([industry, count]) => ({ industry, count, pct: (count / total) * 100 }))
    .filter((d) => d.pct >= 25)

  // Top groups from enrollments
  const topGroups = enrollments.slice(0, 5)

  const estPremium = enrollments.reduce((a, b) => a + b.enrolledCount * 320, 0)

  return (
    <div>
      <PageHeader title="Portfolio Dashboard" />

      {/* Concentration warnings */}
      {concentration.map(({ industry, pct }) => (
        <Banner key={industry} variant="warning" className="mb-3"
          title="Portfolio Concentration Alert">
          <strong>{industry}</strong> represents {pct.toFixed(1)}% of submissions.
          Consider reviewing appetite limits for this sector.
        </Banner>
      ))}

      {/* KPIs */}
      <KPIGrid cols={6}>
        <KPICard label="Active Groups"       value={enrollments.length}                     trendDir="neutral" />
        <KPICard label="Enrolled Employees"  value={enrollments.reduce((a,b)=>a+b.enrolledCount,0).toLocaleString()} trendDir="neutral" />
        <KPICard label="Est. Gross Premium"  value={`$${(estPremium/1000000).toFixed(1)}M`} trendDir="neutral" />
        <KPICard label="Auto-Decision Rate"  value="73%"                                    trendDir="neutral" />
        <KPICard label="Avg Risk Score"      value={Math.round(submissions.reduce((a,b)=>a+(b.riskScore||0),0)/submissions.length)} trendDir="neutral" />
        <KPICard label="Compliance Score"    value="96%"                                    trendDir="neutral" />
      </KPIGrid>

      {/* Charts row 1 */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Status bar chart */}
        <div className="card p-5">
          <div className="font-semibold mb-4">Submissions by Status</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={statusData} layout="vertical" margin={{ left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={80} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="custom-tooltip">{payload[0].name}: {payload[0].value}</div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {statusData.map((entry) => (
                  <Cell key={entry.name} fill={STATUS_COLORS[entry.name] || 'var(--accent)'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Risk histogram */}
        <div className="card p-5">
          <div className="font-semibold mb-4">Risk Score Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={buckets} margin={{ left: -10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="range" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="custom-tooltip">Score {payload[0]?.payload?.range}: {payload[0].value} submissions</div>
                  ) : null
                }
              />
              <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                {buckets.map((b, i) => <Cell key={i} fill={b.fill} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-2 gap-5 mb-5">
        {/* Trend line */}
        <div className="card p-5">
          <div className="font-semibold mb-4">Decision Trend — Last 12 Months</div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={TREND_DATA}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} unit="%" domain={[0, 100]} />
              <Tooltip content={<CustomTooltip />} />
              <Legend iconSize={10} iconType="circle" />
              <Line type="monotone" dataKey="approve" name="Auto-Approve" stroke="var(--success)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="refer"   name="Refer"        stroke="var(--warning)" strokeWidth={2} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="decline" name="Decline"      stroke="var(--danger)"  strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Industry distribution */}
        <div className="card p-5">
          <div className="font-semibold mb-4">Industry Distribution</div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={industryData} layout="vertical" margin={{ left: 60 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} />
              <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={70} />
              <Tooltip
                content={({ active, payload }) =>
                  active && payload?.length ? (
                    <div className="custom-tooltip">{payload[0]?.payload?.name}: {payload[0].value}</div>
                  ) : null
                }
              />
              <Bar dataKey="value" radius={[0, 4, 4, 0]}>
                {industryData.map((_, i) => <Cell key={i} fill={INDUSTRY_COLORS[i % INDUSTRY_COLORS.length]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom panels */}
      <div className="grid grid-cols-2 gap-5">
        {/* Top groups */}
        <div className="card">
          <div className="px-5 py-4 border-b border-line font-semibold">Top Enrollment Groups</div>
          <table className="w-full data-table">
            <thead>
              <tr><th>Group</th><th>Industry</th><th>Employees</th><th>Participation</th></tr>
            </thead>
            <tbody>
              {topGroups.map((g) => (
                <tr key={g.id}>
                  <td className="font-medium text-sm">{g.groupName}</td>
                  <td className="text-sm text-ink-secondary">{g.industry}</td>
                  <td className="tabular-nums">{g.enrolledCount.toLocaleString()}</td>
                  <td>
                    <span className={cn('text-sm font-medium',
                      g.participationRate >= 80 ? 'text-positive-text' : g.participationRate >= 60 ? 'text-caution-text' : 'text-destructive-text'
                    )}>
                      {g.participationRate.toFixed(1)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Concentration alerts */}
        <div className="card p-5">
          <div className="font-semibold mb-4">Portfolio Concentration</div>
          {industryData.slice(0, 5).map(({ name, value }, i) => {
            const pct = (value / total) * 100
            return (
              <div key={name} className="mb-3">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-ink-secondary">{name}</span>
                  <span className={cn('font-medium', pct >= 25 ? 'text-caution-text' : 'text-ink-primary')}>
                    {pct.toFixed(1)}% {pct >= 25 && '⚠'}
                  </span>
                </div>
                <div className="h-2 bg-surface-tertiary rounded-full overflow-hidden">
                  <div
                    className={cn('h-full rounded-full', pct >= 25 ? 'bg-caution' : 'bg-brand')}
                    style={{ width: `${Math.min(pct, 100)}%`, background: INDUSTRY_COLORS[i] }}
                  />
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
