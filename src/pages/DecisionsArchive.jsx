import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/useAppStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/ui/badge'
import { RiskScoreCell } from '@/components/shared/RiskScore'
import { formatDate } from '@/lib/utils'

export default function DecisionsArchive() {
  const { submissions } = useAppStore()
  const navigate = useNavigate()
  const decided = submissions.filter((s) => ['APPROVED','DECLINED','REFERRED'].includes(s.status))

  return (
    <div>
      <PageHeader title="Decisions Archive" subtitle={`${decided.length} decided submissions`} />
      <div className="border border-line rounded-md overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>ID</th><th>Employer</th><th>Industry</th><th>State</th>
              <th>Risk</th><th>Confidence</th><th>Decision</th><th>Submitted</th>
            </tr>
          </thead>
          <tbody>
            {decided.map((sub) => (
              <tr key={sub.id} className="cursor-pointer" onClick={() => navigate(`/submissions/${sub.id}`)}>
                <td><span className="font-mono text-xs text-ink-secondary">{sub.id}</span></td>
                <td><span className="font-medium">{sub.employerName}</span></td>
                <td>{sub.industry}</td>
                <td>{sub.state}</td>
                <td><RiskScoreCell score={sub.riskScore} /></td>
                <td className="text-sm text-ink-secondary">{sub.confidenceLevel}%</td>
                <td><StatusBadge status={sub.status} /></td>
                <td className="text-xs text-ink-secondary">{formatDate(sub.submittedAt, { relative: true })}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
