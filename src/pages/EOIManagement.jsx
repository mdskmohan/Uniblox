import { useState } from 'react'
import { toast } from 'sonner'
import { Shield, AlertTriangle } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { KPICard, KPIGrid } from '@/components/shared/KPICard'
import { PHIBanner, Banner } from '@/components/shared/Banner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseButton,
} from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/input'
import { formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function EOIManagement() {
  const { eois, updateEOI, addAuditEntry, currentUser } = useAppStore()
  const [selectedEOI, setSelectedEOI] = useState(null)
  const [confirmAction, setConfirmAction] = useState(null) // { action, eoi }
  const [notes, setNotes] = useState('')
  const [phiConfirmed, setPhiConfirmed] = useState(false)

  const pending   = eois.filter((e) => ['Pending Medical', 'Under Review'].includes(e.status)).length
  const avgDays   = eois.length ? (eois.reduce((a, b) => a + b.daysOpen, 0) / eois.length).toFixed(1) : 0
  const approved  = eois.filter((e) => e.status === 'Approved').length
  const approvalRate = eois.length ? Math.round((approved / eois.length) * 100) : 0

  function startAction(action, eoi) {
    if (!notes.trim()) { toast.error('Notes are required before any EOI action'); return }
    setConfirmAction({ action, eoi })
    setPhiConfirmed(false)
  }

  function confirmDecision() {
    if (!phiConfirmed) { toast.error('You must confirm PHI acknowledgment'); return }
    const { action, eoi } = confirmAction
    const statusMap = { approve: 'Approved', decline: 'Declined', exam: 'Medical Exam Required' }
    updateEOI(eoi.id, { status: statusMap[action], decisionNotes: notes, decisionBy: currentUser.name })
    addAuditEntry({
      id: `AUD-${Date.now()}`,
      timestamp: new Date().toISOString(),
      eventType: 'EOI Action',
      submissionId: eoi.id,
      employer: eoi.employerGroup,
      modelVersion: 'claude-sonnet-4-20250514',
      inputHash: Math.random().toString(36).substring(2, 10),
      riskScore: null,
      aiRecommendation: `${action.toUpperCase()}_EOI`,
      confidenceLevel: null,
      humanOverride: false,
      finalDecision: statusMap[action],
      decidedBy: currentUser.name,
      notes: `EOI ${action}: ${notes} | PHI access logged per HIPAA`,
    })
    toast.success(`EOI ${action === 'exam' ? 'sent for medical exam' : action + 'd'}`, {
      description: `${eoi.id} — ${eoi.employerGroup}. Action logged in audit trail.`
    })
    setConfirmAction(null)
    setNotes('')
    setSelectedEOI(null)
  }

  return (
    <div>
      <PHIBanner />

      <div className="mt-4">
        <PageHeader title="EOI Management" subtitle="Evidence of Insurability — Sensitive workflow. All actions are logged." />

        <KPIGrid cols={3}>
          <KPICard label="Pending EOI"          value={pending}       trendDir="neutral" />
          <KPICard label="Avg Processing Time"  value={`${avgDays}d`} trendDir="neutral" />
          <KPICard label="Approval Rate"        value={`${approvalRate}%`} trendDir="neutral" />
        </KPIGrid>

        <div className="border border-line rounded-md overflow-hidden">
          <table className="w-full data-table">
            <thead>
              <tr>
                <th>EOI ID</th><th>Employee ID</th><th>Employer Group</th>
                <th>Coverage</th><th>GI Limit</th><th>EOI Amount</th>
                <th>Status</th><th>Days Open</th><th>Reviewer</th><th></th>
              </tr>
            </thead>
            <tbody>
              {eois.map((eoi) => (
                <tr key={eoi.id} className="cursor-pointer" onClick={() => setSelectedEOI(eoi)}>
                  <td><span className="font-mono text-xs">{eoi.id}</span></td>
                  <td><span className="font-mono text-xs text-ink-secondary">{eoi.employeeId}</span></td>
                  <td className="font-medium">{eoi.employerGroup}</td>
                  <td>{eoi.coverageRequested}</td>
                  <td className="tabular-nums">${eoi.giLimit.toLocaleString()}</td>
                  <td className="tabular-nums font-medium">${eoi.eoiAmount.toLocaleString()}</td>
                  <td><StatusBadge status={eoi.status} /></td>
                  <td className="text-center">{eoi.daysOpen}</td>
                  <td className="text-sm text-ink-secondary">{eoi.assignedReviewer ?? <span className="text-caution-text">Unassigned</span>}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedEOI(eoi)}>Review</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* EOI Detail Modal */}
      {selectedEOI && (
        <Dialog open={!!selectedEOI} onOpenChange={() => setSelectedEOI(null)}>
          <DialogContent wide>
            <DialogHeader>
              <div>
                <DialogTitle>{selectedEOI.id}</DialogTitle>
                <div className="text-sm text-ink-secondary">{selectedEOI.employerGroup}</div>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge status={selectedEOI.status} />
                <DialogCloseButton />
              </div>
            </DialogHeader>

            {/* PHI reminder inside modal */}
            <div className="flex items-center gap-2 px-6 py-2 bg-caution-light border-b border-caution/30 text-caution-text text-xs">
              <Shield size={13} />
              <span><strong>PHI Notice:</strong> This record contains Protected Health Information. Your access is logged. Do not share outside authorized channels.</span>
            </div>

            <DialogBody>
              <div className="flex gap-6">
                {/* Left */}
                <div className="flex-1">
                  <div className="font-semibold text-sm mb-3">Employee Information (Anonymized)</div>
                  <div className="grid grid-cols-2 gap-x-4 mb-4">
                    {[
                      ['Employee ID', selectedEOI.employeeId],
                      ['Date of Birth', selectedEOI.dob],
                      ['Gender', selectedEOI.gender],
                      ['Coverage Requested', selectedEOI.coverageRequested],
                      ['GI Limit', `$${selectedEOI.giLimit.toLocaleString()}`],
                      ['Coverage Amount', `$${selectedEOI.coverageAmount.toLocaleString()}`],
                      ['EOI Amount (Above GI)', `$${selectedEOI.eoiAmount.toLocaleString()}`],
                    ].map(([k, v]) => (
                      <div key={k} className="py-1.5 border-b border-line">
                        <div className="text-xs text-ink-tertiary">{k}</div>
                        <div className="text-sm font-medium text-ink-primary">{v}</div>
                      </div>
                    ))}
                  </div>

                  <div className="font-semibold text-sm mb-2">Health Questions</div>
                  <div className="space-y-1">
                    {selectedEOI.healthAnswers.map((qa, i) => (
                      <div key={i} className={cn(
                        'flex items-start gap-3 p-2 rounded text-xs border',
                        qa.answer === 'No' ? 'border-line' : 'border-caution bg-caution-light'
                      )}>
                        {qa.answer === 'No'
                          ? <span className="text-positive flex-shrink-0 font-bold">✓</span>
                          : <AlertTriangle size={12} className="text-caution flex-shrink-0 mt-0.5" />
                        }
                        <div>
                          <div className="text-ink-secondary">{qa.question}</div>
                          <div className={cn('font-medium mt-0.5', qa.answer === 'No' ? 'text-ink-primary' : 'text-caution-text')}>
                            {qa.answer}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 p-3 bg-caution-light border border-caution/30 rounded-md">
                    <div className="text-xs font-semibold text-caution-text mb-1">
                      ADVISORY ONLY — AI Preliminary Screening
                    </div>
                    <div className="text-xs text-caution-text mb-2">
                      This AI analysis is NOT a medical determination. It is a preliminary screening aid only.
                      Final EOI decisions require qualified underwriter review.
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Badge variant={selectedEOI.aiRiskLevel === 'Low' ? 'success' : selectedEOI.aiRiskLevel === 'High' ? 'danger' : 'warning'}>
                        {selectedEOI.aiRiskLevel} Risk
                      </Badge>
                    </div>
                    <div className="text-xs text-ink-secondary">{selectedEOI.aiReasoning}</div>
                  </div>
                </div>

                {/* Right */}
                <div className="w-56">
                  <div className="font-semibold text-sm mb-3">Assessment Context</div>
                  <div className="space-y-3">
                    <div className="p-3 border border-line rounded-md text-xs">
                      <div className="font-medium text-ink-primary mb-1">Medical Exam</div>
                      <div className={cn(
                        'font-semibold',
                        selectedEOI.medicalExamRequired ? 'text-caution-text' : 'text-positive-text'
                      )}>
                        {selectedEOI.medicalExamRequired ? 'Required' : 'Not Required'}
                      </div>
                    </div>
                    <div className="p-3 border border-line rounded-md text-xs">
                      <div className="font-medium text-ink-primary mb-1">Prior EOI History</div>
                      <div className="text-ink-secondary">{selectedEOI.priorEOI ?? 'No prior EOI records'}</div>
                    </div>
                    <div className="p-3 border border-line rounded-md text-xs">
                      <div className="font-medium text-ink-primary mb-1">Days Open</div>
                      <div className="text-2xl font-bold text-ink-primary">{selectedEOI.daysOpen}</div>
                    </div>
                  </div>

                  {/* Action notes (required before any button) */}
                  <div className="mt-4">
                    <div className="text-xs text-ink-secondary mb-1 font-medium">Underwriter Notes (required)</div>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Required before any action..."
                      className="min-h-[80px] text-xs"
                    />
                  </div>
                </div>
              </div>
            </DialogBody>

            <DialogFooter className="gap-2">
              <Button variant="secondary" onClick={() => setSelectedEOI(null)}>Close</Button>
              <Button variant="secondary" onClick={() => startAction('exam', selectedEOI)}>Request Medical Exam</Button>
              <Button variant="danger"    onClick={() => startAction('decline', selectedEOI)}>Decline EOI</Button>
              <Button variant="success"   onClick={() => startAction('approve', selectedEOI)}>Approve EOI</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* PHI Confirmation Modal */}
      {confirmAction && (
        <Dialog open={!!confirmAction} onOpenChange={() => setConfirmAction(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm EOI Decision</DialogTitle>
              <DialogCloseButton />
            </DialogHeader>
            <DialogBody>
              <Banner variant="warning" title="Protected Health Information" className="mb-4">
                You are authorizing a decision on Protected Health Information. This action is permanently
                logged and audited with your credentials and timestamp. Confirm?
              </Banner>
              <div className="text-sm text-ink-secondary mb-3">
                Action: <strong className="text-ink-primary capitalize">{confirmAction.action}</strong> EOI for{' '}
                <strong>{confirmAction.eoi.employeeId}</strong> ({confirmAction.eoi.employerGroup})
              </div>
              <label className="flex items-start gap-2 cursor-pointer">
                <input type="checkbox" checked={phiConfirmed} onChange={(e) => setPhiConfirmed(e.target.checked)}
                       className="mt-0.5 accent-brand" />
                <span className="text-sm text-ink-primary">
                  I understand this action involves Protected Health Information and is permanently
                  logged. I am authorized to make this decision.
                </span>
              </label>
            </DialogBody>
            <DialogFooter>
              <Button variant="secondary" onClick={() => setConfirmAction(null)}>Cancel</Button>
              <Button variant="danger" disabled={!phiConfirmed} onClick={confirmDecision}>
                Confirm & Log Decision
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
