import { useState } from 'react'
import { toast } from 'sonner'
import {
  Camera, Eye, EyeOff, AlertTriangle, Lock, Unlock,
  CheckCircle2, Monitor, LogOut, Key, XCircle, Clock
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input, FormGroup } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const SESSIONS = [
  { device: 'MacBook Pro — Chrome', location: 'San Francisco, CA', current: true,  lastActive: 'Now' },
  { device: 'iPhone 15 — Safari',   location: 'San Francisco, CA', current: false, lastActive: '2 hours ago' },
  { device: 'Windows PC — Edge',    location: 'New York, NY',      current: false, lastActive: '3 days ago' },
]

function TabBar({ tab, setTab }) {
  const tabs = [
    { id: 'profile',       label: 'Profile' },
    { id: 'preferences',   label: 'Preferences' },
    { id: 'notifications', label: 'Notifications' },
    { id: 'security',      label: 'Security' },
  ]
  return (
    <div className="flex border-b border-line mb-7 -mt-1">
      {tabs.map(({ id, label }) => (
        <button
          key={id}
          onClick={() => setTab(id)}
          className={cn(
            'px-5 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors',
            tab === id
              ? 'text-brand border-brand'
              : 'text-ink-secondary border-transparent hover:text-ink-primary'
          )}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function Section({ title, description, children }) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-line">
        <div className="font-semibold text-ink-primary text-sm">{title}</div>
        {description && <div className="text-xs text-ink-tertiary mt-0.5">{description}</div>}
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

// ── Profile Tab ────────────────────────────────────────────────────────────────
function ProfileTab({ currentUser }) {
  const [profile, setProfile] = useState({
    name:       currentUser.name,
    email:      currentUser.email,
    phone:      '+1 (415) 555-0147',
    title:      currentUser.role,
    department: 'Underwriting',
    timezone:   'America/Los_Angeles',
  })
  const [dirty, setDirty] = useState(false)

  function set(key, val) {
    setProfile((p) => ({ ...p, [key]: val }))
    setDirty(true)
  }

  function save() {
    toast.success('Profile saved')
    setDirty(false)
  }

  return (
    <div className="space-y-5">
      <Section title="Personal Information">
        <div className="grid grid-cols-2 gap-4">
          <FormGroup label="Full Name">
            <Input value={profile.name} onChange={(e) => set('name', e.target.value)} />
          </FormGroup>
          <FormGroup label="Work Email">
            <Input type="email" value={profile.email} onChange={(e) => set('email', e.target.value)} />
          </FormGroup>
          <FormGroup label="Phone Number">
            <Input type="tel" value={profile.phone} onChange={(e) => set('phone', e.target.value)} />
          </FormGroup>
          <FormGroup label="Job Title">
            <Input value={profile.title} onChange={(e) => set('title', e.target.value)} />
          </FormGroup>
          <FormGroup label="Department">
            <select
              value={profile.department}
              onChange={(e) => set('department', e.target.value)}
              className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                         focus:outline-none focus:border-brand text-ink-primary"
            >
              {['Underwriting','Compliance','Enrollment','Analytics','IT','Management'].map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </FormGroup>
          <FormGroup label="Timezone">
            <select
              value={profile.timezone}
              onChange={(e) => set('timezone', e.target.value)}
              className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                         focus:outline-none focus:border-brand text-ink-primary"
            >
              {['America/Los_Angeles','America/Denver','America/Chicago','America/New_York'].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </FormGroup>
        </div>
      </Section>

      <Section title="Organization">
        <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-line">
          <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center text-brand font-bold">
            A
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold text-ink-primary">Acme Life Insurance</div>
            <div className="text-xs text-ink-secondary">acmelife.com · Enterprise Plan</div>
          </div>
          <Badge variant="info">Admin</Badge>
        </div>
      </Section>

      <div className="flex items-center justify-between">
        {dirty && <span className="text-xs text-caution-text">You have unsaved changes</span>}
        <Button className="ml-auto" onClick={save}>Save Profile</Button>
      </div>
    </div>
  )
}

// ── Preferences Tab ────────────────────────────────────────────────────────────
function PreferencesTab() {
  const [prefs, setPrefs] = useState({
    language:           'en-US',
    compactMode:        false,
    showRiskSubScores:  true,
    autoOpenQueue:      true,
  })

  function toggle(key) {
    setPrefs((p) => ({ ...p, [key]: !p[key] }))
  }

  return (
    <div className="space-y-5">
      <Section title="Localization">
        <FormGroup label="Language">
          <select
            value={prefs.language}
            onChange={(e) => setPrefs((p) => ({ ...p, language: e.target.value }))}
            className="w-full max-w-xs h-9 px-3 text-sm bg-surface-primary border border-line rounded
                       focus:outline-none focus:border-brand text-ink-primary"
          >
            <option value="en-US">English (US)</option>
            <option value="en-GB">English (UK)</option>
            <option value="es-US">Spanish (US)</option>
          </select>
        </FormGroup>
      </Section>

      <Section title="Display" description="Adjust how information is shown across the app.">
        <div className="space-y-4">
          <Switch
            checked={prefs.compactMode}
            onCheckedChange={() => toggle('compactMode')}
            label="Compact mode"
            description="Use smaller row heights in tables and lists."
          />
          <Switch
            checked={prefs.showRiskSubScores}
            onCheckedChange={() => toggle('showRiskSubScores')}
            label="Expand risk sub-scores by default"
            description="Show AI risk breakdown automatically on submission detail pages."
          />
          <Switch
            checked={prefs.autoOpenQueue}
            onCheckedChange={() => toggle('autoOpenQueue')}
            label="Open underwriting queue on login"
            description="Navigate directly to your queue instead of the submissions list."
          />
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Preferences saved')}>Save Preferences</Button>
      </div>
    </div>
  )
}

// ── Notifications Tab ──────────────────────────────────────────────────────────
function NotificationsTab() {
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

  function toggle(key) { setPrefs((p) => ({ ...p, [key]: !p[p] })) }
  // note: corrected toggle
  function tog(key) { setPrefs((p) => ({ ...p, [key]: !p[key] })) }

  return (
    <div className="space-y-5">
      <Section title="In-App Notifications" description="Shown as bell alerts inside the platform.">
        <div className="space-y-4">
          {[
            { key: 'submissionAssigned', label: 'Submission assigned to me',  desc: 'When a new submission is routed to your queue.' },
            { key: 'decisionRequired',   label: 'Decision required',          desc: 'When a submission is waiting for your decision.' },
            { key: 'adverseActionDue',   label: 'Adverse action notice due',  desc: 'When a regulatory notice deadline is approaching.' },
            { key: 'eoiUpdates',         label: 'EOI status updates',         desc: 'When an EOI application changes status.' },
            { key: 'systemAlerts',       label: 'System alerts',              desc: 'AI connectivity issues, config errors, and similar.' },
          ].map(({ key, label, desc }) => (
            <Switch key={key} checked={prefs[key]} onCheckedChange={() => tog(key)} label={label} description={desc} />
          ))}
        </div>
      </Section>

      <Section title="Email Notifications">
        <div className="space-y-4">
          {[
            { key: 'weeklyDigest',     label: 'Weekly digest',           desc: 'Summary of submissions and decisions every Monday.' },
            { key: 'emailSummary',     label: 'Daily activity summary',  desc: 'End-of-day summary of your queue and pending actions.' },
            { key: 'slackIntegration', label: 'Slack notifications',     desc: 'Forward critical alerts to your connected Slack workspace.' },
          ].map(({ key, label, desc }) => (
            <Switch key={key} checked={prefs[key]} onCheckedChange={() => tog(key)} label={label} description={desc} />
          ))}
        </div>
      </Section>

      <div className="flex justify-end">
        <Button onClick={() => toast.success('Notification preferences saved')}>Save Notifications</Button>
      </div>
    </div>
  )
}

// ── Security Tab ───────────────────────────────────────────────────────────────
function SecurityTab() {
  const [twoFA, setTwoFA] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '', showCurrent: false, showNext: false })

  function changePassword() {
    if (!pw.current) { toast.error('Enter your current password'); return }
    if (pw.next.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (pw.next !== pw.confirm) { toast.error('Passwords do not match'); return }
    toast.success('Password updated')
    setPw({ current: '', next: '', confirm: '', showCurrent: false, showNext: false })
  }

  const strength = pw.next.length === 0 ? null
    : pw.next.length < 8 ? 'weak'
    : pw.next.length < 12 ? 'moderate'
    : 'strong'

  return (
    <div className="space-y-5">
      {/* 2FA */}
      <Section title="Two-Factor Authentication" description="Add a second layer of security to your account.">
        <div className="flex items-start justify-between gap-4">
          <div className="text-sm text-ink-secondary">
            {twoFA
              ? '2FA is active. Your account is protected with an authenticator app.'
              : 'Protect your account with an authenticator app (TOTP) or hardware security key.'
            }
            {!twoFA && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-caution-text">
                <AlertTriangle size={12} /> Strongly recommended for accounts with underwriting authority.
              </div>
            )}
          </div>
          <div className="flex-shrink-0">
            {twoFA
              ? <Badge variant="success">Enabled</Badge>
              : <Button size="sm" onClick={() => { toast.info('Authenticator app setup coming soon'); setTwoFA(true) }}>Enable 2FA</Button>
            }
          </div>
        </div>
      </Section>

      {/* Change password */}
      <Section title="Change Password">
        <div className="space-y-3 max-w-sm">
          <FormGroup label="Current Password">
            <div className="relative">
              <Input
                type={pw.showCurrent ? 'text' : 'password'}
                value={pw.current}
                onChange={(e) => setPw((p) => ({ ...p, current: e.target.value }))}
                placeholder="••••••••"
                className="pr-10"
              />
              <button
                onClick={() => setPw((p) => ({ ...p, showCurrent: !p.showCurrent }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary"
              >
                {pw.showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </FormGroup>
          <FormGroup label="New Password">
            <div className="relative">
              <Input
                type={pw.showNext ? 'text' : 'password'}
                value={pw.next}
                onChange={(e) => setPw((p) => ({ ...p, next: e.target.value }))}
                placeholder="Min. 8 characters"
                className="pr-10"
              />
              <button
                onClick={() => setPw((p) => ({ ...p, showNext: !p.showNext }))}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary"
              >
                {pw.showNext ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
            {strength && (
              <div className="mt-1.5">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className={cn('h-1 flex-1 rounded-full transition-colors',
                      strength === 'strong' ? 'bg-positive'
                      : strength === 'moderate' && i <= 2 ? 'bg-caution'
                      : strength === 'weak' && i === 1 ? 'bg-destructive'
                      : 'bg-line'
                    )} />
                  ))}
                </div>
                <span className="text-[11px] text-ink-tertiary capitalize">{strength}</span>
              </div>
            )}
          </FormGroup>
          <FormGroup label="Confirm New Password">
            <Input
              type="password"
              value={pw.confirm}
              onChange={(e) => setPw((p) => ({ ...p, confirm: e.target.value }))}
              placeholder="••••••••"
            />
            {pw.confirm && pw.next !== pw.confirm && (
              <div className="text-xs text-destructive-text mt-1">Passwords do not match</div>
            )}
          </FormGroup>
          <Button size="sm" onClick={changePassword}>Update Password</Button>
        </div>
      </Section>

      {/* Active sessions */}
      <Section title="Active Sessions" description="Devices currently signed in to your account.">
        <div className="space-y-2 mb-4">
          {SESSIONS.map((s) => (
            <div key={s.device}
              className="flex items-center justify-between gap-3 px-3 py-3
                         bg-surface-secondary rounded-lg border border-line"
            >
              <div className="flex items-center gap-3">
                <Monitor size={16} className={s.current ? 'text-brand' : 'text-ink-tertiary'} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-primary">{s.device}</span>
                    {s.current && <Badge variant="success" className="text-[10px]">This device</Badge>}
                  </div>
                  <div className="text-xs text-ink-tertiary">{s.location} · {s.lastActive}</div>
                </div>
              </div>
              {!s.current && (
                <button
                  onClick={() => toast.success(`Session revoked: ${s.device}`)}
                  className="text-xs text-destructive-text hover:underline flex-shrink-0"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm" onClick={() => toast.success('All other sessions revoked')}>
          <LogOut size={13} /> Sign out all other sessions
        </Button>
      </Section>

      {/* API tokens */}
      <Section title="Personal API Tokens" description="Tokens carry your account permissions — keep them secret.">
        <div className="text-center py-8 bg-surface-secondary rounded-lg border border-dashed border-line">
          <Key size={20} className="text-ink-tertiary mx-auto mb-2" />
          <div className="text-sm text-ink-secondary">No personal tokens yet</div>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => toast.info('Token creation coming soon')}>
            Generate Token
          </Button>
        </div>
      </Section>
    </div>
  )
}

// ── Main export ────────────────────────────────────────────────────────────────
export default function Profile() {
  const { currentUser } = useAppStore()
  const [tab, setTab] = useState('profile')

  return (
    <div className="max-w-3xl">
      {/* Avatar + name */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          <div className="w-14 h-14 rounded-full bg-brand flex items-center justify-center
                          text-white text-xl font-bold select-none">
            {currentUser.initials}
          </div>
          <button
            onClick={() => toast.info('Photo upload coming soon')}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100
                       transition-opacity flex items-center justify-center"
          >
            <Camera size={16} className="text-white" />
          </button>
        </div>
        <div>
          <h1 className="text-xl font-semibold text-ink-primary">{currentUser.name}</h1>
          <div className="text-sm text-ink-secondary">{currentUser.role} · Acme Life Insurance</div>
          <Badge variant="success" className="mt-1">Active</Badge>
        </div>
      </div>

      <TabBar tab={tab} setTab={setTab} />

      {tab === 'profile'       && <ProfileTab       currentUser={currentUser} />}
      {tab === 'preferences'   && <PreferencesTab   />}
      {tab === 'notifications' && <NotificationsTab />}
      {tab === 'security'      && <SecurityTab      />}
    </div>
  )
}
