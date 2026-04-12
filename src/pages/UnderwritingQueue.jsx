import { useState, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import useAppStore from '@/store/useAppStore'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { RiskScoreCell } from '@/components/shared/RiskScore'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

const COLUMNS = [
  { key: 'PENDING',     label: 'New Submissions',  color: 'text-brand',      bg: 'bg-brand' },
  { key: 'PROCESSING',  label: 'In Review',         color: 'text-caution-text',bg: 'bg-caution' },
  { key: 'REFERRED',    label: 'Pending Info',      color: 'text-violet-text', bg: 'bg-violet' },
  { key: 'APPROVED',    label: 'Decision Made',     color: 'text-positive-text',bg: 'bg-positive' },
]

const RISK_BORDER = (score) =>
  score <= 39 ? 'border-l-positive' : score <= 69 ? 'border-l-caution' : 'border-l-destructive'

export default function UnderwritingQueue() {
  const { submissions, updateSubmission, currentUser } = useAppStore()
  const navigate = useNavigate()

  const [filter, setFilter]   = useState('All')
  const [dragId, setDragId]   = useState(null)
  const [overCol, setOverCol] = useState(null)

  const filters = ['All','Mine','Unassigned','High Risk','Overdue']

  function applyFilter(subs) {
    switch (filter) {
      case 'Mine':       return subs.filter((s) => s.assignedUnderwriter === currentUser.name)
      case 'Unassigned': return subs.filter((s) => !s.assignedUnderwriter)
      case 'High Risk':  return subs.filter((s) => (s.riskScore || 0) >= 70)
      case 'Overdue':    return subs.filter((s) => s.adverseActionDeadline && new Date(s.adverseActionDeadline) < new Date())
      default:           return subs
    }
  }

  const filtered = applyFilter(submissions)

  function getColCards(status) {
    return filtered.filter((s) => s.status === status)
  }

  // Drag handlers
  function onDragStart(e, id) {
    setDragId(id)
    e.dataTransfer.effectAllowed = 'move'
  }
  function onDragOver(e, col) {
    e.preventDefault()
    setOverCol(col)
  }
  function onDrop(e, toStatus) {
    e.preventDefault()
    if (!dragId) return
    const sub = submissions.find((s) => s.id === dragId)
    if (sub && sub.status !== toStatus) {
      updateSubmission(dragId, { status: toStatus })
      toast.success(`Moved ${sub.employerName} to ${COLUMNS.find((c) => c.key === toStatus)?.label}`)
    }
    setDragId(null)
    setOverCol(null)
  }

  return (
    <div>
      <PageHeader title="Underwriting Queue" subtitle="Drag cards between columns to update status." />

      {/* Filter bar */}
      <div className="flex gap-1 mb-5">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={cn(
              'px-3 py-1.5 text-sm rounded border transition-colors',
              filter === f
                ? 'bg-brand text-white border-brand'
                : 'bg-surface-primary text-ink-secondary border-line hover:border-brand hover:text-brand'
            )}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Board */}
      <div className="grid grid-cols-4 gap-4">
        {COLUMNS.map(({ key, label, color, bg }) => {
          const cards = getColCards(key)
          return (
            <div
              key={key}
              className={cn(
                'kanban-col flex flex-col gap-2 p-3 rounded-md border border-line bg-surface-secondary min-h-[70vh]',
                'transition-colors duration-150',
                overCol === key && dragId && 'border-brand bg-brand-light'
              )}
              onDragOver={(e) => onDragOver(e, key)}
              onDrop={(e) => onDrop(e, key)}
              onDragLeave={() => setOverCol(null)}
            >
              {/* Column header */}
              <div className="flex items-center justify-between mb-1 px-1">
                <div className="flex items-center gap-2">
                  <div className={cn('w-2 h-2 rounded-full', bg)} />
                  <span className={cn('text-xs font-semibold', color)}>{label}</span>
                </div>
                <span className={cn('text-xs font-bold px-1.5 rounded-full text-white', bg)}>
                  {cards.length}
                </span>
              </div>

              {/* Cards */}
              {cards.map((sub) => (
                <KanbanCard
                  key={sub.id}
                  sub={sub}
                  navigate={navigate}
                  onDragStart={onDragStart}
                  isDragging={dragId === sub.id}
                />
              ))}

              {cards.length === 0 && (
                <div className="flex items-center justify-center h-24 text-xs text-ink-tertiary border-2 border-dashed border-line rounded">
                  Drop here
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function KanbanCard({ sub, navigate, onDragStart, isDragging }) {
  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, sub.id)}
      onClick={() => navigate(`/submissions/${sub.id}`)}
      className={cn(
        'bg-surface-primary border border-line rounded cursor-pointer',
        'border-l-4 p-3 transition-all duration-150',
        'hover:border-line-strong hover:shadow-card',
        RISK_BORDER(sub.riskScore || 0),
        isDragging && 'opacity-40 scale-95'
      )}
    >
      <div className="font-mono text-[10px] text-ink-tertiary mb-1">{sub.id}</div>
      <div className="text-sm font-semibold text-ink-primary mb-1 leading-tight">{sub.employerName}</div>
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        <span className="text-[11px] bg-surface-secondary text-ink-secondary px-1.5 py-0.5 rounded">{sub.industry}</span>
        <span className="text-[11px] text-ink-tertiary">{sub.employeeCount} emp</span>
      </div>
      <div className="flex items-center justify-between">
        <RiskScoreCell score={sub.riskScore} />
        {sub.assignedUnderwriter ? (
          <div className="w-6 h-6 rounded-full bg-brand flex items-center justify-center text-white text-[10px] font-bold"
               title={sub.assignedUnderwriter}>
            {sub.assignedUnderwriter.split(' ').map((n) => n[0]).join('')}
          </div>
        ) : (
          <span className="text-[10px] text-ink-tertiary">Unassigned</span>
        )}
      </div>
      <div className="text-[10px] text-ink-tertiary mt-1.5">
        {formatDate(sub.submittedAt, { relative: true })}
        {sub.coverageTypes?.slice(0,2).map((c) => (
          <span key={c} className="ml-1 bg-surface-tertiary px-1 rounded">{c}</span>
        ))}
      </div>
    </div>
  )
}
