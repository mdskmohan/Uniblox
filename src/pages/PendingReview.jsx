import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/useAppStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { StatusBadge } from '@/components/ui/badge'
import { RiskScoreCell } from '@/components/shared/RiskScore'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'

export default function PendingReview() {
  const { submissions } = useAppStore()
  const navigate        = useNavigate()
  const pending = submissions.filter((s) => s.status === 'PENDING')

  return (
    <div>
      <PageHeader title="Pending Review" subtitle={`${pending.length} submissions require action`} />
      <div className="border border-line rounded-md overflow-hidden">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Submission ID</th><th>Employer</th><th>Industry</th>
              <th>Employees</th><th>Risk</th><th>Confidence</th>
              <th>Submitted</th><th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((sub) => (
              <tr key={sub.id} className="cursor-pointer" onClick={() => navigate(`/submissions/${sub.id}`)}>
                <td><span className="font-mono text-xs text-ink-secondary">{sub.id}</span></td>
                <td><span className="font-medium">{sub.employerName}</span></td>
                <td>{sub.industry}</td>
                <td className="text-right">{sub.employeeCount?.toLocaleString()}</td>
                <td><RiskScoreCell score={sub.riskScore} /></td>
                <td className="text-sm text-ink-secondary">{sub.confidenceLevel}%</td>
                <td className="text-xs text-ink-secondary">{formatDate(sub.submittedAt, { relative: true })}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <Button size="sm" onClick={() => navigate(`/submissions/${sub.id}`)}>Review</Button>
                </td>
              </tr>
            ))}
            {pending.length === 0 && (
              <tr><td colSpan={8} className="text-center py-12 text-ink-tertiary">No pending submissions — all caught up!</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
