import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Download, Plus, MoreHorizontal, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react'
import { toast } from 'sonner'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Badge, StatusBadge } from '@/components/ui/badge'
import { Input, Select } from '@/components/ui/input'
import { KPICard, KPIGrid } from '@/components/shared/KPICard'
import { RiskScoreCell, ConfidenceBar } from '@/components/shared/RiskScore'
import { PageHeader } from '@/components/shared/PageHeader'
import { formatDate } from '@/lib/utils'
import * as DropdownMenu from '@radix-ui/react-dropdown-menu'
import { cn } from '@/lib/utils'

const PAGE_SIZE = 10

const INDUSTRIES = ['All','Technology','Healthcare','Finance','Legal','Education',
  'Retail','Manufacturing','Restaurant','Construction','Hospitality','Transportation',
  'Agriculture','Nonprofit','Real Estate','Energy']

export default function Submissions() {
  const { submissions, getActiveCarrier } = useAppStore()
  const navigate = useNavigate()

  const [search,   setSearch]   = useState('')
  const [status,   setStatus]   = useState('All')
  const [industry, setIndustry] = useState('All')
  const [sortCol,  setSortCol]  = useState('submittedAt')
  const [sortDir,  setSortDir]  = useState('desc')
  const [page,     setPage]     = useState(1)

  const carrier = getActiveCarrier()

  // Filter + sort
  const filtered = useMemo(() => {
    let rows = [...submissions]
    if (search) {
      const q = search.toLowerCase()
      rows = rows.filter((s) =>
        s.id.toLowerCase().includes(q) ||
        s.employerName.toLowerCase().includes(q) ||
        s.brokerName.toLowerCase().includes(q)
      )
    }
    if (status !== 'All')   rows = rows.filter((s) => s.status === status)
    if (industry !== 'All') rows = rows.filter((s) => s.industry === industry)

    rows.sort((a, b) => {
      let av = a[sortCol], bv = b[sortCol]
      if (typeof av === 'string') av = av.toLowerCase()
      if (typeof bv === 'string') bv = bv.toLowerCase()
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return rows
  }, [submissions, search, status, industry, sortCol, sortDir])

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  function handleSort(col) {
    if (sortCol === col) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortCol(col)
      setSortDir('asc')
    }
    setPage(1)
  }

  function SortIcon({ col }) {
    if (sortCol !== col) return <ArrowUpDown size={12} className="opacity-30" />
    return sortDir === 'asc'
      ? <ArrowUp size={12} className="text-brand" />
      : <ArrowDown size={12} className="text-brand" />
  }

  function handleExport() {
    const header = 'ID,Employer,Industry,State,Employees,Status,Risk Score,Confidence,Submitted\n'
    const rows = filtered.map((s) =>
      `${s.id},"${s.employerName}",${s.industry},${s.state},${s.employeeCount},${s.status},${s.riskScore},${s.confidenceLevel}%,${s.submittedAt}`
    ).join('\n')
    const blob = new Blob([header + rows], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = 'submissions.csv'; a.click()
    URL.revokeObjectURL(url)
    toast.success('CSV exported')
  }

  // KPIs
  const approved  = submissions.filter((s) => s.status === 'APPROVED').length
  const pending   = submissions.filter((s) => s.status === 'PENDING').length
  const total     = submissions.length

  return (
    <div>
      <PageHeader
        title="Submissions"
        actions={
          <>
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={13} /> Export CSV
            </Button>
            <Button size="sm" onClick={() => navigate('/submissions/new')}>
              <Plus size={13} /> New Submission
            </Button>
          </>
        }
      />

      {/* KPIs */}
      <KPIGrid>
        <KPICard label="Total Submissions"   value={total}    trend="+12%" trendLabel="this week" trendDir="up" />
        <KPICard label="Auto-Approved Today" value={approved} trend="+5%"  trendLabel="vs yesterday" trendDir="up" />
        <KPICard label="Pending Review"      value={pending}  trendLabel="requires action" trendDir="neutral" />
        <KPICard label="Avg Decision Time"   value="4.2 min"  trend="-18%" trendLabel="improvement" trendDir="down" />
      </KPIGrid>

      {/* Cold-start warning */}
      {carrier && carrier.submissionCount < 50 && (
        <div className="banner banner-warning mb-4">
          <span className="font-semibold">Cold Start Mode</span> — {carrier.name} has fewer than 50 historical decisions.
          AI confidence scores are capped at 75%. Predictive accuracy will improve after 50+ decisions.
          ({carrier.submissionCount}/50 decisions made)
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2 mb-4">
        <div className="relative">
          <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary" />
          <Input
            className="pl-8 w-60"
            placeholder="Search by employer, ID, or broker..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1) }}
          />
        </div>
        <Select className="w-36" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1) }}>
          {['All','PENDING','APPROVED','DECLINED','REFERRED','PROCESSING'].map((s) => (
            <option key={s}>{s}</option>
          ))}
        </Select>
        <Select className="w-36" value={industry} onChange={(e) => { setIndustry(e.target.value); setPage(1) }}>
          {INDUSTRIES.map((i) => <option key={i}>{i}</option>)}
        </Select>
        <div className="ml-auto text-xs text-ink-tertiary">
          {filtered.length} submission{filtered.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Table */}
      <div className="border border-line rounded-md overflow-hidden">
        {paged.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="text-4xl mb-3 opacity-30">📋</div>
            <div className="text-base font-medium text-ink-primary mb-1">No submissions found</div>
            <div className="text-sm text-ink-tertiary mb-4">Adjust your filters or create a new submission</div>
            <Button size="sm" onClick={() => navigate('/submissions/new')}>
              <Plus size={13} /> New Submission
            </Button>
          </div>
        ) : (
          <table className="w-full data-table">
            <thead>
              <tr>
                {[
                  { label: 'Submission ID', col: 'id',          w: 'w-28' },
                  { label: 'Employer',      col: 'employerName',w: 'w-44' },
                  { label: 'Industry',      col: 'industry',    w: 'w-32' },
                  { label: 'Employees',     col: 'employeeCount',w: 'w-20 text-right' },
                  { label: 'Coverage',      col: null,           w: 'w-28' },
                  { label: 'Submitted',     col: 'submittedAt', w: 'w-24' },
                  { label: 'Status',        col: 'status',      w: 'w-24' },
                  { label: 'Risk',          col: 'riskScore',   w: 'w-24' },
                  { label: 'Confidence',    col: 'confidenceLevel', w: 'w-28' },
                  { label: 'Actions',       col: null,           w: 'w-20' },
                ].map(({ label, col, w }) => (
                  <th
                    key={label}
                    className={cn(w, col && 'cursor-pointer select-none hover:text-ink-primary')}
                    onClick={() => col && handleSort(col)}
                  >
                    <span className="flex items-center gap-1">
                      {label}
                      {col && <SortIcon col={col} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {paged.map((sub) => (
                <tr
                  key={sub.id}
                  className="cursor-pointer"
                  onClick={() => navigate(`/submissions/${sub.id}`)}
                >
                  <td>
                    <span className="font-mono text-xs text-ink-secondary">{sub.id}</span>
                  </td>
                  <td>
                    <div className="font-medium text-sm text-ink-primary truncate max-w-[160px]">
                      {sub.employerName}
                    </div>
                  </td>
                  <td>
                    <span className="text-sm text-ink-secondary">{sub.industry}</span>
                  </td>
                  <td className="text-right tabular-nums">
                    {sub.employeeCount?.toLocaleString()}
                  </td>
                  <td>
                    <span className="text-xs text-ink-secondary">
                      {sub.coverageTypes?.slice(0, 2).join(', ')}
                      {sub.coverageTypes?.length > 2 && ` +${sub.coverageTypes.length - 2}`}
                    </span>
                  </td>
                  <td>
                    <span className="text-xs text-ink-secondary">
                      {formatDate(sub.submittedAt, { relative: true })}
                    </span>
                  </td>
                  <td>
                    <StatusBadge status={sub.status} />
                  </td>
                  <td>
                    <RiskScoreCell score={sub.riskScore} />
                  </td>
                  <td>
                    {sub.confidenceLevel != null
                      ? <ConfidenceBar confidence={sub.confidenceLevel} />
                      : <span className="text-xs text-ink-tertiary">—</span>
                    }
                  </td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost" size="sm"
                        onClick={() => navigate(`/submissions/${sub.id}`)}
                      >
                        View
                      </Button>
                      <RowMenu sub={sub} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {filtered.length > PAGE_SIZE && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-line">
            <span className="text-xs text-ink-secondary">
              Showing {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} submissions
            </span>
            <div className="flex items-center gap-1">
              <Button
                variant="secondary" size="sm"
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
              >
                ← Prev
              </Button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const p = i + 1
                return (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={cn(
                      'w-8 h-8 rounded text-xs border transition-colors',
                      p === page
                        ? 'bg-brand border-brand text-white'
                        : 'bg-surface-primary border-line text-ink-secondary hover:bg-surface-hover'
                    )}
                  >
                    {p}
                  </button>
                )
              })}
              <Button
                variant="secondary" size="sm"
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
              >
                Next →
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function RowMenu({ sub }) {
  const navigate = useNavigate()
  const { updateSubmission } = useAppStore()

  const actions = [
    { label: 'View Details', fn: () => navigate(`/submissions/${sub.id}`) },
    { label: 'Download Report', fn: () => toast.info('Report generation coming soon') },
    { label: 'Reassign Carrier',fn: () => toast.info('Carrier reassignment — use Carrier Config') },
    { label: 'Request More Info',fn: () => toast.info('Opening broker communication...') },
    { label: 'Mark as Urgent', fn: () => {
      updateSubmission(sub.id, { priority: 'urgent' })
      toast.success('Marked as urgent')
    }},
    { label: 'Archive', danger: true, fn: () => {
      updateSubmission(sub.id, { archived: true })
      toast.success('Submission archived')
    }},
  ]

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                           hover:bg-surface-hover hover:text-ink-primary transition-colors">
          <MoreHorizontal size={14} />
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="bg-surface-primary border border-line rounded-md shadow-modal py-1 min-w-[160px] z-50 animate-fadeIn"
          align="end"
          sideOffset={4}
        >
          {actions.map((a) => (
            <DropdownMenu.Item
              key={a.label}
              onSelect={a.fn}
              className={cn(
                'flex items-center px-3 py-2 text-sm cursor-pointer outline-none',
                'hover:bg-surface-hover transition-colors',
                a.danger ? 'text-destructive' : 'text-ink-primary'
              )}
            >
              {a.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  )
}
