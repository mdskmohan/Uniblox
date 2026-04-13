import { useState } from 'react'
import { toast } from 'sonner'
import {
  Plus, Search, MoreHorizontal, Shield, Key,
  Mail, Clock, CheckCircle2, XCircle, AlertTriangle,
  Copy, Trash2, UserPlus, Lock, Unlock,
  Users, Settings, X, Edit2
} from 'lucide-react'
import { PageHeader } from '@/components/shared/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input, Textarea, FormGroup } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'

const PERMISSION_LIST = [
  { key: 'view_submissions',    label: 'View Submissions',      group: 'Submissions' },
  { key: 'create_submissions',  label: 'Create Submissions',    group: 'Submissions' },
  { key: 'make_decisions',      label: 'Make UW Decisions',     group: 'Submissions' },
  { key: 'override_ai',         label: 'Override AI Decisions', group: 'Submissions' },
  { key: 'manage_eoi',          label: 'Manage EOI',            group: 'Underwriting' },
  { key: 'manage_enrollments',  label: 'Manage Enrollments',    group: 'Enrollment' },
  { key: 'view_analytics',      label: 'View Analytics',        group: 'Analytics' },
  { key: 'manage_carriers',     label: 'Manage Carriers',       group: 'Platform' },
  { key: 'manage_compliance',   label: 'Edit Compliance Rules', group: 'Platform' },
  { key: 'manage_team',         label: 'Manage Team & Access',  group: 'Platform' },
  { key: 'view_audit',          label: 'View Audit Log',        group: 'Analytics' },
  { key: 'api_access',          label: 'API Access',            group: 'Platform' },
]

const BUILT_IN_ROLES = {
  admin:              { label: 'Admin',              color: 'purple', desc: 'Full access to all settings and data', system: true },
  senior_underwriter: { label: 'Senior Underwriter', color: 'info',   desc: 'Can approve, decline, and override AI decisions', system: true },
  underwriter:        { label: 'Underwriter',        color: 'info',   desc: 'Can review and make decisions on assigned submissions', system: true },
  compliance_officer: { label: 'Compliance Officer', color: 'warning',desc: 'Can modify compliance rules and view all audit logs', system: true },
  enrollment_coord:   { label: 'Enrollment Coord.',  color: 'gray',   desc: 'Manages active enrollments and census uploads', system: true },
  broker_relations:   { label: 'Broker Relations',   color: 'gray',   desc: 'Read-only access to submissions and enrollments', system: true },
  viewer:             { label: 'Viewer',             color: 'gray',   desc: 'Read-only access to reports and analytics', system: true },
}

const DEFAULT_PERMISSIONS = {
  admin:              ['view_submissions','create_submissions','make_decisions','override_ai','manage_eoi','manage_enrollments','view_analytics','manage_carriers','manage_compliance','manage_team','view_audit','api_access'],
  senior_underwriter: ['view_submissions','create_submissions','make_decisions','override_ai','manage_eoi','view_analytics','view_audit','api_access'],
  underwriter:        ['view_submissions','create_submissions','make_decisions','manage_eoi'],
  compliance_officer: ['view_submissions','view_analytics','manage_compliance','view_audit'],
  enrollment_coord:   ['view_submissions','manage_enrollments'],
  broker_relations:   ['view_submissions','view_analytics'],
  viewer:             ['view_submissions','view_analytics'],
}

const INITIAL_TEAM = [
  { id: 't1', name: 'John Doe',    email: 'john.doe@acmelife.com',   role: 'senior_underwriter', status: 'active',   lastActive: '2 min ago',   mfa: true  },
  { id: 't2', name: 'Sarah Chen',  email: 'sarah.chen@acmelife.com', role: 'underwriter',        status: 'active',   lastActive: '1 hour ago',  mfa: true  },
  { id: 't3', name: 'Mike Torres', email: 'm.torres@acmelife.com',   role: 'enrollment_coord',   status: 'active',   lastActive: 'Yesterday',   mfa: false },
  { id: 't4', name: 'Linda Park',  email: 'l.park@acmelife.com',     role: 'compliance_officer', status: 'active',   lastActive: '3 hours ago', mfa: true  },
  { id: 't5', name: 'David Kim',   email: 'd.kim@acmelife.com',      role: 'broker_relations',   status: 'active',   lastActive: '2 days ago',  mfa: false },
  { id: 't6', name: 'Amy Watson',  email: 'a.watson@acmelife.com',   role: 'underwriter',        status: 'inactive', lastActive: '30 days ago', mfa: false },
  { id: 't7', name: 'Ryan Patel',  email: 'r.patel@acmelife.com',    role: 'viewer',             status: 'invited',  lastActive: 'Never',       mfa: false },
]

