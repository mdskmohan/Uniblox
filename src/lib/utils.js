/**
 * utils.js
 *
 * Shared utility functions used across the application.
 * All functions are pure (no side effects) and handle null/undefined inputs
 * gracefully, returning '—' or empty strings rather than crashing.
 *
 * Exports:
 *  cn(...)                   — Tailwind class merger (clsx + tailwind-merge)
 *  formatDate(str, opts)     — locale date string; supports { relative: true } for "Xd ago"
 *  formatDateTime(str)       — date + time string
 *  formatCurrency(amount)    — compact currency: $1.2M, $450K, $230
 *  formatNumber(n)           — locale number with commas
 *  getRiskLevel(score)       — 'low' | 'medium' | 'high' (0–39, 40–69, 70–100)
 *  getRiskColor(score)       — Tailwind text color class for the score level
 *  getRiskBg(score)          — Tailwind background color class for the score level
 *  getStatusBadgeClass(status) — CSS class name for status badge styling
 *  generateId(prefix)        — unique ID like 'SUB-2024-4821'
 *  truncate(str, n)          — truncate string to n chars with ellipsis
 *  daysUntil(dateStr)        — positive = future, negative = past, in whole days
 *  addDays(dateStr, n)       — ISO string n days after dateStr
 */

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}

export function formatDate(dateStr, opts = {}) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  if (opts.relative) {
    const diff = Date.now() - d.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1)  return 'just now'
    if (mins < 60) return `${mins}m ago`
    const hrs = Math.floor(mins / 60)
    if (hrs < 24)  return `${hrs}h ago`
    const days = Math.floor(hrs / 24)
    if (days < 7)  return `${days}d ago`
  }
  return d.toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    ...opts,
  })
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—'
  const d = new Date(dateStr)
  return d.toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

export function formatCurrency(amount) {
  if (amount == null) return '—'
  const n = typeof amount === 'string' ? parseFloat(amount.replace(/[^0-9.]/g, '')) : amount
  if (isNaN(n)) return amount
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}K`
  return `$${n.toLocaleString()}`
}

export function formatNumber(n) {
  if (n == null) return '—'
  return Number(n).toLocaleString()
}

export function getRiskLevel(score) {
  if (score <= 39) return 'low'
  if (score <= 69) return 'medium'
  return 'high'
}

export function getRiskColor(score) {
  const level = getRiskLevel(score)
  if (level === 'low')    return 'text-positive'
  if (level === 'medium') return 'text-caution-text'
  return 'text-destructive'
}

export function getRiskBg(score) {
  const level = getRiskLevel(score)
  if (level === 'low')    return 'bg-positive'
  if (level === 'medium') return 'bg-caution'
  return 'bg-destructive'
}

export function getStatusBadgeClass(status) {
  const map = {
    APPROVED:   'badge-approved',
    PENDING:    'badge-pending',
    DECLINED:   'badge-declined',
    REFERRED:   'badge-referred',
    PROCESSING: 'badge-processing',
    OPEN:       'badge-approved',
    CLOSED:     'badge-gray',
    'IN_REVIEW':'badge-processing',
    'PENDING_INFO': 'badge-pending',
  }
  return map[status] ?? 'badge-gray'
}

export function generateId(prefix = 'SUB') {
  const year = new Date().getFullYear()
  const num  = String(Math.floor(Math.random() * 9000) + 1000)
  return `${prefix}-${year}-${num}`
}

export function truncate(str, n = 60) {
  if (!str) return ''
  return str.length > n ? str.slice(0, n) + '…' : str
}

export function daysUntil(dateStr) {
  const ms = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(ms / 86400000)
}

export function addDays(dateStr, n) {
  const d = new Date(dateStr)
  d.setDate(d.getDate() + n)
  return d.toISOString()
}
