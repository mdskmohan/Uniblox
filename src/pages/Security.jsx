import { useState } from 'react'
import { toast } from 'sonner'
import { Eye, EyeOff, AlertTriangle, Lock, Unlock, Monitor, LogOut, Key, CheckCircle2 } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input, FormGroup } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'
import { cn } from '@/lib/utils'

const SESSIONS = [
  { device: 'MacBook Pro — Chrome', location: 'San Francisco, CA', current: true,  lastActive: 'Now' },
  { device: 'iPhone 15 — Safari',   location: 'San Francisco, CA', current: false, lastActive: '2 hours ago' },
  { device: 'Windows PC — Edge',    location: 'New York, NY',      current: false, lastActive: '3 days ago' },
]

export default function Security() {
  const { currentUser } = useAppStore()
  const [twoFA, setTwoFA] = useState(false)
  const [pw, setPw] = useState({ current: '', next: '', confirm: '', showCurrent: false, showNext: false })
  const [sessions, setSessions] = useState(SESSIONS)

  function changePassword() {
    if (!pw.current) { toast.error('Enter your current password'); return }
    if (pw.next.length < 8) { toast.error('New password must be at least 8 characters'); return }
    if (pw.next !== pw.confirm) { toast.error('Passwords do not match'); return }
    toast.success('Password updated successfully')
    setPw({ current: '', next: '', confirm: '', showCurrent: false, showNext: false })
  }

  function revokeSession(device) {
    setSessions((s) => s.filter((x) => x.device !== device))
    toast.success(`Session revoked: ${device}`)
  }

  const strength = pw.next.length === 0 ? null
    : pw.next.length < 8 ? 'weak' : pw.next.length < 12 ? 'moderate' : 'strong'

  const STRENGTH_COLOR = { weak: 'bg-destructive', moderate: 'bg-caution', strong: 'bg-positive' }
  const STRENGTH_BARS  = { weak: 1, moderate: 2, strong: 4 }

  return (
    <div className="max-w-2xl space-y-5">
      <PageHeader title="Security" subtitle="Manage your password, two-factor auth, and active sessions." />

      {/* 2FA */}
      <div className="card p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <div className="font-semibold text-ink-primary mb-1">Two-Factor Authentication</div>
            <div className="text-sm text-ink-secondary">
              {twoFA
                ? 'Your account is protected. A verification code is required every time you sign in.'
                : 'Protect your account with an authenticator app (TOTP) or hardware security key (FIDO2).'}
            </div>
            {!twoFA && (
              <div className="flex items-center gap-1.5 mt-2 text-xs text-caution-text">
                <AlertTriangle size={12} /> Strongly recommended for accounts with underwriting authority.
              </div>
            )}
          </div>
          {twoFA
            ? <Badge variant="success">Enabled</Badge>
            : <Button size="sm" onClick={() => { toast.info('Authenticator app setup — scan QR code in your auth app'); setTwoFA(true) }}>Enable 2FA</Button>
          }
        </div>
      </div>

      {/* Change password */}
      <div className="card p-5">
        <div className="font-semibold text-ink-primary mb-4">Change Password</div>
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
                    <div key={i} className={cn('h-1 flex-1 rounded-full',
                      i <= STRENGTH_BARS[strength] ? STRENGTH_COLOR[strength] : 'bg-line'
                    )} />
                  ))}
                </div>
                <span className="text-[11px] text-ink-tertiary capitalize">{strength} password</span>
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
      </div>

      {/* Active sessions */}
      <div className="card p-5">
        <div className="font-semibold text-ink-primary mb-1">Active Sessions</div>
        <div className="text-sm text-ink-secondary mb-4">
          Devices currently signed in as <strong>{currentUser.name}</strong>. Revoke any session you don't recognise.
        </div>
        <div className="space-y-2 mb-4">
          {sessions.map((s) => (
            <div key={s.device}
              className="flex items-center justify-between gap-3 px-3 py-3
                         bg-surface-secondary rounded-lg border border-line"
            >
              <div className="flex items-center gap-3">
                <Monitor size={15} className={s.current ? 'text-brand' : 'text-ink-tertiary'} />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-ink-primary">{s.device}</span>
                    {s.current && <Badge variant="success" className="text-[10px]">This device</Badge>}
                  </div>
                  <div className="text-xs text-ink-tertiary">{s.location} · Last active: {s.lastActive}</div>
                </div>
              </div>
              {!s.current && (
                <button
                  onClick={() => revokeSession(s.device)}
                  className="text-xs text-destructive-text hover:underline flex-shrink-0"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
        <Button variant="secondary" size="sm"
          onClick={() => { setSessions((s) => s.filter((x) => x.current)); toast.success('All other sessions revoked') }}>
          <LogOut size={13} /> Sign out all other devices
        </Button>
      </div>

      {/* API tokens */}
      <div className="card p-5">
        <div className="font-semibold text-ink-primary mb-1">Personal API Tokens</div>
        <div className="text-sm text-ink-secondary mb-4">
          Tokens carry your full account permissions. Store them securely — they cannot be retrieved after creation.
        </div>
        <div className="text-center py-8 bg-surface-secondary rounded-lg border border-dashed border-line">
          <Key size={20} className="text-ink-tertiary mx-auto mb-2" />
          <div className="text-sm text-ink-secondary">No personal tokens yet</div>
          <Button size="sm" variant="secondary" className="mt-3" onClick={() => toast.info('Token creation coming soon')}>
            Generate Token
          </Button>
        </div>
      </div>
    </div>
  )
}
