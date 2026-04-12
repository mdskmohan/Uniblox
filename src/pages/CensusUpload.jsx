import { useState } from 'react'
import { toast } from 'sonner'
import { Upload, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select } from '@/components/ui/input'
import { PageHeader } from '@/components/shared/PageHeader'
import { Banner } from '@/components/shared/Banner'
import { KPICard, KPIGrid } from '@/components/shared/KPICard'
import { Progress } from '@/components/ui/progress'
import useAppStore from '@/store/useAppStore'
import { analyzeGroupCensus } from '@/engine/ai'
import { cn } from '@/lib/utils'

const REQUIRED_COLS = [
  { name: 'employee_id',       type: 'String',  example: 'EMP-001',    notes: 'Unique identifier', req: true },
  { name: 'first_name',        type: 'String',  example: 'Sarah',      notes: '',                   req: true },
  { name: 'last_name',         type: 'String',  example: 'Johnson',    notes: '',                   req: true },
  { name: 'date_of_birth',     type: 'Date',    example: '1985-06-15', notes: 'YYYY-MM-DD',        req: true },
  { name: 'employment_status', type: 'Enum',    example: 'FT/PT/TRM',  notes: 'Full-time, Part-time, Terminated', req: true },
  { name: 'coverage_elections',type: 'String',  example: 'Life,Health',notes: 'Comma-separated',   req: true },
  { name: 'gender',            type: 'String',  example: 'M/F/X',      notes: 'Optional',           req: false },
  { name: 'salary',            type: 'Number',  example: '75000',      notes: 'Annual, USD',        req: false },
  { name: 'beneficiary_name',  type: 'String',  example: 'John Johnson',notes: '',                  req: false },
  { name: 'hire_date',         type: 'Date',    example: '2020-03-01', notes: 'YYYY-MM-DD',         req: false },
  { name: 'job_title',         type: 'String',  example: 'Engineer',   notes: '',                   req: false },
  { name: 'department',        type: 'String',  example: 'Engineering',notes: '',                   req: false },
]

const SAMPLE_ROWS = [
  { id:'EMP-001', first:'Sarah',  last:'Johnson', dob:'1985-06-15', status:'FT', coverage:'Life,Health,Dental', gender:'F', salary:95000, dept:'Engineering' },
  { id:'EMP-002', first:'Marcus', last:'Lee',     dob:'1979-11-22', status:'FT', coverage:'Life,Health',        gender:'M', salary:112000,dept:'Engineering' },
  { id:'EMP-003', first:'Ana',    last:'Rivera',  dob:'1990-03-08', status:'FT', coverage:'Life,Health,Dental,Vision', gender:'F', salary:78000, dept:'Marketing' },
  { id:'EMP-004', first:'David',  last:'Kim',     dob:'1988-07-30', status:'FT', coverage:'Life',               gender:'M', salary:88000, dept:'Sales' },
  { id:'EMP-005', first:'Linda',  last:'Chen',    dob:'1975-01-14', status:'FT', coverage:'Life,Health,Dental', gender:'F', salary:125000,dept:'Finance' },
  { id:'EMP-006', first:'Tom',    last:'Garcia',  dob:'1995-09-20', status:'PT', coverage:'Life',               gender:'M', salary:42000, dept:'Operations' },
  { id:'EMP-007', first:'Maria',  last:'Patel',   dob:'1982-12-05', status:'FT', coverage:'Life,Health',        gender:'F', salary:98000, dept:'HR' },
  { id:'EMP-008', first:'James',  last:'Wilson',  dob:'1970-04-18', status:'FT', coverage:'Life,Health,LTC',    gender:'M', salary:145000,dept:'Executive' },
  { id:'EMP-009', first:'Amy',    last:'Brown',   dob:'1993-08-27', status:'FT', coverage:'Life,Health,Dental', gender:'F', salary:72000, dept:'Engineering' },
  { id:'EMP-010', first:'Robert', last:'Taylor',  dob:'19860215',   status:'FT', coverage:'Life',               gender:'M', salary:89000, dept:'Sales', error:'Invalid date format' },
]

const ERRORS = [
  { row:10, empId:'EMP-010', errorType:'Invalid date format',      fix:'Change 19860215 → 1986-02-15' },
  { row:11, empId:'EMP-011', errorType:'Missing required field',   fix:'Add employment_status' },
  { row:15, empId:'EMP-015', errorType:'Duplicate employee ID',    fix:'Update to unique value' },
  { row:23, empId:'EMP-023', errorType:'Missing required field',   fix:'Add date_of_birth' },
  { row:31, empId:null,      errorType:'Missing required field',   fix:'Add employee_id' },
]

