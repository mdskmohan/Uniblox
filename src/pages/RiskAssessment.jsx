import useAppStore from '@/store/useAppStore'
import { PageHeader } from '@/components/shared/PageHeader'
import { RiskScoreCell, RiskGauge, SubScoreBar } from '@/components/shared/RiskScore'
import { KPICard, KPIGrid } from '@/components/shared/KPICard'
import { useNavigate } from 'react-router-dom'

export default function RiskAssessment() {
  const { submissions } = useAppStore()
  const navigate = useNavigate()
  const withScores = submissions.filter((s) => s.riskScore != null)
  const avgRisk = withScores.length
    ? Math.round(withScores.reduce((a, b) => a + b.riskScore, 0) / withScores.length) : 0

  const high   = withScores.filter((s) => s.riskScore >= 70).length
  const medium = withScores.filter((s) => s.riskScore >= 40 && s.riskScore < 70).length
  const low    = withScores.filter((s) => s.riskScore < 40).length

  return (
    <div>
      <PageHeader title="Risk Assessment" subtitle="Portfolio-level risk overview across all submissions" />
      <KPIGrid>
        <KPICard label="Average Risk Score"  value={avgRisk} trendDir="neutral" />
        <KPICard label="High Risk (70+)"     value={high}    trendDir="neutral" />
        <KPICard label="Medium Risk (40–69)" value={medium}  trendDir="neutral" />
        <KPICard label="Low Risk (0–39)"     value={low}     trendDir="neutral" />
      </KPIGrid>

      <div className="border border-line rounded-md overflow-x-auto">
        <table className="w-full data-table">
          <thead>
            <tr>
              <th>ID</th><th>Employer</th><th>Industry</th>
              <th>Risk Score</th><th>Liability</th><th>Financial</th><th>Claims</th><th>Industry</th>
            </tr>
          </thead>
          <tbody>
            {withScores.sort((a,b) => b.riskScore - a.riskScore).map((sub) => (
              <tr key={sub.id} className="cursor-pointer" onClick={() => navigate(`/submissions/${sub.id}`)}>
                <td><span className="font-mono text-xs text-ink-secondary">{sub.id}</span></td>
                <td><span className="font-medium">{sub.employerName}</span></td>
                <td>{sub.industry}</td>
                <td><RiskScoreCell score={sub.riskScore} /></td>
                <td><RiskScoreCell score={sub.subScores?.liabilityRisk} /></td>
                <td><RiskScoreCell score={sub.subScores?.financialStability} /></td>
                <td><RiskScoreCell score={sub.subScores?.claimsHistory} /></td>
                <td><RiskScoreCell score={sub.subScores?.industryRisk} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
