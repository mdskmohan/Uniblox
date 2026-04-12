import { useState } from 'react'
import { toast } from 'sonner'
import {
  User, Mail, Phone, Building2, Shield, Bell, Globe,
  Key, Smartphone, Monitor, LogOut, Eye, EyeOff,
  CheckCircle2, Clock, AlertTriangle, Camera, ChevronRight
} from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input, FormGroup } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

const TABS = [
  { id: 'profile',       label: 'Profile',       icon: User },
  { id: 'preferences',   label: 'Preferences',   icon: Globe },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'security',      label: 'Security',       icon: Shield },
]

const SESSIONS = [
  { device: 'MacBook Pro — Chrome', location: 'San Francisco, CA', current: true,  lastActive: 'Now' },
  { device: 'iPhone 15 — Safari',  location: 'San Francisco, CA', current: false, lastActive: '2 hours ago' },
  { device: 'Windows PC — Edge',   location: 'New York, NY',      current: false, lastActive: '3 days ago' },
]

export default function Profile() {
  const { currentUser } = useAppStore()
  const [tab, setTab] = useState('profile')

  const [profile, setProfile] = useState({
    name:        currentUser.name,
    email:       currentUser.email,
    phone:       '+1 (415) 555-0147',
    title:       currentUser.role,
    department:  'Underwriting',
    timezone:    'America/Los_Angeles',
    language:    'en-US',
  })

  const [notifPrefs, setNotifPrefs] = useState({
    submissionAssigned:  true,
    decisionRequired:    true,
    adverseActionDue:    true,
    eoiUpdates:          true,
    weeklyDigest:        false,
    systemAlerts:        true,
    slackIntegration:    false,
    emailSummary:        true,
  })

  const [prefs, setPrefs] = useState({
    compactMode:        false,
    showRiskSubScores:  true,
    autoOpenQueue:      true,
    defaultCarrierView: 'all',
  })

  const [security, setSecurity] = useState({
    twoFAEnabled: false,
    currentPw: '', newPw: '', confirmPw: '',
    showCurrentPw: false, showNewPw: false,
  })

  function handleSaveProfile() {
    toast.success('Profile updated successfully')
  }

  function handleSavePrefs() {
    toast.success('Preferences saved')
  }

  function handleSaveNotifs() {
    toast.success('Notification preferences saved')
  }

  function handleChangePassword() {
    if (!security.currentPw) { toast.error('Enter your current password'); return }
    if (security.newPw.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (security.newPw !== security.confirmPw) { toast.error('Passwords do not match'); return }
    toast.success('Password changed successfully')
    setSecurity((s) => ({ ...s, currentPw: '', newPw: '', confirmPw: '' }))
  }

  function handleEnable2FA() {
    toast.info('Two-factor authentication setup flow coming soon')
  }

  function handleRevokeSession(device) {
    toast.success(`Session revoked: ${device}`)
  }

  return (
    <div className="max-w-4xl">
      {/* Page header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center
                          text-white text-xl font-bold">
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

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <div className="w-48 flex-shrink-0">
          <nav className="space-y-0.5">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  'w-full flex items-center gap-2.5 px-3 py-2 rounded text-sm transition-colors text-left',
                  tab === id
                    ? 'bg-brand-light text-brand font-medium'
                    : 'text-ink-secondary hover:bg-surface-hover hover:text-ink-primary'
                )}
              >
                <Icon size={15} className="flex-shrink-0" />
                {label}
              </button>
            ))}
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 space-y-5">

          {/* ── PROFILE TAB ── */}
          {tab === 'profile' && (
            <>
              <Section title="Personal Information">
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Full Name">
                    <Input
                      value={profile.name}
                      onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
                    />
                  </FormGroup>
                  <FormGroup label="Work Email">
                    <Input
                      type="email"
                      value={profile.email}
                      onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                    />
                  </FormGroup>
                  <FormGroup label="Phone Number">
                    <Input
                      type="tel"
                      value={profile.phone}
                      onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))}
                    />
                  </FormGroup>
                  <FormGroup label="Job Title">
                    <Input
                      value={profile.title}
                      onChange={(e) => setProfile((p) => ({ ...p, title: e.target.value }))}
                    />
                  </FormGroup>
                  <FormGroup label="Department">
                    <select
                      value={profile.department}
                      onChange={(e) => setProfile((p) => ({ ...p, department: e.target.value }))}
                      className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                                 focus:outline-none focus:border-brand text-ink-primary"
                    >
                      {['Underwriting', 'Compliance', 'Enrollment', 'Analytics', 'IT', 'Management'].map((d) => (
                        <option key={d}>{d}</option>
                      ))}
                    </select>
                  </FormGroup>
                </div>
              </Section>

              <Section title="Organization">
                <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-line">
                  <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center">
                    <Building2 size={18} className="text-brand" />
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-semibold text-ink-primary">Acme Life Insurance</div>
                    <div className="text-xs text-ink-secondary">acmelife.com · Enterprise Plan</div>
                  </div>
                  <Badge variant="info">Admin</Badge>
                </div>
              </Section>

              <div className="flex justify-end">
                <Button onClick={handleSaveProfile}>Save Profile</Button>
              </div>
            </>
          )}

          {/* ── PREFERENCES TAB ── */}
          {tab === 'preferences' && (
            <>
              <Section title="Localization">
                <div className="grid grid-cols-2 gap-4">
                  <FormGroup label="Timezone">
                    <select
                      value={profile.timezone}
                      onChange={(e) => setProfile((p) => ({ ...p, timezone: e.target.value }))}
                      className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                                 focus:outline-none focus:border-brand text-ink-primary"
                    >
                      {[
                        'America/Los_Angeles', 'America/Denver', 'America/Chicago',
                        'America/New_York', 'America/Anchorage', 'Pacific/Honolulu',
                      ].map((tz) => <option key={tz}>{tz}</option>)}
                    </select>
                  </FormGroup>
                  <FormGroup label="Language">
                    <select
                      value={profile.language}
                      onChange={(e) => setProfile((p) => ({ ...p, language: e.target.value }))}
                      className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                                 focus:outline-none focus:border-brand text-ink-primary"
                    >
                      <option value="en-US">English (US)</option>
                      <option value="en-GB">English (UK)</option>
                      <option value="es-US">Spanish (US)</option>
                    </select>
                  </FormGroup>
                </div>
              </Section>

              <Section title="Display Preferences">
                <div className="space-y-4">
                  <Switch
                    checked={prefs.compactMode}
                    onCheckedChange={() => setPrefs((p) => ({ ...p, compactMode: !p.compactMode }))}
                    label="Compact mode"
                    description="Use smaller row heights in tables and lists."
                  />
                  <Switch
                    checked={prefs.showRiskSubScores}
                    onCheckedChange={() => setPrefs((p) => ({ ...p, showRiskSubScores: !p.showRiskSubScores }))}
                    label="Show risk sub-scores by default"
                    description="Expand AI risk breakdown automatically on submission detail pages."
                  />
                  <Switch
                    checked={prefs.autoOpenQueue}
                    onCheckedChange={() => setPrefs((p) => ({ ...p, autoOpenQueue: !p.autoOpenQueue }))}
                    label="Open underwriting queue on login"
                    description="Navigate directly to your queue instead of the submissions list."
                  />
                </div>
              </Section>

              <div className="flex justify-end">
                <Button onClick={handleSavePrefs}>Save Preferences</Button>
              </div>
            </>
          )}

          {/* ── NOTIFICATIONS TAB ── */}
          {tab === 'notifications' && (
            <>
              <Section title="In-App Notifications">
                <div className="space-y-4">
                  {[
                    { key: 'submissionAssigned',  label: 'Submission assigned to me',       desc: 'When a new submission is routed to your queue.' },
                    { key: 'decisionRequired',    label: 'Decision required',               desc: 'When a submission is waiting for your underwriting decision.' },
                    { key: 'adverseActionDue',    label: 'Adverse action notice due',       desc: 'When a regulatory notice deadline is approaching.' },
                    { key: 'eoiUpdates',          label: 'EOI status updates',              desc: 'When an EOI application changes status.' },
                    { key: 'systemAlerts',        label: 'System alerts',                  desc: 'Configuration errors, AI connectivity issues, and similar.' },
                  ].map(({ key, label, desc }) => (
                    <Switch
                      key={key}
                      checked={notifPrefs[key]}
                      onCheckedChange={() => setNotifPrefs((n) => ({ ...n, [key]: !n[key] }))}
                      label={label}
                      description={desc}
                    />
                  ))}
                </div>
              </Section>

              <Section title="Email Notifications">
                <div className="space-y-4">
                  {[
                    { key: 'weeklyDigest',   label: 'Weekly digest',          desc: 'Summary of submissions, decisions, and portfolio metrics every Monday.' },
                    { key: 'emailSummary',   label: 'Daily activity summary', desc: 'End-of-day summary of your queue and pending actions.' },
                    { key: 'slackIntegration', label: 'Slack notifications',  desc: 'Forward critical alerts to your connected Slack workspace.' },
                  ].map(({ key, label, desc }) => (
                    <Switch
                      key={key}
                      checked={notifPrefs[key]}
                      onCheckedChange={() => setNotifPrefs((n) => ({ ...n, [key]: !n[key] }))}
                      label={label}
                      description={desc}
                    />
                  ))}
                </div>
              </Section>

              <div className="flex justify-end">
                <Button onClick={handleSaveNotifs}>Save Notification Settings</Button>
              </div>
            </>
          )}

          {/* ── SECURITY TAB ── */}
          {tab === 'security' && (
            <>
              {/* Two-factor authentication */}
              <Section title="Two-Factor Authentication">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-sm font-medium text-ink-primary mb-1">
                      {security.twoFAEnabled ? '2FA is enabled' : '2FA is not enabled'}
                    </div>
                    <div className="text-sm text-ink-secondary">
                      Protect your account with an authenticator app (TOTP) or hardware security key.
                    </div>
                    {!security.twoFAEnabled && (
                      <div className="flex items-center gap-1.5 mt-2 text-xs text-caution-text">
                        <AlertTriangle size={12} />
                        Strongly recommended for accounts with underwriting authority.
                      </div>
                    )}
                  </div>
                  <div className="flex-shrink-0">
                    {security.twoFAEnabled
                      ? <Badge variant="success">Enabled</Badge>
                      : (
                        <Button size="sm" onClick={handleEnable2FA}>
                          Enable 2FA
                        </Button>
                      )
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
                        type={security.showCurrentPw ? 'text' : 'password'}
                        value={security.currentPw}
                        onChange={(e) => setSecurity((s) => ({ ...s, currentPw: e.target.value }))}
                        placeholder="••••••••"
                        className="pr-10"
                      />
                      <button
                        onClick={() => setSecurity((s) => ({ ...s, showCurrentPw: !s.showCurrentPw }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary"
                      >
                        {security.showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </FormGroup>
                  <FormGroup label="New Password">
                    <div className="relative">
                      <Input
                        type={security.showNewPw ? 'text' : 'password'}
                        value={security.newPw}
                        onChange={(e) => setSecurity((s) => ({ ...s, newPw: e.target.value }))}
                        placeholder="Min. 8 characters"
                        className="pr-10"
                      />
                      <button
                        onClick={() => setSecurity((s) => ({ ...s, showNewPw: !s.showNewPw }))}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-ink-primary"
                      >
                        {security.showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {/* Strength bar */}
                    {security.newPw && (
                      <div className="mt-1.5">
                        <div className="flex gap-1 mb-1">
                          {[1,2,3,4].map((i) => (
                            <div
                              key={i}
                              className={cn(
                                'h-1 flex-1 rounded-full transition-colors',
                                security.newPw.length >= i * 3
                                  ? security.newPw.length >= 12 ? 'bg-positive' : security.newPw.length >= 8 ? 'bg-caution' : 'bg-destructive'
                                  : 'bg-line'
                              )}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] text-ink-tertiary">
                          {security.newPw.length < 8 ? 'Too short' : security.newPw.length < 12 ? 'Moderate' : 'Strong'}
                        </span>
                      </div>
                    )}
                  </FormGroup>
                  <FormGroup label="Confirm New Password">
                    <Input
                      type="password"
                      value={security.confirmPw}
                      onChange={(e) => setSecurity((s) => ({ ...s, confirmPw: e.target.value }))}
                      placeholder="••••••••"
                    />
                    {security.confirmPw && security.newPw !== security.confirmPw && (
                      <div className="text-xs text-destructive-text mt-1">Passwords do not match</div>
                    )}
                  </FormGroup>
                  <Button onClick={handleChangePassword} size="sm">Update Password</Button>
                </div>
              </Section>

              {/* Active sessions */}
              <Section title="Active Sessions">
                <div className="space-y-2">
                  {SESSIONS.map((s) => (
                    <div
                      key={s.device}
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
                          onClick={() => handleRevokeSession(s.device)}
                          className="text-xs text-destructive-text hover:underline flex-shrink-0"
                        >
                          Revoke
                        </button>
                      )}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex justify-end">
                  <Button variant="secondary" size="sm" onClick={() => toast.success('All other sessions revoked')}>
                    <LogOut size={13} /> Sign out all other sessions
                  </Button>
                </div>
              </Section>

              {/* API tokens */}
              <Section title="Personal API Tokens">
                <div className="text-sm text-ink-secondary mb-3">
                  Create tokens for API access on your behalf. Tokens have the same permissions as your account.
                </div>
                <div className="text-center py-6 bg-surface-secondary rounded-lg border border-line border-dashed">
                  <Key size={20} className="text-ink-tertiary mx-auto mb-2" />
                  <div className="text-sm text-ink-secondary">No personal tokens yet</div>
                  <Button
                    size="sm"
                    variant="secondary"
                    className="mt-3"
                    onClick={() => toast.info('Token creation coming soon')}
                  >
                    Generate Token
                  </Button>
                </div>
              </Section>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function Section({ title, children }) {
  return (
    <div className="card">
      <div className="px-5 py-4 border-b border-line font-semibold text-ink-primary text-sm">{title}</div>
      <div className="p-5">{children}</div>
    </div>
  )
}
