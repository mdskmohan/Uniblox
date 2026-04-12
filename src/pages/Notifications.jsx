import { useState } from 'react'
import { toast } from 'sonner'
import { PageHeader } from '@/components/shared/PageHeader'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'

export default function Notifications() {
  const [prefs, setPrefs] = useState({
    submissionAssigned: true,
    decisionRequired:   true,
    adverseActionDue:   true,
    eoiUpdates:         true,
    systemAlerts:       true,
    weeklyDigest:       false,
    emailSummary:       true,
    slackIntegration:   false,
  })

  function tog(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })) }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Notifications" subtitle="Choose which alerts you receive inside the platform and by email." />

      <div className="card">
        <div className="px-5 py-4 border-b border-line">
          <div className="font-semibold text-sm text-ink-primary">In-App Notifications</div>
          <div className="text-xs text-ink-tertiary mt-0.5">Shown as bell alerts in the top navigation.</div>
        </div>
        <div className="p-5 space-y-4">
          {[
            { key: 'submissionAssigned', label: 'Submission assigned to me',  desc: 'When a new submission is routed to your queue.' },
            { key: 'decisionRequired',   label: 'Decision required',          desc: 'When a submission is waiting for your underwriting decision.' },
            { key: 'adverseActionDue',   label: 'Adverse action notice due',  desc: 'When a regulatory notice deadline is approaching.' },
            { key: 'eoiUpdates',         label: 'EOI status updates',         desc: 'When an EOI application changes status.' },
            { key: 'systemAlerts',       label: 'System alerts',              desc: 'AI connectivity issues, configuration errors, and similar.' },
          ].map(({ key, label, desc }) => (
            <Switch key={key} checked={prefs[key]} onCheckedChange={() => tog(key)} label={label} description={desc} />
          ))}
        </div>
      </div>

      <div className="card">
        <div className="px-5 py-4 border-b border-line">
          <div className="font-semibold text-sm text-ink-primary">Email Notifications</div>
          <div className="text-xs text-ink-tertiary mt-0.5">Sent to your registered work email address.</div>
        </div>
        <div className="p-5 space-y-4">
          {[
            { key: 'weeklyDigest',     label: 'Weekly digest',          desc: 'A Monday summary of your submissions, decisions, and portfolio.' },
            { key: 'emailSummary',     label: 'Daily activity summary', desc: 'End-of-day summary of your queue and pending actions.' },
            { key: 'slackIntegration', label: 'Slack notifications',    desc: 'Forward critical alerts to your connected Slack workspace.' },
          ].map(({ key, label, desc }) => (
            <Switch key={key} checked={prefs[key]} onCheckedChange={() => tog(key)} label={label} description={desc} />
          ))}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Notification settings saved')}>Save Notifications</Button>
      </div>
    </div>
  )
}
