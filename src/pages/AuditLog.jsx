import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Lock, Download } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input, Select } from '@/components/ui/input'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogCloseButton
} from '@/components/ui/dialog'
import { formatDateTime } from '@/lib/utils'
import { cn } from '@/lib/utils'

const EVENT_COLORS = {
  'AI Decision':       'processing',
  'Human Override':    'warning',
  'Compliance Override':'danger',
  'EOI Action':        'purple',
  'Submission Created':'info',
  'System Event':      'gray',
}

export default function AuditLog() {
  const { auditLog, carriers } = useAppStore()
  const navigate = useNavigate()

  const [search,    setSearch]    = useState('')
  const [eventType, setEventType] = useState('All')
  const [selected,  setSelected]  = useState(null)

  const filtered = useMemo(() => {
    let rows = [...auditLog]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((e) =>
        e.submissionId?.toLowerCase().includes(q) ||
        e.employer?.toLowerCase().includes(q) ||
        e.decidedBy?.toLowerCase().includes(q)
      )
    }
    if (eventType !== 'All') rows = rows.filter((e) => e.eventType === eventType)
    return rows.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }, [auditLog, search, eventType])

  function handleExport() {
    const header = 'Timestamp,Event Type,Submission ID,Employer,AI Model,Risk Score,AI Recommendation,Confidence,Human Override,Final Decision,Decided By,Notes\n'
    const rows = filtered.map((e) =>
      `"${e.timestamp}","${e.eventType}","${e.submissionId ?? ''}","${e.employer ?? ''}","${e.modelVersion ?? ''}",${e.riskScore ?? ''},"${e.aiRecommendation ?? ''}",${e.confidenceLevel ?? ''},"${e.humanOverride}","${e.finalDecision ?? ''}","${e.decidedBy}","${e.notes}"`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `audit_log_${Date.now()}.csv`; a.click()
    URL.revokeObjectURL(url)
    toast.success('Audit log exported')
  }

  function handleExportPackage() {
    toast.success('Audit package generated. Download starting.')
  }

  return (
    <div>
      {/* Immutable banner */}
      <div className="flex items-start gap-3 px-4 py-3 bg-surface-tertiary border border-line rounded-md mb-5 text-xs text-ink-secondary">
        <Lock size={14} className="flex-shrink-0 mt-0.5 text-ink-tertiary" />
        <div>
          <strong className="text-ink-primary">Immutable Audit Trail</strong> — All AI decisions, human overrides,
          and system events are logged with full input/output traceability. Logs are retained for 7 years per
          regulatory requirements. This log cannot be edited or deleted.
        </div>
      </div>

      <PageHeader
        title="Audit Log"
        actions={
          <div className="flex gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={13} /> Export CSV
            </Button>
            <Button variant="secondary" size="sm" onClick={handleExportPackage}>
              Export Audit Package
            </Button>
          </div>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4">
        <Input
          className="w-56"
          placeholder="Search submission, employer, user..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <Select className="w-44" value={eventType} onChange={(e) => setEventType(e.target.value)}>
          {['All','AI Decision','Human Override','Compliance Override','EOI Action','Submission Created','System Event']
            .map((t) => <option key={t}>{t}</option>)}
        </Select>
        <span className="text-xs text-ink-tertiary ml-auto">{filtered.length} records</span>
      </div>

      {/* Table */}
      <div className="border border-line rounded-md overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Timestamp</th><th>Event</th><th>Submission ID</th><th>Employer</th>
              <th>Risk</th><th>AI Rec.</th><th>Confidence</th><th>Override</th>
              <th>Final Decision</th><th>Decided By</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((entry) => (
              <tr key={entry.id} className="cursor-pointer" onClick={() => setSelected(entry)}>
                <td>
                  <span className="font-mono text-xs text-ink-secondary whitespace-nowrap">
                    {formatDateTime(entry.timestamp)}
                  </span>
                </td>
                <td><Badge variant={EVENT_COLORS[entry.eventType] ?? 'gray'}>{entry.eventType}</Badge></td>
                <td>
                  {entry.submissionId ? (
                    <button
                      className="font-mono text-xs text-brand hover:underline"
                      onClick={(e) => { e.stopPropagation(); navigate(`/submissions/${entry.submissionId}`) }}
                    >
                      {entry.submissionId}
                    </button>
                  ) : <span className="text-ink-tertiary text-xs">—</span>}
                </td>
                <td className="text-sm">{entry.employer ?? '—'}</td>
                <td>
                  {entry.riskScore != null
                    ? <span className={cn('text-sm font-medium tabular-nums',
                        entry.riskScore < 40 ? 'text-positive-text' : entry.riskScore < 70 ? 'text-caution-text' : 'text-destructive-text')}>
                        {entry.riskScore}
                      </span>
                    : <span className="text-ink-tertiary text-xs">—</span>
                  }
                </td>
                <td>
                  {entry.aiRecommendation
                    ? <Badge variant={entry.aiRecommendation === 'APPROVE' ? 'success' : entry.aiRecommendation === 'DECLINE' ? 'danger' : 'warning'}>
                        {entry.aiRecommendation}
                      </Badge>
                    : <span className="text-ink-tertiary text-xs">—</span>
                  }
                </td>
                <td className="tabular-nums text-sm">
                  {entry.confidenceLevel != null ? `${entry.confidenceLevel}%` : '—'}
                </td>
                <td>
                  {entry.humanOverride
                    ? <Badge variant="warning">Yes</Badge>
                    : <Badge variant="gray">No</Badge>
                  }
                </td>
                <td>
                  {entry.finalDecision
                    ? <StatusBadge status={entry.finalDecision} />
                    : <span className="text-ink-tertiary text-xs">—</span>
                  }
                </td>
                <td className="text-sm text-ink-secondary">{entry.decidedBy}</td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="text-center py-12 text-ink-tertiary">No audit records match your filters</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Detail modal */}
      {selected && (
        <Dialog open={!!selected} onOpenChange={() => setSelected(null)}>
          <DialogContent wide>
            <DialogHeader>
              <DialogTitle>Audit Record — {selected.id}</DialogTitle>
              <DialogCloseButton />
            </DialogHeader>
            <DialogBody>
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 mb-5">
                {[
                  ['Timestamp',      formatDateTime(selected.timestamp)],
                  ['Event Type',     selected.eventType],
                  ['Submission ID',  selected.submissionId ?? '—'],
                  ['Employer',       selected.employer ?? '—'],
                  ['AI Model',       selected.modelVersion ?? '—'],
                  ['Input Hash',     selected.inputHash ?? '—'],
                  ['Risk Score',     selected.riskScore ?? '—'],
                  ['AI Recommendation', selected.aiRecommendation ?? '—'],
                  ['Confidence Level', selected.confidenceLevel != null ? `${selected.confidenceLevel}%` : '—'],
                  ['Human Override', selected.humanOverride ? 'Yes' : 'No'],
                  ['Final Decision', selected.finalDecision ?? '—'],
                  ['Decided By',     selected.decidedBy],
                ].map(([label, value]) => (
                  <div key={label} className="border-b border-line pb-2">
                    <div className="text-xs text-ink-tertiary">{label}</div>
                    <div className="text-sm font-medium text-ink-primary mt-0.5">{String(value)}</div>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div>
                  <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Notes</div>
                  <div className="p-3 bg-surface-secondary border border-line rounded text-sm text-ink-secondary">
                    {selected.notes}
                  </div>
                </div>
              )}
            </DialogBody>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
