import { useNavigate } from 'react-router-dom'
import useAppStore from '@/store/useAppStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { KPICard, KPIGrid } from '@/components/shared/KPICard'
import { StatusBadge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function ActiveEnrollments() {
  const { enrollments } = useAppStore()

  const totalEmployees = enrollments.reduce((a, b) => a + b.employeeCount, 0)
  const totalEnrolled  = enrollments.reduce((a, b) => a + b.enrolledCount, 0)
  const avgParticipation = enrollments.length
    ? Math.round(enrollments.reduce((a, b) => a + b.participationRate, 0) / enrollments.length)
    : 0
  const eoiTotal = enrollments.reduce((a, b) => a + b.eoiPending, 0)

  return (
    <div>
      <PageHeader title="Active Enrollments" />
      <KPIGrid>
        <KPICard label="Total Active Groups"       value={enrollments.length}                   trendDir="neutral" />
        <KPICard label="Total Enrolled Employees"  value={totalEnrolled.toLocaleString()}       trendDir="neutral" />
        <KPICard label="Average Participation"     value={`${avgParticipation}%`}               trendDir="neutral" />
        <KPICard label="EOI Pending Total"         value={eoiTotal}                             trendDir="neutral" />
      </KPIGrid>

      <div className="border border-line rounded-md overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>Group Name</th><th>Carrier</th><th>Employees</th>
              <th>Enrolled</th><th>Participation</th><th>Coverage Types</th>
              <th>Enrollment Window</th><th>Status</th><th>EOI Pending</th>
            </tr>
          </thead>
          <tbody>
            {enrollments.map((enr) => (
              <tr key={enr.id}>
                <td className="font-medium">{enr.groupName}</td>
                <td className="text-sm text-ink-secondary">Acme Life</td>
                <td className="tabular-nums">{enr.employeeCount.toLocaleString()}</td>
                <td className="tabular-nums">{enr.enrolledCount.toLocaleString()}</td>
                <td>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-1.5 bg-surface-tertiary rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full',
                          enr.participationRate >= 80 ? 'bg-positive' : enr.participationRate >= 60 ? 'bg-caution' : 'bg-destructive'
                        )}
                        style={{ width: `${enr.participationRate}%` }}
                      />
                    </div>
                    <span className={cn(
                      'text-xs font-medium tabular-nums',
                      enr.participationRate >= 80 ? 'text-positive-text' : enr.participationRate >= 60 ? 'text-caution-text' : 'text-destructive-text'
                    )}>
                      {enr.participationRate.toFixed(1)}%
                    </span>
                  </div>
                </td>
                <td>
                  <span className="text-xs text-ink-secondary">{enr.coverageTypes.join(', ')}</span>
                </td>
                <td>
                  <span className="text-xs text-ink-secondary font-mono">
                    {formatDate(enr.enrollmentStart)} – {formatDate(enr.enrollmentEnd)}
                  </span>
                </td>
                <td><StatusBadge status={enr.status} /></td>
                <td>
                  {enr.eoiPending > 0
                    ? <span className="text-caution-text text-sm font-medium">{enr.eoiPending}</span>
                    : <span className="text-ink-tertiary text-sm">—</span>
                  }
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
