import { useState } from 'react'
import { toast } from 'sonner'
import { CheckCircle2, XCircle, Wifi, WifiOff } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { testConnection, MODEL } from '@/engine/ai'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/shared/PageHeader'
import { KPICard, KPIGrid } from '@/components/shared/KPICard'
import { Banner } from '@/components/shared/Banner'
import { StatusBadge, Badge } from '@/components/ui/badge'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts'
import { cn } from '@/lib/utils'

const CALIBRATION_DATA = [
  { band:'0–20%',  accuracy:52 },
  { band:'20–40%', accuracy:61 },
  { band:'40–60%', accuracy:72 },
  { band:'60–80%', accuracy:84 },
  { band:'80–100%',accuracy:93 },
]

// Simulated accuracy table (last 15 cases)
const ACCURACY_TABLE = [
  { id:'SUB-2024-001', aiRec:'DECLINE', confidence:82, humanDec:'DECLINED',   match:true,  reason:null },
  { id:'SUB-2024-002', aiRec:'APPROVE', confidence:91, humanDec:'APPROVED',   match:true,  reason:null },
  { id:'SUB-2024-003', aiRec:'REFER',   confidence:74, humanDec:'REFERRED',   match:true,  reason:null },
  { id:'SUB-2024-004', aiRec:'APPROVE', confidence:88, humanDec:'APPROVED',   match:true,  reason:null },
  { id:'SUB-2024-005', aiRec:'REFER',   confidence:58, humanDec:'REFERRED',   match:true,  reason:'Low confidence auto-route' },
  { id:'SUB-2024-006', aiRec:'APPROVE', confidence:93, humanDec:'APPROVED',   match:true,  reason:null },
  { id:'SUB-2024-007', aiRec:'DECLINE', confidence:88, humanDec:'DECLINED',   match:true,  reason:null },
  { id:'SUB-2024-008', aiRec:'REFER',   confidence:79, humanDec:'APPROVED',   match:false, reason:'Senior UW override: long-standing client' },
  { id:'SUB-2024-009', aiRec:'APPROVE', confidence:95, humanDec:'APPROVED',   match:true,  reason:null },
  { id:'SUB-2024-010', aiRec:'APPROVE', confidence:89, humanDec:'APPROVED',   match:true,  reason:null },
  { id:'SUB-2024-011', aiRec:'APPROVE', confidence:72, humanDec:'REFERRED',   match:false, reason:'Carrier policy: healthcare >200 needs senior review' },
  { id:'SUB-2024-012', aiRec:'REFER',   confidence:76, humanDec:'REFERRED',   match:true,  reason:null },
  { id:'SUB-2023-098', aiRec:'REFER',   confidence:83, humanDec:'APPROVED',   match:false, reason:'UW override: additional docs reviewed offline' },
  { id:'SUB-2023-091', aiRec:'DECLINE', confidence:79, humanDec:'DECLINED',   match:true,  reason:null },
  { id:'SUB-2023-087', aiRec:'APPROVE', confidence:86, humanDec:'APPROVED',   match:true,  reason:null },
]

