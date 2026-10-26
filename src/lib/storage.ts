import { useCallback, useEffect, useState } from 'react'
import { GROUPS } from './kana'

export type QuizMode = 'single' | 'combined'
export type AnswerMode = 'type' | 'choice' | 'mix'

export interface FreeSettings {
  selected: string[]
  mode: QuizMode
  length: number
  answer: AnswerMode
}

export interface Progress {
  xp: number
  dayStreak: number
  lastDay: string
  todayDate: string
  todayXp: number
  completed: Record<string, number>
  stats: Record<string, { r: number; w: number }>
  totalCorrect: number
  totalWrong: number
  mute: boolean
  free: FreeSettings
}

export const DAILY_GOAL = 50
const KEY = 'yomi:v1'

const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

const yesterdayKey = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayKey(d)
}

const defaults = (): Progress => ({
  xp: 0,
  dayStreak: 0,
  lastDay: '',
  todayDate: dayKey(),
  todayXp: 0,
  completed: {},
  stats: {},
  totalCorrect: 0,
  totalWrong: 0,
  mute: false,
  free: {
    selected: GROUPS.hiragana[0].kana.map((k) => k.id),
    mode: 'single',
    length: 3,
    answer: 'type',
  },
})

function load(): Progress {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return { ...defaults(), ...JSON.parse(raw) }
  } catch {
    /* abaikan data rusak / storage tidak tersedia */
  }
  return defaults()
}

export interface SessionResult {
  xp: number
  correct: number
  wrong: number
  stats: Record<string, { r: number; w: number }>
  completedNode?: { id: string; stars: number }
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(load)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(progress))
    } catch {
      /* abaikan */
    }
  }, [progress])

  const patch = useCallback((p: Partial<Progress>) => setProgress((cur) => ({ ...cur, ...p })), [])

  const record = useCallback((res: SessionResult) => {
    setProgress((cur) => {
      const today = dayKey()
      const next: Progress = { ...cur }
      if (next.todayDate !== today) {
        next.todayDate = today
        next.todayXp = 0
      }
      if (res.correct > 0 && next.lastDay !== today) {
        next.dayStreak = next.lastDay === yesterdayKey() ? next.dayStreak + 1 : 1
        next.lastDay = today
      }
      next.xp += res.xp
      next.todayXp += res.xp
      next.totalCorrect += res.correct
      next.totalWrong += res.wrong
      next.stats = { ...next.stats }
      for (const [id, s] of Object.entries(res.stats)) {
        const old = next.stats[id] ?? { r: 0, w: 0 }
        next.stats[id] = { r: old.r + s.r, w: old.w + s.w }
      }
      if (res.completedNode) {
        const { id, stars } = res.completedNode
        next.completed = { ...next.completed, [id]: Math.max(stars, next.completed[id] ?? 0) }
      }
      return next
    })
  }, [])

  const reset = useCallback(() => setProgress(defaults()), [])

  /** streak yang masih berlaku (hangus jika kemarin terlewat) */
  const liveStreak =
    progress.lastDay === dayKey() || progress.lastDay === yesterdayKey() ? progress.dayStreak : 0
  const todayXp = progress.todayDate === dayKey() ? progress.todayXp : 0

  return { progress, patch, record, reset, liveStreak, todayXp }
}
