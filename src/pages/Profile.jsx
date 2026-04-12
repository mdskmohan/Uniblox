import { useState } from 'react'
import { toast } from 'sonner'
import { Camera } from 'lucide-react'
import useAppStore from '@/store/useAppStore'
import { Button } from '@/components/ui/button'
import { Input, FormGroup } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { PageHeader } from '@/components/shared/PageHeader'

export default function Profile() {
  const { currentUser } = useAppStore()

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
    <div className="max-w-2xl space-y-5">
      {/* Avatar + name */}
      <div className="flex items-center gap-4">
        <div className="relative group">
          <div className="w-16 h-16 rounded-full bg-brand flex items-center justify-center
                          text-white text-2xl font-bold select-none">
            {currentUser.initials}
          </div>
          <button
            onClick={() => toast.info('Photo upload coming soon')}
            className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100
                       transition-opacity flex items-center justify-center"
          >
            <Camera size={18} className="text-white" />
          </button>
        </div>
        <div>
          <div className="text-xl font-semibold text-ink-primary">{currentUser.name}</div>
          <div className="text-sm text-ink-secondary mt-0.5">{currentUser.role} · Acme Life Insurance</div>
          <Badge variant="success" className="mt-1.5">Active</Badge>
        </div>
      </div>

      {/* Personal info */}
      <div className="card">
        <div className="px-5 py-4 border-b border-line">
          <div className="font-semibold text-sm text-ink-primary">Personal Information</div>
          <div className="text-xs text-ink-tertiary mt-0.5">Your name and contact details.</div>
        </div>
        <div className="p-5 grid grid-cols-2 gap-4">
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
              {['America/Los_Angeles','America/Denver','America/Chicago','America/New_York',
                'America/Anchorage','Pacific/Honolulu'].map((tz) => (
                <option key={tz}>{tz}</option>
              ))}
            </select>
          </FormGroup>
        </div>
      </div>

      {/* Organisation */}
      <div className="card">
        <div className="px-5 py-4 border-b border-line">
          <div className="font-semibold text-sm text-ink-primary">Organisation</div>
        </div>
        <div className="p-5">
          <div className="flex items-center gap-3 p-3 bg-surface-secondary rounded-lg border border-line">
            <div className="w-10 h-10 rounded-lg bg-brand/10 flex items-center justify-center font-bold text-brand">A</div>
            <div className="flex-1">
              <div className="text-sm font-semibold text-ink-primary">Acme Life Insurance</div>
              <div className="text-xs text-ink-secondary">acmelife.com · Enterprise Plan</div>
            </div>
            <Badge variant="info">Admin</Badge>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {dirty && <span className="text-xs text-caution-text">Unsaved changes</span>}
        <Button className="ml-auto" onClick={save}>Save Profile</Button>
      </div>
    </div>
  )
}