export default function ModelPerformance() {
  const { apiKey, carriers } = useAppStore()
  const [connStatus, setConnStatus] = useState(null) // null | {success, ms, error}
  const [testing,    setTesting]    = useState(false)

  const matches      = ACCURACY_TABLE.filter((r) => r.match).length
  const total        = ACCURACY_TABLE.length
  const accuracy     = Math.round((matches / total) * 100)
  const overrideRate = Math.round(((total - matches) / total) * 100)

  const overrideApprove = ACCURACY_TABLE.filter((r) => !r.match && r.humanDec === 'APPROVED').length
  const overrideDecline = ACCURACY_TABLE.filter((r) => !r.match && r.humanDec === 'DECLINED').length

  const avgConf = Math.round(ACCURACY_TABLE.reduce((a, b) => a + b.confidence, 0) / total)
  const lowConf = ACCURACY_TABLE.filter((r) => r.confidence < 60).length

  async function handleTest() {
    if (!apiKey) { toast.error('API key not configured'); return }
    setTesting(true)
    const result = await testConnection(apiKey)
    setConnStatus(result)
    setTesting(false)
    if (result.success) toast.success(`Connected in ${result.ms}ms`)
    else toast.error('Connection failed', { description: result.error })
  }

  return (
    <div>
      <PageHeader title="Model Performance" subtitle="AI accuracy, confidence calibration, and override tracking." />

      {/* API status */}
      <div className="card p-5 mb-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {connStatus?.success
            ? <Wifi size={18} className="text-positive" />
            : !apiKey
            ? <WifiOff size={18} className="text-ink-tertiary" />
            : <Wifi size={18} className="text-ink-tertiary" />
          }
          <div>
            <div className="font-semibold text-ink-primary">{MODEL}</div>
            <div className="text-xs text-ink-secondary">
              {apiKey
                ? connStatus
                  ? connStatus.success
                    ? `Connected · ${connStatus.ms}ms response time`
                    : `Error: ${connStatus.error}`
                  : 'API key configured — run test to verify'
                : 'API key not configured'
              }
            </div>
          </div>
        </div>
        <Button size="sm" onClick={handleTest} loading={testing} disabled={!apiKey || testing}>
          Test Connection
        </Button>
      </div>

      {/* KPIs */}
      <KPIGrid>
        <KPICard label="Human Override Rate"          value={`${overrideRate}%`} trendLabel="target < 15%" trendDir={overrideRate < 15 ? 'up' : 'down'} />
        <KPICard label="Override → Approve"           value={overrideApprove}   trendDir="neutral" />
        <KPICard label="Avg Confidence Score"         value={`${avgConf}%`}     trendDir="neutral" />
        <KPICard label="Below 60% Confidence"         value={lowConf}           trendDir="neutral" />
      </KPIGrid>

      {/* Calibration chart */}
      <div className="card p-5 mb-5">
        <div className="font-semibold mb-4">Confidence Calibration</div>
        <div className="text-xs text-ink-secondary mb-4">
          Shows whether model confidence scores are well-calibrated (actual accuracy should match confidence level).
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={CALIBRATION_DATA}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} />
            <XAxis dataKey="band" tick={{ fontSize: 11 }} />
            <YAxis tick={{ fontSize: 11 }} unit="%" domain={[40, 100]} />
            <Tooltip
              content={({ active, payload }) =>
                active && payload?.length ? (
                  <div className="custom-tooltip">
                    {payload[0].payload.band}: {payload[0].value}% actual accuracy
                  </div>
                ) : null
              }
            />
            <Line
              type="monotone" dataKey="accuracy" name="Actual Accuracy"
              stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--accent)' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Cold-start per carrier */}
      <div className="card p-5 mb-5">
        <div className="font-semibold mb-3">Cold-Start Status by Carrier</div>
        {carriers.map((c) => (
          <div key={c.id} className="mb-3">
            <div className="flex justify-between text-sm mb-1">
              <span className="font-medium">{c.name}</span>
              {c.submissionCount < 50
                ? <Badge variant="warning">Cold Start</Badge>
                : <Badge variant="success">Optimized</Badge>
              }
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-surface-tertiary rounded-full overflow-hidden">
                <div
                  className={cn('h-full rounded-full', c.submissionCount >= 50 ? 'bg-positive' : 'bg-caution')}
                  style={{ width: `${Math.min((c.submissionCount / 50) * 100, 100)}%` }}
                />
              </div>
              <span className="text-xs text-ink-tertiary tabular-nums">{c.submissionCount}/50</span>
            </div>
          </div>
        ))}
      </div>

      {/* Accuracy table */}
      <div className="card">
        <div className="px-5 py-4 border-b border-line flex items-center justify-between">
          <div className="font-semibold">AI vs. Human Decision Accuracy</div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-ink-secondary">Match rate:</span>
            <span className="text-lg font-bold text-positive-text">{accuracy}%</span>
          </div>
        </div>
        <div className="overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>Submission ID</th><th>AI Recommendation</th><th>Confidence</th>
                <th>Human Decision</th><th>Match</th><th>Override Reason</th>
              </tr>
            </thead>
            <tbody>
              {ACCURACY_TABLE.map((row) => (
                <tr key={row.id}>
                  <td><span className="font-mono text-xs text-ink-secondary">{row.id}</span></td>
                  <td><StatusBadge status={row.aiRec} /></td>
                  <td>
                    <span className={cn('text-sm font-medium tabular-nums', row.confidence < 60 ? 'text-destructive-text' : 'text-ink-primary')}>
                      {row.confidence}%
                    </span>
                  </td>
                  <td><StatusBadge status={row.humanDec} /></td>
                  <td>
                    {row.match
                      ? <CheckCircle2 size={16} className="text-positive" />
                      : <XCircle size={16} className="text-destructive" />
                    }
                  </td>
                  <td className="text-xs text-ink-tertiary max-w-[200px] truncate">
                    {row.reason ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 border-t border-line text-sm text-ink-secondary">
          Showing {total} most recent cases · AI matched human decision in {matches}/{total} cases ({accuracy}%)
        </div>
      </div>
    </div>
  )
}
