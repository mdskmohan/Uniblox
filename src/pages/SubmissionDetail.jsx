import { useParams, useNavigate, Link } from 'react-router-dom'
import { useState } from 'react'
import { toast } from 'sonner'
import { ChevronRight, FileText, Send, Clock, AlertTriangle, CheckCircle2 } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { StatusBadge, Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Input, Textarea } from '@/components/ui/input'
import { Card, CardHeader, CardTitle, CardBody } from '@/components/ui/card'
import { RiskGauge, SubScoreBar, ConfidenceBar } from '@/components/shared/RiskScore'
import { Banner } from '@/components/shared/Banner'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogBody, DialogFooter, DialogCloseButton,
} from '@/components/ui/dialog'
import { checkCarrierAppetite, generateAdverseActionNotice, getAdverseActionDeadline } from '@/engine/compliance'
import { formatDate, formatDateTime, daysUntil } from '@/lib/utils'
import { cn } from '@/lib/utils'

export default function SubmissionDetail() {
  const { id }   = useParams()
  const navigate = useNavigate()
  const { getSubmission, updateSubmission, addMessageToSubmission, currentUser, getActiveCarrier } = useAppStore()

  const sub     = getSubmission(id)
  const carrier = getActiveCarrier()

  const [msgText,   setMsgText]   = useState('')
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideTo,   setOverrideTo]   = useState('APPROVE')
  const [overrideNote, setOverrideNote] = useState('')
  const [noticeOpen, setNoticeOpen] = useState(false)

  if (!sub) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-3">
        <div className="text-4xl opacity-30">🔍</div>
        <div className="text-lg font-medium text-ink-primary">Submission not found</div>
        <Button variant="secondary" onClick={() => navigate('/submissions')}>Back to Submissions</Button>
      </div>
    )
  }

  const appetite = checkCarrierAppetite(sub.industry, carrier)
  const daysDue  = sub.adverseActionDeadline ? daysUntil(sub.adverseActionDeadline) : null
  const daysUntilDeadline = daysDue

  function handleSendMessage() {
    if (!msgText.trim()) return
    addMessageToSubmission(sub.id, {
      id: Date.now(),
      from: 'underwriter',
      sender: currentUser.name,
      text: msgText.trim(),
      timestamp: new Date().toISOString(),
    })
    setMsgText('')
    toast.success('Message sent to broker')
  }

  function handleOverride() {
    if (!overrideNote.trim()) { toast.error('Override reason is required'); return }
    updateSubmission(sub.id, {
      status: overrideTo === 'APPROVE' ? 'APPROVED' : overrideTo === 'DECLINE' ? 'DECLINED' : 'REFERRED',
      recommendation: overrideTo,
      humanOverride: true,
      overrideReason: overrideNote,
    })
    toast.success('Decision overridden', { description: `${sub.id} → ${overrideTo}` })
    setOverrideOpen(false)
  }

  function handleGenerateNotice() {
    const notice = generateAdverseActionNotice(sub, sub.reasoning || ['Risk score exceeds carrier threshold'], carrier)
    const blob = new Blob([notice], { type: 'text/plain' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href = url; a.download = `adverse_action_${sub.id}.txt`; a.click()
    URL.revokeObjectURL(url)
    updateSubmission(sub.id, { adverseActionSent: true })
    toast.success('Adverse action notice generated & downloaded')
    setNoticeOpen(false)
  }

  const recColor = sub.recommendation === 'APPROVE' ? 'bg-positive-light border-positive text-positive-text'
    : sub.recommendation === 'DECLINE' ? 'bg-destructive-light border-destructive text-destructive-text'
    : 'bg-caution-light border-caution text-caution-text'

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-1.5 text-sm mb-5">
        <Link to="/submissions" className="text-ink-secondary hover:text-brand">Submissions</Link>
        <ChevronRight size={13} className="text-ink-tertiary" />
        <span className="text-ink-secondary">{sub.employerName}</span>
        <ChevronRight size={13} className="text-ink-tertiary" />
        <span className="font-mono text-xs text-ink-tertiary">{sub.id}</span>
      </nav>

      {/* Carrier appetite flag */}
      {appetite === 'OUTSIDE_APPETITE' && (
        <Banner variant="danger" title="Outside Carrier Appetite" className="mb-4">
          {carrier?.name} does not write coverage for {sub.industry}.
          <div className="flex gap-2 mt-2">
            <Button size="sm" variant="secondary" onClick={() => toast.info('Carrier reassignment via Carrier Config')}>Reassign Carrier</Button>
            <Button size="sm" variant="danger" onClick={() => updateSubmission(sub.id, { status: 'DECLINED' })}>Decline Immediately</Button>
          </div>
        </Banner>
      )}

      {/* Low confidence banner */}
      {sub.confidenceLevel != null && sub.confidenceLevel < 60 && (
        <Banner variant="warning" title="Low AI Confidence — Automatic Human Review Required" className="mb-4">
          AI confidence {sub.confidenceLevel}% is below the 60% threshold. This submission has been automatically routed to human review.
          The Accept AI Recommendation button is disabled.
        </Banner>
      )}

      {/* EOI PHI banner */}
      {sub.coverageTypes?.includes('LTC') && (
        <div className="banner-phi mb-4">
          <span>This submission includes LTC coverage. EOI health data is governed by HIPAA. Handle with care.</span>
        </div>
      )}

      <div className="flex gap-5">
        {/* ── LEFT COLUMN ── */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-xl font-semibold text-ink-primary">{sub.employerName}</h1>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="font-mono text-xs text-ink-tertiary">{sub.id}</span>
                <StatusBadge status={sub.status} />
                <Badge variant={sub.priority === 'high' ? 'danger' : sub.priority === 'medium' ? 'warning' : 'gray'}>
                  {sub.priority?.toUpperCase()} PRIORITY
                </Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" onClick={() => navigate('/submissions')}>← Back</Button>
              <Button size="sm" onClick={() => setOverrideOpen(true)}>Override Decision</Button>
            </div>
          </div>

          <Tabs defaultValue="overview">
            <TabsList>
              {['overview','assessment','compliance','documents','activity'].map((t) => (
                <TabsTrigger key={t} value={t}>
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </TabsTrigger>
              ))}
            </TabsList>

            {/* Overview */}
            <TabsContent value="overview">
              <div className="space-y-4">
                {[
                  { title: 'Employer Information', fields: [
                    ['Employer Name', sub.employerName], ['Industry', sub.industry],
                    ['State', sub.state], ['Employee Count', sub.employeeCount?.toLocaleString()],
                    ['Annual Revenue', sub.annualRevenue], ['Years in Business', sub.yearsInBusiness],
                    ['Business Entity', sub.businessEntityType],
                  ]},
                  { title: 'Coverage Details', fields: [
                    ['Coverage Types', sub.coverageTypes?.join(', ')],
                    ['Effective Date', sub.requestedEffectiveDate ? formatDate(sub.requestedEffectiveDate) : '—'],
                    ['Self-Funded / ERISA', sub.selfFunded ? 'Yes' : 'No'],
                  ]},
                  { title: 'Risk Profile', fields: [
                    ['Prior Claims', sub.priorClaims ? 'Yes' : 'No'],
                    ['Claims Count', sub.claimsCount ?? '—'],
                    ['Claims Total', sub.claimsTotal ?? '—'],
                    ['Claims Description', sub.claimsDescription ?? '—'],
                    ['Additional Risk Factors', sub.additionalRiskFactors?.join(', ') ?? '—'],
                  ]},
                  { title: 'Submission Metadata', fields: [
                    ['Broker', sub.brokerName], ['Broker License', sub.brokerLicense],
                    ['Broker Email', sub.brokerEmail], ['Submitted', formatDateTime(sub.submittedAt)],
                    ['Carrier', carrier?.name ?? '—'], ['Assigned Underwriter', sub.assignedUnderwriter ?? 'Unassigned'],
                  ]},
                ].map(({ title, fields }) => (
                  <div key={title} className="card">
                    <div className="px-4 py-3 border-b border-line font-medium text-sm text-ink-primary">{title}</div>
                    <div className="p-4 grid grid-cols-2 gap-x-8">
                      {fields.map(([label, value]) => (
                        <div key={label} className="flex items-baseline justify-between py-1.5 border-b border-line last:border-0 col-span-1">
                          <span className="text-xs text-ink-secondary">{label}</span>
                          <span className="text-xs text-ink-primary text-right max-w-[55%] font-medium">{value ?? '—'}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {/* AI Assessment */}
            <TabsContent value="assessment">
              <div className="space-y-4">
                <div className={cn('flex items-start gap-3 p-4 rounded-md border', recColor)}>
                  <span className="text-2xl">{sub.recommendation === 'APPROVE' ? '✓' : sub.recommendation === 'DECLINE' ? '✗' : '⚡'}</span>
                  <div>
                    <div className="text-lg font-semibold">{sub.recommendation}</div>
                    <div className="text-sm mt-0.5 opacity-80">AI recommendation · claude-sonnet-4-20250514</div>
                  </div>
                </div>

                <div className="card p-5 flex items-start gap-6">
                  <RiskGauge score={sub.riskScore} />
                  <div className="flex-1">
                    <div className="text-xs text-ink-secondary mb-1">Confidence Level</div>
                    <ConfidenceBar confidence={sub.confidenceLevel} />
                    <div className="mt-4 space-y-0">
                      {Object.entries(sub.subScores || {}).map(([k, v]) => (
                        <SubScoreBar key={k} label={k.replace(/([A-Z])/g, ' $1').trim()} score={v} />
                      ))}
                    </div>
                  </div>
                </div>

                {sub.reasoning?.length > 0 && (
                  <div className="card p-4">
                    <div className="font-medium text-sm mb-3">Reasoning</div>
                    <ul className="space-y-2">
                      {sub.reasoning.map((r, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-ink-secondary">
                          <span className="text-brand font-bold flex-shrink-0">•</span>{r}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="flex gap-2">
                  <Button disabled={sub.confidenceLevel < 60} onClick={() => toast.success('AI recommendation accepted')}>
                    Accept AI Recommendation
                  </Button>
                  <Button variant="secondary" onClick={() => setOverrideOpen(true)}>Override Decision</Button>
                  <Button variant="secondary" onClick={() => toast.info('Request sent to broker queue')}>Request More Info</Button>
                </div>
              </div>
            </TabsContent>

            {/* Compliance */}
            <TabsContent value="compliance">
              <div className="space-y-4">
                {sub.complianceNotes?.map((note, i) => (
                  <div key={i} className="flex items-start gap-2 p-3 bg-surface-secondary border border-line rounded-md text-sm">
                    <CheckCircle2 size={14} className="text-positive flex-shrink-0 mt-0.5" />
                    <span className="text-ink-secondary">{note}</span>
                  </div>
                ))}

                {sub.status === 'DECLINED' && (
                  <div className="card p-4">
                    <div className="font-medium text-sm mb-3 flex items-center gap-2">
                      <Clock size={14} className="text-caution" /> Adverse Action Notice Status
                    </div>
                    {daysUntilDeadline != null && (
                      <div className={cn('text-2xl font-bold font-mono mb-1',
                        daysUntilDeadline <= 2 ? 'text-destructive' : 'text-caution-text')}>
                        {daysUntilDeadline > 0 ? `${daysUntilDeadline} days remaining` : 'OVERDUE'}
                      </div>
                    )}
                    <div className="text-sm text-ink-secondary mb-3">
                      {sub.adverseActionSent ? '✓ Notice sent' : 'Notice not yet sent'}
                    </div>
                    {!sub.adverseActionSent && (
                      <Button size="sm" onClick={() => setNoticeOpen(true)}>Generate Adverse Action Notice</Button>
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Documents */}
            <TabsContent value="documents">
              <div className="space-y-2 mb-4">
                {(sub.documents || []).map((doc) => (
                  <div key={doc.id} className="flex items-center gap-3 p-3 border border-line rounded-md hover:bg-surface-hover transition-colors">
                    <FileText size={16} className="text-brand flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-ink-primary truncate">{doc.name}</div>
                      <div className="text-xs text-ink-tertiary">{doc.size} · {doc.uploadedBy} · {formatDate(doc.uploadedAt, { relative: true })}</div>
                    </div>
                    <Badge variant={doc.status === 'Reviewed' ? 'success' : 'pending'}>{doc.status}</Badge>
                    <Button variant="ghost" size="sm" onClick={() => toast.info('Download started')}>Download</Button>
                  </div>
                ))}
                {(!sub.documents || sub.documents.length === 0) && (
                  <div className="text-center py-8 text-ink-tertiary text-sm">No documents attached</div>
                )}
              </div>
              <div className="border-2 border-dashed border-line rounded-md p-8 text-center hover:border-brand transition-colors cursor-pointer"
                   onClick={() => toast.info('File upload coming soon')}>
                <div className="text-2xl mb-2 opacity-40">↑</div>
                <div className="text-sm font-medium text-ink-primary">Drop files here or click to browse</div>
                <div className="text-xs text-ink-tertiary mt-1">PDF, CSV, XLSX — max 10MB</div>
              </div>
            </TabsContent>

            {/* Activity */}
            <TabsContent value="activity">
              <ul className="space-y-0">
                {(sub.messages || []).length === 0 && (
                  <div className="text-center py-8 text-ink-tertiary text-sm">No activity recorded</div>
                )}
                {(sub.messages || []).map((msg, i) => (
                  <li key={msg.id} className="flex gap-3 pb-4 relative">
                    {i < (sub.messages.length - 1) && (
                      <div className="absolute left-[7px] top-5 bottom-0 w-0.5 bg-line" />
                    )}
                    <div className={cn(
                      'w-3.5 h-3.5 rounded-full flex-shrink-0 mt-1 border-2 border-surface-primary',
                      msg.from === 'underwriter' ? 'bg-brand' : 'bg-positive'
                    )} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-ink-primary">{msg.sender}</span>
                        <span className="text-xs text-ink-tertiary">{formatDateTime(msg.timestamp)}</span>
                        <Badge variant={msg.from === 'underwriter' ? 'info' : 'gray'} className="text-[10px]">
                          {msg.from === 'underwriter' ? 'Underwriter' : 'Broker'}
                        </Badge>
                      </div>
                      <div className="text-sm text-ink-secondary mt-0.5">{msg.text}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </TabsContent>
          </Tabs>
        </div>

        {/* ── RIGHT COLUMN ── */}
        <div className="w-72 flex-shrink-0 space-y-4">
          {/* Status card */}
          <Card className={cn('border-l-4', sub.priority === 'high' ? 'border-l-destructive' : sub.priority === 'medium' ? 'border-l-caution' : 'border-l-positive')}>
            <CardBody className="space-y-3">
              <div className="flex items-center justify-between">
                <StatusBadge status={sub.status} />
                <Badge variant={sub.priority === 'high' ? 'danger' : sub.priority === 'medium' ? 'warning' : 'gray'}>
                  {sub.priority?.toUpperCase()}
                </Badge>
              </div>
              <div className="text-xs text-ink-tertiary">
                Submitted {formatDate(sub.submittedAt, { relative: true })}
              </div>
              {sub.assignedUnderwriter
                ? <div className="text-xs text-ink-secondary">Assigned to <span className="font-medium text-ink-primary">{sub.assignedUnderwriter}</span></div>
                : <div className="text-xs text-caution-text">Unassigned</div>
              }
            </CardBody>
          </Card>

          {/* Adverse action timer */}
          {sub.status === 'DECLINED' && sub.adverseActionDeadline && (
            <Card>
              <CardBody>
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle size={14} className={daysUntilDeadline <= 2 ? 'text-destructive' : 'text-caution'} />
                  <span className="text-xs font-medium text-ink-primary">Adverse Action Deadline</span>
                </div>
                <div className={cn('text-2xl font-bold font-mono mb-1',
                  daysUntilDeadline <= 2 ? 'text-destructive' : 'text-caution-text')}>
                  {daysUntilDeadline > 0 ? `${daysUntilDeadline}d remaining` : 'OVERDUE'}
                </div>
                {!sub.adverseActionSent && (
                  <Button size="sm" variant="danger" className="w-full mt-2" onClick={() => setNoticeOpen(true)}>
                    Generate Notice
                  </Button>
                )}
                {sub.adverseActionSent && (
                  <div className="text-xs text-positive-text mt-1 flex items-center gap-1">
                    <CheckCircle2 size={12} /> Notice sent
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          {/* Risk summary */}
          <Card>
            <CardBody className="flex flex-col items-center gap-3">
              <RiskGauge score={sub.riskScore} size={100} />
              <ConfidenceBar confidence={sub.confidenceLevel} />
              <div className={cn('flex items-center gap-2 text-sm font-medium w-full justify-center p-2 rounded',
                sub.recommendation === 'APPROVE' ? 'bg-positive-light text-positive-text' :
                sub.recommendation === 'DECLINE' ? 'bg-destructive-light text-destructive-text' :
                'bg-caution-light text-caution-text')}>
                {sub.recommendation === 'APPROVE' ? '✓' : sub.recommendation === 'DECLINE' ? '✗' : '⚡'}
                {sub.recommendation}
              </div>
            </CardBody>
          </Card>

          {/* Carrier config card */}
          <Card>
            <div className="px-4 py-3 border-b border-line text-xs font-semibold text-ink-secondary uppercase tracking-wider">Carrier Config</div>
            <CardBody className="space-y-2">
              <div className="text-sm font-medium text-ink-primary">{carrier?.name}</div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">Industry Appetite</span>
                <span className={cn('font-medium',
                  appetite === 'ACCEPTABLE'       ? 'text-positive-text' :
                  appetite === 'MARGINAL'          ? 'text-caution-text' :
                  appetite === 'OUTSIDE_APPETITE'  ? 'text-destructive-text' : 'text-ink-tertiary')}>
                  {appetite === 'OUTSIDE_APPETITE' ? 'Outside Appetite'
                    : appetite === 'ACCEPTABLE' ? 'Acceptable'
                    : appetite === 'MARGINAL'   ? 'Marginal'
                    : 'Unknown'}
                </span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">GI Limit (Life)</span>
                <span className="font-medium">${(carrier?.giLimits?.Life || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-xs">
                <span className="text-ink-secondary">Auto-Approve ≤</span>
                <span className="font-medium">{carrier?.autoApproveThreshold}</span>
              </div>
            </CardBody>
          </Card>

          {/* Quick actions */}
          <Card>
            <div className="px-4 py-3 border-b border-line text-xs font-semibold text-ink-secondary uppercase tracking-wider">Quick Actions</div>
            <CardBody className="flex flex-col gap-2">
              {sub.status === 'PENDING' && <>
                <Button size="sm" variant="success" className="w-full" onClick={() => { updateSubmission(sub.id, { status: 'APPROVED' }); toast.success('Approved') }}>Approve</Button>
                <Button size="sm" variant="danger"  className="w-full" onClick={() => { updateSubmission(sub.id, { status: 'DECLINED' }); toast.success('Declined') }}>Decline</Button>
                <Button size="sm" variant="secondary" className="w-full" onClick={() => { updateSubmission(sub.id, { status: 'REFERRED' }); toast.success('Referred') }}>Refer</Button>
              </>}
              {sub.status === 'APPROVED' && <>
                <Button size="sm" variant="primary"   className="w-full" onClick={() => toast.info('Generating quote...')}>Generate Quote</Button>
                <Button size="sm" variant="secondary" className="w-full" onClick={() => toast.info('Sending to carrier system...')}>Send to Carrier</Button>
                <Button size="sm" variant="ghost"     className="w-full" onClick={() => toast.info('Broker notified')}>Notify Broker</Button>
              </>}
              {sub.status === 'DECLINED' && <>
                <Button size="sm" variant="danger"   className="w-full" onClick={() => setNoticeOpen(true)}>Generate Notice</Button>
                <Button size="sm" variant="secondary" className="w-full" onClick={() => toast.info('Appeal rights document generated')}>View Appeal Rights</Button>
              </>}
            </CardBody>
          </Card>

          {/* Broker communication */}
          <Card>
            <div className="px-4 py-3 border-b border-line text-xs font-semibold text-ink-secondary uppercase tracking-wider">Broker Communication</div>
            <CardBody className="space-y-3">
              <div className="text-sm">
                <div className="font-medium text-ink-primary">{sub.brokerName}</div>
                <div className="text-xs text-ink-tertiary">{sub.brokerEmail}</div>
                <div className="text-xs text-ink-tertiary">{sub.brokerPhone}</div>
              </div>

              <div className="max-h-48 overflow-y-auto space-y-2">
                {(sub.messages || []).map((msg) => (
                  <div key={msg.id} className={cn('p-2 rounded text-xs max-w-[90%]',
                    msg.from === 'underwriter' ? 'bg-brand-light text-brand-text ml-auto' : 'bg-surface-secondary')}>
                    <div className="font-medium mb-0.5">{msg.sender}</div>
                    <div>{msg.text}</div>
                    <div className="text-[10px] opacity-60 mt-0.5">{formatDate(msg.timestamp, { relative: true })}</div>
                  </div>
                ))}
              </div>

              <div className="flex gap-1.5">
                <Input
                  value={msgText}
                  onChange={(e) => setMsgText(e.target.value)}
                  placeholder="Message broker..."
                  className="text-xs"
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                />
                <Button size="sm" onClick={handleSendMessage}><Send size={12} /></Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Override modal */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Override Decision</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody className="space-y-4">
            <div>
              <label className="text-sm text-ink-secondary block mb-1">Override To</label>
              <select className="select w-full" value={overrideTo} onChange={(e) => setOverrideTo(e.target.value)}>
                {['APPROVE','DECLINE','REFER'].map((o) => <option key={o}>{o}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-ink-secondary block mb-1">Reason (required) *</label>
              <Textarea value={overrideNote} onChange={(e) => setOverrideNote(e.target.value)}
                placeholder="Provide detailed justification for this override..." className="min-h-[100px]" />
            </div>
            <Banner variant="warning">
              Human overrides are permanently logged in the audit trail with your name, timestamp, and reason.
            </Banner>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button variant="danger" onClick={handleOverride}>Confirm Override</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Adverse action notice modal */}
      <Dialog open={noticeOpen} onOpenChange={setNoticeOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Generate Adverse Action Notice</DialogTitle>
            <DialogCloseButton />
          </DialogHeader>
          <DialogBody>
            <Banner variant="warning" title="Compliance Action Required" className="mb-3">
              This will generate a state-compliant adverse action notice per {sub.state} regulations.
              The notice will be downloaded as a text file. You must send it within {getAdverseActionDeadline({ state: sub.state })} days of the decline decision.
            </Banner>
            <div className="text-sm text-ink-secondary">
              <strong>Employer:</strong> {sub.employerName}<br />
              <strong>State:</strong> {sub.state}<br />
              <strong>Deadline:</strong> {getAdverseActionDeadline({ state: sub.state })} calendar days
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="secondary" onClick={() => setNoticeOpen(false)}>Cancel</Button>
            <Button onClick={handleGenerateNotice}>Generate & Download Notice</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