export default function CensusUpload() {
  const { enrollments, apiKey } = useAppStore()
  const [groupId,     setGroupId]     = useState(enrollments[0]?.id || '')
  const [fileLoaded,  setFileLoaded]  = useState(false)
  const [loading,     setLoading]     = useState(false)
  const [aiResult,    setAiResult]    = useState(null)
  const [aiLoading,   setAiLoading]   = useState(false)
  const [dragOver,    setDragOver]    = useState(false)

  const selectedGroup = enrollments.find((e) => e.id === groupId)

  function handleLoadSample() {
    setLoading(true)
    setTimeout(() => {
      setFileLoaded(true)
      setLoading(false)
    }, 1200)
  }

  async function handleAIAnalysis() {
    if (!apiKey) { toast.error('API key required — add in AI Model Settings'); return }
    setAiLoading(true)
    try {
      const stats = {
        groupName: selectedGroup?.groupName,
        totalEmployees: 247,
        validRows: 231,
        avgAge: 36.4,
        genderSplit: '52% F, 48% M',
        avgSalary: '$92,400',
        coverageElections: { Life: '95%', Health: '88%', Dental: '71%', Vision: '43%', LTC: '8%' },
        departments: { Engineering: 68, Sales: 44, Finance: 31, Operations: 28, HR: 22, Executive: 14, Marketing: 40 },
        employmentTypes: { FullTime: '84%', PartTime: '16%' },
      }
      const result = await analyzeGroupCensus({ censusStats: stats, apiKey })
      setAiResult(result)
    } catch (err) {
      toast.error('Analysis failed', { description: err.message })
    } finally {
      setAiLoading(false)
    }
  }

  return (
    <div>
      <PageHeader
        title="Census File Upload"
        subtitle="Upload employee census data for group enrollment processing."
      />

      {/* Group selector */}
      <div className="max-w-sm mb-5">
        <label className="text-sm text-ink-secondary block mb-1">Active Enrollment Group</label>
        <Select value={groupId} onChange={(e) => setGroupId(e.target.value)}>
          {enrollments.map((e) => <option key={e.id} value={e.id}>{e.groupName}</option>)}
        </Select>
      </div>

      {/* Upload area */}
      <div
        className={cn(
          'border-2 border-dashed rounded-md flex flex-col items-center justify-center h-52',
          'transition-colors cursor-pointer mb-5',
          dragOver ? 'border-brand bg-brand-light' : 'border-line hover:border-brand hover:bg-brand-light'
        )}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleLoadSample() }}
        onClick={() => handleLoadSample()}
      >
        {loading ? (
          <Loader2 size={32} className="animate-spin text-brand mb-2" />
        ) : (
          <>
            <Upload size={32} className="text-ink-tertiary mb-2" />
            <div className="text-sm font-medium text-ink-primary">Drop census file here or click to browse</div>
            <div className="text-xs text-ink-tertiary mt-1">Accepts CSV, XLSX — max 10MB</div>
            <Button size="sm" variant="secondary" className="mt-3" onClick={(e) => { e.stopPropagation(); handleLoadSample() }}>
              Load Sample Census File
            </Button>
          </>
        )}
      </div>

      {/* Required columns */}
      {!fileLoaded && (
        <div className="border border-line rounded-md overflow-hidden mb-5">
          <div className="px-4 py-3 bg-surface-secondary border-b border-line text-sm font-medium">
            Required & Optional Columns
          </div>
          <table className="w-full data-table">
            <thead>
              <tr><th>Column</th><th>Type</th><th>Example</th><th>Notes</th><th>Required</th></tr>
            </thead>
            <tbody>
              {REQUIRED_COLS.map((col) => (
                <tr key={col.name}>
                  <td><span className="font-mono text-xs">{col.name}</span></td>
                  <td className="text-xs text-ink-secondary">{col.type}</td>
                  <td><span className="font-mono text-xs text-ink-secondary">{col.example}</span></td>
                  <td className="text-xs text-ink-tertiary">{col.notes}</td>
                  <td>
                    {col.req
                      ? <span className="text-destructive text-xs font-bold">*Required</span>
                      : <span className="text-ink-tertiary text-xs">Optional</span>
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Results after file load */}
      {fileLoaded && (
        <div className="space-y-5">
          {/* Quality report */}
          <div className="card">
            <div className="px-5 py-4 border-b border-line flex items-center justify-between">
              <div className="font-semibold">Data Quality Report</div>
              <div className="flex items-center gap-2">
                <div className="w-16 h-16 relative">
                  <svg viewBox="0 0 64 64" className="w-full h-full -rotate-90">
                    <circle cx="32" cy="32" r="26" fill="none" stroke="var(--bg-tertiary)" strokeWidth="8" />
                    <circle cx="32" cy="32" r="26" fill="none" stroke="var(--success)" strokeWidth="8"
                      strokeDasharray={`${2 * Math.PI * 26 * 0.943} ${2 * Math.PI * 26}`}
                      strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[11px] font-bold text-ink-primary">94.3%</span>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-5 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label:'Total Rows',        value:'247',        color:'text-ink-primary' },
                { label:'Valid Rows',         value:'231 (94.3%)',color:'text-positive-text' },
                { label:'Rows with Errors',   value:'16 (6.7%)', color:'text-caution-text' },
                { label:'Completeness Score', value:'94.3%',     color:'text-positive-text' },
              ].map(({ label, value, color }) => (
                <div key={label}>
                  <div className="text-xs text-ink-tertiary">{label}</div>
                  <div className={cn('text-lg font-semibold', color)}>{value}</div>
                </div>
              ))}
            </div>

            <div className="px-5 pb-5">
              <div className="text-xs font-medium text-ink-secondary mb-2">Error Breakdown</div>
              {[
                { type:'Missing required field', count:8, color:'bg-caution' },
                { type:'Invalid date format',    count:5, color:'bg-destructive' },
                { type:'Duplicate employee ID',  count:3, color:'bg-violet' },
              ].map(({ type, count, color }) => (
                <div key={type} className="flex items-center gap-2 mb-1">
                  <div className={cn('h-2 rounded-full', color)} style={{ width: `${(count / 16) * 120}px` }} />
                  <span className="text-xs text-ink-secondary">{type} ({count})</span>
                </div>
              ))}
            </div>
          </div>

          {/* Error detail table */}
          <div className="border border-line rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-surface-secondary border-b border-line text-sm font-medium flex items-center gap-2">
              <AlertCircle size={14} className="text-caution" /> Error Detail (showing 5 of 16)
            </div>
            <table className="w-full data-table">
              <thead>
                <tr><th>Row</th><th>Employee ID</th><th>Error Type</th><th>Suggested Fix</th></tr>
              </thead>
              <tbody>
                {ERRORS.map((err, i) => (
                  <tr key={i} className="bg-destructive-light">
                    <td className="tabular-nums">{err.row}</td>
                    <td><span className="font-mono text-xs">{err.empId ?? '—'}</span></td>
                    <td><span className="text-xs text-destructive-text">{err.errorType}</span></td>
                    <td className="text-xs text-ink-secondary">{err.fix}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Data preview */}
          <div className="border border-line rounded-md overflow-hidden">
            <div className="px-4 py-3 bg-surface-secondary border-b border-line text-sm font-medium">
              Data Preview (first 10 rows)
            </div>
            <div className="overflow-x-auto">
              <table className="w-full data-table min-w-[700px]">
                <thead>
                  <tr>
                    <th>ID</th><th>First</th><th>Last</th><th>DOB</th>
                    <th>Status</th><th>Coverage</th><th>Dept</th><th>Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {SAMPLE_ROWS.map((row) => (
                    <tr key={row.id} className={row.error ? 'bg-destructive-light' : ''}>
                      <td><span className="font-mono text-xs">{row.id}</span></td>
                      <td>{row.first}</td>
                      <td>{row.last}</td>
                      <td className={cn('font-mono text-xs', row.error && 'text-destructive')}>{row.dob}</td>
                      <td>{row.status}</td>
                      <td className="text-xs text-ink-secondary">{row.coverage}</td>
                      <td className="text-xs">{row.dept}</td>
                      <td className="tabular-nums text-sm">${row.salary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* AI enrichment */}
          <div className="card p-5">
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-semibold text-ink-primary">AI Group Risk Profile Analysis</div>
                <div className="text-xs text-ink-tertiary mt-0.5">
                  Analysis based on aggregate statistics only — no individual employee data transmitted to AI.
                </div>
              </div>
              <Button size="sm" onClick={handleAIAnalysis} loading={aiLoading} disabled={!apiKey}>
                {apiKey ? 'Analyze Group Profile' : 'API Key Required'}
              </Button>
            </div>

            {!apiKey && (
              <Banner variant="info">Add your Claude API key in Settings → AI Model Settings to enable group analysis.</Banner>
            )}

            {aiResult && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                {[
                  { label:'Average Age Analysis',          value: aiResult.averageAgeAnalysis },
                  { label:'Coverage Election Patterns',    value: aiResult.coverageElectionPatterns },
                  { label:'Salary Distribution Insight',   value: aiResult.salaryDistributionInsight },
                  { label:'Industry Benchmark Comparison', value: aiResult.industryBenchmarkComparison },
                ].map(({ label, value }) => (
                  <div key={label} className="p-3 bg-surface-secondary border border-line rounded-md">
                    <div className="text-xs font-semibold text-ink-secondary mb-1">{label}</div>
                    <div className="text-sm text-ink-primary">{value}</div>
                  </div>
                ))}
                {aiResult.groupRiskObservations?.length > 0 && (
                  <div className="col-span-2 p-3 bg-surface-secondary border border-line rounded-md">
                    <div className="text-xs font-semibold text-ink-secondary mb-2">Group Risk Observations</div>
                    <ul className="space-y-1">
                      {aiResult.groupRiskObservations.map((obs, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                          <span className="text-brand">•</span>{obs}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Button onClick={() => toast.success('Proceeding to enrollment setup...')}>
              Proceed to Enrollment
            </Button>
            <Button variant="secondary" onClick={() => { setFileLoaded(false); setAiResult(null) }}>
              Fix Errors & Re-upload
            </Button>
            <Button variant="secondary" onClick={() => toast.success('Error report CSV downloading...')}>
              Download Error Report
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