const API_KEYS = [
  { id: 'k1', name: 'Production Integration', key: 'ubx_live_••••••••••••4a2f', created: '2024-01-01', lastUsed: '2 hours ago', scopes: ['submissions:read','decisions:write'] },
  { id: 'k2', name: 'Analytics Pipeline',     key: 'ubx_live_••••••••••••9c1e', created: '2023-11-15', lastUsed: '1 day ago',   scopes: ['analytics:read'] },
]

const TABS = [
  { id: 'members', label: 'Members',          icon: Users },
  { id: 'roles',   label: 'Roles & Permissions', icon: Shield },
  { id: 'sso',     label: 'SSO / SAML',       icon: Lock },
  { id: 'api',     label: 'API Keys',         icon: Key },
]

// ── Role Permissions Modal ─────────────────────────────────────────────────────
function RolePermissionsModal({ roleKey, role, currentPerms, onSave, onClose }) {
  const [localPerms, setLocalPerms] = useState([...currentPerms])
  const groups = [...new Set(PERMISSION_LIST.map((p) => p.group))]

  function toggle(key) {
    setLocalPerms((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key])
  }

  const allKeys = PERMISSION_LIST.map((p) => p.key)
  const allChecked = allKeys.every((k) => localPerms.includes(k))

  function toggleAll() {
    setLocalPerms(allChecked ? [] : [...allKeys])
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface-primary rounded-xl border border-line shadow-2xl w-full max-w-md
                      flex flex-col animate-fadeIn" style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-line flex-shrink-0">
          <div>
            <div className="flex items-center gap-2 mb-0.5">
              <Badge variant={role.color}>{role.label}</Badge>
              {role.system && <span className="text-[11px] text-ink-tertiary">System role</span>}
            </div>
            <div className="text-xs text-ink-secondary mt-0.5">{role.desc}</div>
          </div>
          <button onClick={onClose} className="text-ink-tertiary hover:text-ink-primary flex-shrink-0 ml-4">
            <X size={16} />
          </button>
        </div>

        {/* Select all */}
        <div className="flex items-center justify-between px-5 py-2.5 border-b border-line bg-surface-secondary flex-shrink-0">
          <span className="text-xs text-ink-secondary">
            <strong className="text-ink-primary">{localPerms.length}</strong> of {PERMISSION_LIST.length} permissions selected
          </span>
          <button onClick={toggleAll} className="text-xs text-brand hover:underline font-medium">
            {allChecked ? 'Deselect all' : 'Select all'}
          </button>
        </div>

        {/* Permission checkboxes */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {groups.map((group) => (
            <div key={group}>
              <div className="text-[11px] font-semibold text-ink-tertiary uppercase tracking-wider mb-2.5">
                {group}
              </div>
              <div className="space-y-2">
                {PERMISSION_LIST.filter((p) => p.group === group).map((p) => (
                  <label key={p.key} className="flex items-center gap-3 cursor-pointer group py-1">
                    <input
                      type="checkbox"
                      checked={localPerms.includes(p.key)}
                      onChange={() => toggle(p.key)}
                      className="accent-brand w-4 h-4 flex-shrink-0"
                    />
                    <span className="text-sm text-ink-primary group-hover:text-brand transition-colors">
                      {p.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 px-5 py-4 border-t border-line flex-shrink-0">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(roleKey, localPerms); onClose() }}>Save Changes</Button>
        </div>
      </div>
    </div>
  )
}

// ── Create Role Modal ──────────────────────────────────────────────────────────
function CreateRoleModal({ roles, onSave, onClose }) {
  const [name, setName]       = useState('')
  const [desc, setDesc]       = useState('')
  const [perms, setPerms]     = useState([])
  const [copyFrom, setCopyFrom] = useState('')

  function applyTemplate(roleKey) {
    setCopyFrom(roleKey)
    if (roleKey) setPerms([...DEFAULT_PERMISSIONS[roleKey]])
  }

  function toggle(key) {
    setPerms((p) => p.includes(key) ? p.filter((k) => k !== key) : [...p, key])
  }

  function save() {
    if (!name.trim()) { toast.error('Role name is required'); return }
    const id = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '')
    if (roles[id]) { toast.error('A role with that name already exists'); return }
    onSave({ id, label: name.trim(), desc: desc.trim(), permissions: perms, color: 'info', system: false })
    toast.success(`Role "${name.trim()}" created`)
    onClose()
  }

  const groups = [...new Set(PERMISSION_LIST.map((p) => p.group))]

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-surface-primary rounded-xl border border-line shadow-2xl w-full max-w-lg animate-fadeIn max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-5 py-4 border-b border-line sticky top-0 bg-surface-primary">
          <span className="font-semibold text-ink-primary">Create Custom Role</span>
          <button onClick={onClose} className="text-ink-tertiary hover:text-ink-primary"><X size={16} /></button>
        </div>
        <div className="p-5 space-y-4">
          <FormGroup label="Role Name *">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Junior Underwriter" />
          </FormGroup>
          <FormGroup label="Description">
            <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="What can this role do?" />
          </FormGroup>
          <FormGroup label="Copy permissions from">
            <select
              value={copyFrom}
              onChange={(e) => applyTemplate(e.target.value)}
              className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                         focus:outline-none focus:border-brand text-ink-primary"
            >
              <option value="">— Start from scratch —</option>
              {Object.entries(BUILT_IN_ROLES).map(([key, r]) => (
                <option key={key} value={key}>{r.label}</option>
              ))}
            </select>
          </FormGroup>

          <div>
            <div className="text-xs font-semibold text-ink-secondary uppercase tracking-wider mb-2">Permissions</div>
            {groups.map((group) => (
              <div key={group} className="mb-3">
                <div className="text-[10px] font-medium text-ink-tertiary uppercase tracking-wider mb-1.5">{group}</div>
                <div className="space-y-1.5">
                  {PERMISSION_LIST.filter((p) => p.group === group).map((p) => (
                    <label key={p.key} className="flex items-center gap-2.5 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={perms.includes(p.key)}
                        onChange={() => toggle(p.key)}
                        className="accent-brand w-4 h-4"
                      />
                      <span className="text-sm text-ink-primary group-hover:text-brand transition-colors">{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-2 pt-1">
            <Button variant="secondary" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button className="flex-1" onClick={save}>Create Role</Button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function TeamAccess() {
  const [tab,        setTab]        = useState('members')
  const [search,     setSearch]     = useState('')
  const [team,       setTeam]       = useState(INITIAL_TEAM)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [invite,     setInvite]     = useState({ email: '', role: 'underwriter' })
  const [menuOpen,   setMenuOpen]   = useState(null)
  const [sso,        setSso]        = useState({ enabled: false, provider: 'okta', domain: '', entityId: '', acsUrl: '' })

  // Roles state — built-in + custom
  const [roles,         setRoles]         = useState(BUILT_IN_ROLES)
  const [permissions,   setPermissions]   = useState(DEFAULT_PERMISSIONS)
  const [createOpen,    setCreateOpen]    = useState(false)
  const [roleModalOpen, setRoleModalOpen] = useState(null) // roleKey or null

  const filtered = team.filter((m) =>
    !search ||
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.email.toLowerCase().includes(search.toLowerCase())
  )

  // ── Members ──
  function handleInvite() {
    if (!invite.email.trim()) { toast.error('Enter an email address'); return }
    const newMember = {
      id: `t${Date.now()}`,
      name:       invite.email.split('@')[0].replace('.', ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
      email:      invite.email,
      role:       invite.role,
      status:     'invited',
      lastActive: 'Never',
      mfa:        false,
    }
    setTeam((t) => [...t, newMember])
    setInvite({ email: '', role: 'underwriter' })
    setInviteOpen(false)
    toast.success(`Invitation sent to ${invite.email}`)
  }

  function handleChangeRole(id, role) {
    setTeam((t) => t.map((m) => m.id === id ? { ...m, role } : m))
    toast.success('Role updated')
    setMenuOpen(null)
  }

  function handleRemove(id, name) {
    setTeam((t) => t.filter((m) => m.id !== id))
    toast.success(`${name} removed`)
    setMenuOpen(null)
  }

  // ── Roles ──
  function handleSavePermissions(roleKey, newPerms) {
    setPermissions((p) => ({ ...p, [roleKey]: newPerms }))
    toast.success(`Permissions saved for ${roles[roleKey]?.label}`)
  }

  function handleCreateRole({ id, label, desc, permissions: perms, color, system }) {
    setRoles((r) => ({ ...r, [id]: { label, desc, color, system } }))
    setPermissions((p) => ({ ...p, [id]: perms }))
  }

  function handleDeleteRole(key) {
    if (roles[key]?.system) { toast.error('System roles cannot be deleted'); return }
    if (team.some((m) => m.role === key)) { toast.error('Reassign all members before deleting this role'); return }
    setRoles((r) => { const next = { ...r }; delete next[key]; return next })
    setPermissions((p) => { const next = { ...p }; delete next[key]; return next })
    toast.success('Role deleted')
  }

  const groups = [...new Set(PERMISSION_LIST.map((p) => p.group))]

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Team & Access"
        subtitle={`${team.filter((m) => m.status === 'active').length} active members`}
        actions={
          <Button size="sm" onClick={() => setInviteOpen(true)}>
            <UserPlus size={13} /> Invite Member
          </Button>
        }
      />

      {/* Tabs */}
      <div className="flex border-b border-line mb-5 -mt-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              'flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              tab === id ? 'text-brand border-brand' : 'text-ink-secondary border-transparent hover:text-ink-primary'
            )}
          >
            <Icon size={14} /> {label}
          </button>
        ))}
      </div>

      {/* ── MEMBERS ── */}
      {tab === 'members' && (
        <>
          <div className="grid grid-cols-4 gap-3 mb-5">
            {[
              { label: 'Total Members',  value: team.length,                                                                color: 'text-ink-primary' },
              { label: 'Active',         value: team.filter((m) => m.status === 'active').length,                          color: 'text-positive-text' },
              { label: 'Pending Invite', value: team.filter((m) => m.status === 'invited').length,                         color: 'text-caution-text' },
              { label: 'MFA Enabled',    value: `${team.filter((m) => m.mfa).length}/${team.filter((m) => m.status==='active').length}`, color: 'text-brand' },
            ].map(({ label, value, color }) => (
              <div key={label} className="card px-4 py-3">
                <div className={cn('text-xl font-bold', color)}>{value}</div>
                <div className="text-xs text-ink-tertiary mt-0.5">{label}</div>
              </div>
            ))}
          </div>

          {team.filter((m) => m.status === 'active' && !m.mfa).length > 0 && (
            <div className="flex items-center gap-2 px-4 py-3 bg-caution-light border border-caution/30 rounded-lg mb-4 text-sm">
              <AlertTriangle size={14} className="text-caution flex-shrink-0" />
              <span className="text-caution-text">
                {team.filter((m) => m.status === 'active' && !m.mfa).length} active members haven't enabled MFA.
              </span>
            </div>
          )}

          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
            <input
              type="text" placeholder="Search by name or email..." value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 h-9 text-sm bg-surface-primary border border-line rounded
                         focus:outline-none focus:border-brand text-ink-primary placeholder:text-ink-tertiary"
            />
          </div>

          <div className="card overflow-x-auto">
            <table className="w-full data-table">
              <thead>
                <tr><th>Member</th><th>Role</th><th>Status</th><th>MFA</th><th>Last Active</th><th></th></tr>
              </thead>
              <tbody>
                {filtered.map((m) => {
                  const role = roles[m.role]
                  return (
                    <tr key={m.id}>
                      <td>
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-brand/15 flex items-center justify-center
                                          text-brand text-xs font-bold flex-shrink-0">
                            {m.name.split(' ').map((n) => n[0]).join('')}
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-ink-primary truncate">{m.name}</div>
                            <div className="text-xs text-ink-tertiary truncate">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td><Badge variant={role?.color || 'gray'} className="text-[11px]">{role?.label || m.role}</Badge></td>
                      <td>
                        <div className="flex items-center gap-1.5">
                          {m.status === 'active'   && <><CheckCircle2 size={13} className="text-positive" /><span className="text-xs text-positive-text">Active</span></>}
                          {m.status === 'inactive' && <><XCircle size={13} className="text-ink-tertiary" /><span className="text-xs text-ink-tertiary">Inactive</span></>}
                          {m.status === 'invited'  && <><Clock size={13} className="text-caution" /><span className="text-xs text-caution-text">Invited</span></>}
                        </div>
                      </td>
                      <td>
                        {m.status === 'active'
                          ? m.mfa
                            ? <div className="flex items-center gap-1 text-xs text-positive-text"><Lock size={12} /> Enabled</div>
                            : <div className="flex items-center gap-1 text-xs text-ink-tertiary"><Unlock size={12} /> Off</div>
                          : <span className="text-xs text-ink-tertiary">—</span>
                        }
                      </td>
                      <td className="text-xs text-ink-tertiary">{m.lastActive}</td>
                      <td>
                        <div className="relative">
                          <button
                            onClick={() => setMenuOpen(menuOpen === m.id ? null : m.id)}
                            className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary
                                       hover:bg-surface-hover hover:text-ink-primary transition-colors"
                          >
                            <MoreHorizontal size={14} />
                          </button>
                          {menuOpen === m.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(null)} />
                              <div className="absolute right-0 top-full mt-1 w-52 bg-surface-primary border border-line
                                              rounded-md shadow-modal z-20 py-1 animate-fadeIn">
                                {m.status === 'invited' && (
                                  <button onClick={() => { toast.success(`Invitation resent to ${m.email}`); setMenuOpen(null) }}
                                    className="w-full text-left px-3 py-2 text-sm text-ink-primary hover:bg-surface-hover flex items-center gap-2">
                                    <Mail size={13} className="text-ink-tertiary" /> Resend Invitation
                                  </button>
                                )}
                                <div className="px-3 py-1.5 text-[10px] font-semibold text-ink-tertiary uppercase tracking-wider">
                                  Change Role
                                </div>
                                {Object.entries(roles).map(([key, r]) => (
                                  <button key={key} onClick={() => handleChangeRole(m.id, key)}
                                    className={cn('w-full text-left px-3 py-2 text-sm hover:bg-surface-hover flex items-center gap-2',
                                      m.role === key ? 'text-brand font-medium' : 'text-ink-primary')}>
                                    {m.role === key ? <CheckCircle2 size={12} className="text-brand" /> : <div className="w-3" />}
                                    {r.label}
                                  </button>
                                ))}
                                <div className="border-t border-line mt-1 pt-1">
                                  <button onClick={() => handleRemove(m.id, m.name)}
                                    className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-surface-hover flex items-center gap-2">
                                    <Trash2 size={13} /> Remove Member
                                  </button>
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── ROLES & PERMISSIONS ── */}
      {tab === 'roles' && (
        <>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(roles).map(([key, r]) => {
              const count = (permissions[key] || []).length
              return (
                <button
                  key={key}
                  onClick={() => setRoleModalOpen(key)}
                  className="text-left p-4 rounded-xl border border-line bg-surface-primary
                             hover:border-brand hover:bg-brand-light/20 transition-all group"
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <Badge variant={r.color} className="text-[11px]">{r.label}</Badge>
                    {!r.system && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteRole(key) }}
                        className="text-ink-tertiary hover:text-destructive transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={12} />
                      </button>
                    )}
                  </div>
                  <div className="text-xs text-ink-secondary mb-3 leading-relaxed line-clamp-2">
                    {r.desc}
                  </div>
                  <div className="text-[11px] text-ink-tertiary">
                    <span className="font-semibold text-ink-primary">{count}</span>
                    {' '}of {PERMISSION_LIST.length} permissions
                  </div>
                </button>
              )
            })}

            {/* Create custom role — dashed card */}
            <button
              onClick={() => setCreateOpen(true)}
              className="p-4 rounded-xl border-2 border-dashed border-line
                         hover:border-brand hover:bg-brand-light/10 transition-all
                         flex flex-col items-center justify-center gap-2.5 min-h-[110px] group"
            >
              <div className="w-9 h-9 rounded-full border-2 border-dashed border-line
                              group-hover:border-brand flex items-center justify-center transition-colors">
                <Plus size={16} className="text-ink-tertiary group-hover:text-brand transition-colors" />
              </div>
              <span className="text-sm font-medium text-ink-tertiary group-hover:text-brand transition-colors">
                Create Custom Role
              </span>
            </button>
          </div>

          {/* Role permissions modal */}
          {roleModalOpen && roles[roleModalOpen] && (
            <RolePermissionsModal
              roleKey={roleModalOpen}
              role={roles[roleModalOpen]}
              currentPerms={permissions[roleModalOpen] || []}
              onSave={handleSavePermissions}
              onClose={() => setRoleModalOpen(null)}
            />
          )}
        </>
      )}

      {/* ── SSO ── */}
      {tab === 'sso' && (
        <div className="space-y-5 max-w-2xl">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="font-semibold text-ink-primary">SAML 2.0 / SSO</div>
                <div className="text-sm text-ink-secondary mt-0.5">Allow members to sign in with your identity provider.</div>
              </div>
              <Switch checked={sso.enabled} onCheckedChange={() => setSso((s) => ({ ...s, enabled: !s.enabled }))} />
            </div>
            {sso.enabled && (
              <div className="space-y-4 pt-4 border-t border-line">
                <div>
                  <label className="text-xs font-medium text-ink-secondary block mb-1.5">Identity Provider</label>
                  <div className="flex gap-2">
                    {['okta','azure','google','custom'].map((p) => (
                      <button key={p} onClick={() => setSso((s) => ({ ...s, provider: p }))}
                        className={cn('flex-1 py-2 text-xs font-medium rounded border transition-colors capitalize',
                          sso.provider === p ? 'bg-brand text-white border-brand' : 'border-line text-ink-secondary hover:border-brand hover:text-brand'
                        )}>
                        {p === 'azure' ? 'Azure AD' : p.charAt(0).toUpperCase() + p.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>
                {[
                  { label: 'Email Domain',  key: 'domain',   placeholder: 'acmelife.com' },
                  { label: 'Entity ID (SP)',key: 'entityId', placeholder: 'https://app.uniblox.io/saml/metadata' },
                  { label: 'ACS URL',       key: 'acsUrl',   placeholder: 'https://app.uniblox.io/saml/acs' },
                ].map(({ label, key, placeholder }) => (
                  <div key={key}>
                    <label className="text-xs font-medium text-ink-secondary block mb-1.5">{label}</label>
                    <div className="relative">
                      <input type="text" value={sso[key]} onChange={(e) => setSso((s) => ({ ...s, [key]: e.target.value }))}
                        placeholder={placeholder}
                        className="w-full h-9 px-3 pr-9 text-sm bg-surface-primary border border-line rounded
                                   focus:outline-none focus:border-brand text-ink-primary placeholder:text-ink-tertiary" />
                      {sso[key] && (
                        <button onClick={() => { navigator.clipboard.writeText(sso[key]); toast.success('Copied') }}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ink-tertiary hover:text-brand">
                          <Copy size={13} />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <div className="flex gap-2 pt-2">
                  <Button variant="secondary" size="sm" onClick={() => toast.info('Testing SSO...')}>Test Connection</Button>
                  <Button size="sm" onClick={() => toast.success('SSO configuration saved')}>Save SSO Settings</Button>
                </div>
              </div>
            )}
          </div>
          <div className="card p-5">
            <div className="font-semibold text-ink-primary mb-2">SCIM Provisioning</div>
            <div className="text-sm text-ink-secondary mb-3">Automatically provision and deprovision users from your identity provider.</div>
            <div className="flex items-center justify-between p-3 bg-surface-secondary rounded border border-line">
              <div>
                <div className="text-sm font-medium text-ink-primary">SCIM Endpoint</div>
                <div className="text-xs font-mono text-ink-tertiary">https://app.uniblox.io/scim/v2</div>
              </div>
              <Button variant="secondary" size="sm" onClick={() => toast.info('Generate SCIM bearer token')}>Generate Token</Button>
            </div>
          </div>
        </div>
      )}

      {/* ── API KEYS ── */}
      {tab === 'api' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink-secondary">API keys are scoped to specific resources and carry your account permissions.</div>
            <Button size="sm" onClick={() => toast.info('Create new API key coming soon')}><Plus size={13} /> New API Key</Button>
          </div>
          <div className="space-y-3">
            {API_KEYS.map((k) => (
              <div key={k.id} className="card p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-brand/10 flex items-center justify-center">
                      <Key size={15} className="text-brand" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-ink-primary">{k.name}</div>
                      <div className="text-xs font-mono text-ink-tertiary mt-0.5">{k.key}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { navigator.clipboard.writeText(k.key); toast.success('Key copied') }}
                      className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary hover:bg-surface-hover hover:text-ink-primary transition-colors">
                      <Copy size={13} />
                    </button>
                    <button onClick={() => toast.success(`API key "${k.name}" revoked`)}
                      className="w-7 h-7 flex items-center justify-center rounded text-ink-tertiary hover:bg-surface-hover hover:text-destructive transition-colors">
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <div className="mt-3 pt-3 border-t border-line flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs text-ink-tertiary">
                    <span>Created {k.created}</span>
                    <span>·</span>
                    <span>Last used {k.lastUsed}</span>
                  </div>
                  <div className="flex gap-1">
                    {k.scopes.map((s) => (
                      <span key={s} className="text-[10px] px-1.5 py-0.5 bg-surface-secondary border border-line rounded font-mono text-ink-secondary">{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="card p-5">
            <div className="font-semibold text-ink-primary mb-2">Webhook Endpoints</div>
            <div className="text-sm text-ink-secondary mb-3">Receive real-time events when submissions change status or decisions are made.</div>
            <div className="text-center py-6 bg-surface-secondary rounded border border-dashed border-line">
              <Settings size={20} className="text-ink-tertiary mx-auto mb-2" />
              <div className="text-sm text-ink-secondary">No webhooks configured</div>
              <Button size="sm" variant="secondary" className="mt-3" onClick={() => toast.info('Webhook setup coming soon')}>Add Webhook</Button>
            </div>
          </div>
        </div>
      )}

      {/* Invite modal */}
      {inviteOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-surface-primary rounded-xl border border-line shadow-2xl w-full max-w-md animate-fadeIn">
            <div className="flex items-center justify-between px-5 py-4 border-b border-line">
              <span className="font-semibold text-ink-primary">Invite Team Member</span>
              <button onClick={() => setInviteOpen(false)} className="text-ink-tertiary hover:text-ink-primary"><X size={16} /></button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs font-medium text-ink-secondary block mb-1.5">Work Email *</label>
                <div className="relative">
                  <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-ink-tertiary" />
                  <input type="email" value={invite.email}
                    onChange={(e) => setInvite((i) => ({ ...i, email: e.target.value }))}
                    onKeyDown={(e) => e.key === 'Enter' && handleInvite()}
                    placeholder="colleague@acmelife.com" autoFocus
                    className="w-full pl-9 pr-3 h-9 text-sm bg-surface-primary border border-line rounded
                               focus:outline-none focus:border-brand text-ink-primary placeholder:text-ink-tertiary"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-ink-secondary block mb-1.5">Role</label>
                <select value={invite.role} onChange={(e) => setInvite((i) => ({ ...i, role: e.target.value }))}
                  className="w-full h-9 px-3 text-sm bg-surface-primary border border-line rounded
                             focus:outline-none focus:border-brand text-ink-primary">
                  {Object.entries(roles).map(([key, r]) => (
                    <option key={key} value={key}>{r.label}</option>
                  ))}
                </select>
                {invite.role && <div className="text-xs text-ink-tertiary mt-1.5">{roles[invite.role]?.desc}</div>}
              </div>
              <div className="flex gap-2 pt-1">
                <Button variant="secondary" className="flex-1" onClick={() => setInviteOpen(false)}>Cancel</Button>
                <Button className="flex-1" onClick={handleInvite}>Send Invitation</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {createOpen && (
        <CreateRoleModal roles={roles} onSave={handleCreateRole} onClose={() => setCreateOpen(false)} />
      )}
    </div>
  )
}
