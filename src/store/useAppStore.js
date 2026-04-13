/**
 * useAppStore.js
 *
 * Global Zustand store — the single source of truth for all application state.
 * Every page and component reads from (and writes to) this store, so changes
 * propagate reactively without prop-drilling.
 *
 * STATE SHAPE:
 * ┌─────────────────────────────────────────────────────────────────┐
 * │ UI             sidebarCollapsed, theme                          │
 * │ Auth           currentUser { name, initials, role, email }      │
 * │                apiKey (Claude API key — memory only, not stored) │
 * │ Carrier        activeCarrierId, carriers[]                       │
 * │ Data           submissions[], eois[], enrollments[], auditLog[]  │
 * │                stateRules{}, notifications[]                     │
 * └─────────────────────────────────────────────────────────────────┘
 *
 * ACTIONS (mutations):
 *  UI         — setTheme, toggleTheme, toggleSidebar
 *  API Key    — setApiKey
 *  Carriers   — setActiveCarrier, updateCarrier
 *  Submissions — addSubmission, updateSubmission, addMessageToSubmission
 *  EOIs        — updateEOI
 *  Audit       — addAuditEntry
 *  Notifications — markNotificationRead, markAllNotificationsRead
 *
 * COMPUTED GETTERS (derived values, not persisted):
 *  getActiveCarrier()            — full carrier object for activeCarrierId
 *  getSubmission(id)             — single submission by id
 *  getPendingCount()             — count of PENDING submissions
 *  getQueueCount()               — PENDING + PROCESSING + REFERRED
 *  getUnreadNotificationCount()  — unread notification badge count
 *  isColdStart()                 — true if active carrier has < 50 submissions (AI calibration warning)
 *
 * Theme persistence:
 *  Theme changes directly mutate `document.documentElement.classList` (adds/removes
 *  'dark') so Tailwind dark-mode utility classes activate immediately. No localStorage
 *  persistence is implemented yet — theme resets on refresh.
 *
 * Sample data:
 *  All arrays are seeded from sampleData.js for demo purposes. In production,
 *  these would be replaced with API calls on mount (e.g., via React Query).
 */

import { create } from 'zustand'
import { carriers, submissions, eois, enrollments, auditLog, stateRules } from './sampleData'

const useAppStore = create((set, get) => ({
  // ─── UI ──────────────────────────────────────────────────────
  sidebarCollapsed: false,
  theme: 'light',

  // ─── Auth / user ─────────────────────────────────────────────
  currentUser: {
    name: 'John Doe',
    initials: 'JD',
    role: 'Senior Underwriter',
    email: 'john.doe@acmelife.com',
  },
  apiKey: null,

  // ─── Carrier context ─────────────────────────────────────────
  activeCarrierId: 'carrier_001',

  // ─── Data ────────────────────────────────────────────────────
  carriers,
  submissions,
  eois,
  enrollments,
  auditLog,
  stateRules,
  notifications: [
    { id: 'n1', type: 'warning', title: 'Adverse Action Due', message: 'SUB-2024-001: 2 days remaining to send notice.', read: false, timestamp: new Date().toISOString() },
    { id: 'n2', type: 'info',    title: 'New Submission',     message: 'Blue Ridge Hospitality submitted via broker portal.', read: false, timestamp: new Date().toISOString() },
    { id: 'n3', type: 'success', title: 'EOI Approved',       message: 'EOI-2024-003 approved for Northeast Hospital Group.', read: true,  timestamp: new Date().toISOString() },
    { id: 'n4', type: 'info',    title: 'Queue Update',       message: 'SUB-2024-011 assigned to your queue.', read: false, timestamp: new Date().toISOString() },
    { id: 'n5', type: 'warning', title: 'Low Confidence',     message: 'SUB-2024-005 routed to human review (58% confidence).', read: true, timestamp: new Date().toISOString() },
  ],

  // ─── UI actions ──────────────────────────────────────────────
  setTheme: (theme) => {
    set({ theme })
    if (theme === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  },
  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(next)
  },
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  setApiKey: (key) => set({ apiKey: key }),

  // ─── Carrier actions ─────────────────────────────────────────
  setActiveCarrier: (id) => set({ activeCarrierId: id }),
  addCarrier: (carrier) =>
    set((s) => ({ carriers: [...s.carriers, carrier] })),
  updateCarrier: (id, updates) =>
    set((s) => ({
      carriers: s.carriers.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),

  // ─── Submission actions ───────────────────────────────────────
  addSubmission: (sub) =>
    set((s) => ({ submissions: [sub, ...s.submissions] })),
  updateSubmission: (id, updates) =>
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.id === id ? { ...sub, ...updates } : sub
      ),
    })),
  addMessageToSubmission: (subId, message) =>
    set((s) => ({
      submissions: s.submissions.map((sub) =>
        sub.id === subId
          ? { ...sub, messages: [...(sub.messages || []), message] }
          : sub
      ),
    })),

  // ─── EOI actions ─────────────────────────────────────────────
  updateEOI: (id, updates) =>
    set((s) => ({
      eois: s.eois.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),

  // ─── Audit log ───────────────────────────────────────────────
  addAuditEntry: (entry) =>
    set((s) => ({ auditLog: [entry, ...s.auditLog] })),

  // ─── Notifications ────────────────────────────────────────────
  markNotificationRead: (id) =>
    set((s) => ({
      notifications: s.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllNotificationsRead: () =>
    set((s) => ({
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    })),

  // ─── Computed getters ─────────────────────────────────────────
  getActiveCarrier: () =>
    get().carriers.find((c) => c.id === get().activeCarrierId),

  getSubmission: (id) =>
    get().submissions.find((s) => s.id === id),

  getPendingCount: () =>
    get().submissions.filter((s) => s.status === 'PENDING').length,

  getQueueCount: () =>
    get().submissions.filter((s) =>
      ['PENDING', 'PROCESSING', 'REFERRED'].includes(s.status)
    ).length,

  getUnreadNotificationCount: () =>
    get().notifications.filter((n) => !n.read).length,

  isColdStart: () => {
    const carrier = get().getActiveCarrier()
    return carrier ? carrier.submissionCount < 50 : false
  },
}))

export default useAppStore
