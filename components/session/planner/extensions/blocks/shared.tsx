'use client'

import { ReactNode } from 'react'
import { Badge } from '@/components/ui/badge'

// Block status types
export type BlockStatus = 'pending' | 'active' | 'completed' | 'skipped'

// Note types for InfoBlock
export type NoteType = 'note' | 'warning' | 'secret' | 'lore' | 'reminder'

// Difficulty levels for encounters
export type Difficulty = 'trivial' | 'easy' | 'medium' | 'hard' | 'deadly'

// Status styling
export const STATUS_STYLES: Record<BlockStatus, string> = {
  pending: 'border-slate-700 bg-slate-900/50',
  active: 'border-teal-500 bg-teal-950/30 ring-1 ring-teal-500/50',
  completed: 'border-green-700 bg-green-950/20 opacity-75',
  skipped: 'border-slate-700 bg-slate-900/50 opacity-50',
}

export const STATUS_BADGES: Record<BlockStatus, ReactNode> = {
  pending: null,
  active: <Badge className="bg-teal-600 text-xs">Active</Badge>,
  completed: <Badge className="bg-green-700 text-xs">Complete</Badge>,
  skipped: <Badge variant="outline" className="border-slate-600 text-slate-500 text-xs">Skipped</Badge>,
}

// Note type configuration
export const NOTE_TYPE_CONFIG: Record<NoteType, {
  label: string
  color: string
  bgColor: string
  borderColor: string
}> = {
  note: {
    label: 'Note',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/30',
    borderColor: 'border-blue-700/50',
  },
  warning: {
    label: 'Warning',
    color: 'text-amber-400',
    bgColor: 'bg-amber-900/30',
    borderColor: 'border-amber-700/50',
  },
  secret: {
    label: 'Secret',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/30',
    borderColor: 'border-purple-700/50',
  },
  lore: {
    label: 'Lore',
    color: 'text-emerald-400',
    bgColor: 'bg-emerald-900/30',
    borderColor: 'border-emerald-700/50',
  },
  reminder: {
    label: 'Reminder',
    color: 'text-yellow-400',
    bgColor: 'bg-yellow-900/30',
    borderColor: 'border-yellow-700/50',
  },
}

// Difficulty configuration
export const DIFFICULTY_CONFIG: Record<Difficulty, {
  label: string
  color: string
}> = {
  trivial: { label: 'Trivial', color: 'bg-slate-700 text-slate-300' },
  easy: { label: 'Easy', color: 'bg-green-900 text-green-300' },
  medium: { label: 'Medium', color: 'bg-amber-900 text-amber-300' },
  hard: { label: 'Hard', color: 'bg-orange-900 text-orange-300' },
  deadly: { label: 'Deadly', color: 'bg-red-900 text-red-300' },
}

// Block type configuration
export const BLOCK_TYPE_CONFIG = {
  scene: {
    label: 'Scene',
    color: 'text-blue-400',
    bgColor: 'bg-blue-900/50',
  },
  encounter: {
    label: 'Encounter',
    color: 'text-orange-400',
    bgColor: 'bg-orange-900/50',
  },
  quest: {
    label: 'Quest',
    color: 'text-purple-400',
    bgColor: 'bg-purple-900/50',
  },
  note: {
    label: 'Note',
    color: 'text-slate-400',
    bgColor: 'bg-slate-800/50',
  },
}

// Helper to generate unique IDs
export function generateBlockId(): string {
  return crypto.randomUUID()
}

// Helper to parse JSON attrs safely
export function parseJsonAttr<T>(value: string | T, fallback: T): T {
  if (typeof value === 'string') {
    try {
      return JSON.parse(value) as T
    } catch {
      return fallback
    }
  }
  return value ?? fallback
}

// Helper to stringify JSON attrs
export function stringifyJsonAttr<T>(value: T): string {
  return JSON.stringify(value)
}
