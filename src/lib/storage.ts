import { useCallback, useEffect, useState } from 'react'
import { GROUPS } from './kana'

export type QuizMode = 'single' | 'combined'
export type AnswerMode = 'type' | 'choice' | 'mix'
/** read: huruf Jepang → romaji, write: romaji → huruf Jepang */
export type Direction = 'read' | 'write'
/** cara menjawab arah tulis: susun dari kepingan huruf (default) atau ketik dengan keyboard Jepang */
export type WriteInput = 'tiles' | 'keyboard'

export interface FreeSettings {
  selected: string[]
  mode: QuizMode
  length: number
  answer: AnswerMode
  /** kosong pada data lama = 'read' */
  direction?: Direction
  /** hanya arah tulis; kosong = 'tiles' */
  input?: WriteInput
}

export interface DayStat {
  xp: number
  ok: number
  bad: number
}

/** kartu ulangan berjarak (Leitner sederhana) per huruf */
export interface SrsCard {
  box: number
  due: string
}

/** waktu menjawab benar per huruf: total untuk rata-rata, recent = beberapa jawaban terakhir (ms) */
export interface SpeedStat {
  n: number
  ms: number
  recent?: number[]
}

export const SPEED_WINDOW = 3

/** satu titik riwayat sebuah huruf: hasilnya dalam satu sesi latihan */
export interface SessionPoint {
  at: number
  r: number
  w: number
  /** rata-rata ms menjawab benar di sesi itu; kosong bila tidak ada jawaban benar */
  ms?: number
}

/** riwayat sesi yang disimpan per huruf */
export const HISTORY_LIMIT = 30

export interface Progress {
  xp: number
  dayStreak: number
  bestStreak: number
  bestCombo: number
  reviewSessions: number
  days: Record<string, DayStat>
  srs: Record<string, SrsCard>
  /** kode heksadesimal huruf yang sudah ditulis dengan benar di Latihan Menulis */
  written: string[]
  lastDay: string
  todayDate: string
  todayXp: number
  completed: Record<string, number>
  stats: Record<string, { r: number; w: number }>
  /** total waktu (ms) dan jumlah jawaban benar yang diukur, per huruf */
  speed: Record<string, SpeedStat>
  history: Record<string, SessionPoint[]>
  totalCorrect: number
  totalWrong: number
  mute: boolean
  free: FreeSettings
}

export const DAILY_GOAL = 50
const KEY = 'yomi:v1'

export const dayKey = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

/** jarak ulangan (hari) menurut kotak: 0 = hari ini */
/** XP untuk menulis satu huruf dengan benar (sekali per huruf) */
export const WRITE_XP = 5

export const SRS_DAYS = [0, 1, 3, 7, 14, 30]

export const addDays = (key: string, n: number) => {
  const [y, m, d] = key.split('-').map(Number)
  return dayKey(new Date(y, m - 1, d + n))
}

const yesterdayKey = () => {
  const d = new Date()
  d.setDate(d.getDate() - 1)
  return dayKey(d)
}

const defaults = (): Progress => ({
  xp: 0,
  dayStreak: 0,
  bestStreak: 0,
  bestCombo: 0,
  reviewSessions: 0,
  days: {},
  srs: {},
  written: [],
  lastDay: '',
  todayDate: dayKey(),
  todayXp: 0,
  completed: {},
  stats: {},
  speed: {},
  history: {},
  totalCorrect: 0,
  totalWrong: 0,
  mute: false,
  free: {
    selected: GROUPS.hiragana[0].kana.map((k) => k.id),
    mode: 'single',
    length: 3,
    answer: 'type',
    direction: 'read',
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
  kind: 'path' | 'free' | 'review'
  maxCombo: number
  xp: number
  correct: number
  wrong: number
  stats: Record<string, { r: number; w: number }>
  speed?: Record<string, SpeedStat>
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
      next.bestStreak = Math.max(next.bestStreak, next.dayStreak)
      next.bestCombo = Math.max(next.bestCombo, res.maxCombo)
      if (res.kind === 'review' && res.correct + res.wrong > 0) next.reviewSessions += 1
      const day = next.days[today] ?? { xp: 0, ok: 0, bad: 0 }
      next.days = { ...next.days, [today]: { xp: day.xp + res.xp, ok: day.ok + res.correct, bad: day.bad + res.wrong } }
      next.srs = { ...next.srs }
      for (const [id, st] of Object.entries(res.stats)) {
        const card = next.srs[id] ?? { box: 0, due: today }
        if (st.w > 0) next.srs[id] = { box: 0, due: today }
        else if (st.r > 0) {
          const box = Math.min(card.box + 1, SRS_DAYS.length - 1)
          next.srs[id] = { box, due: addDays(today, SRS_DAYS[box]) }
        }
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
      next.speed = { ...next.speed }
      for (const [id, s] of Object.entries(res.speed ?? {})) {
        const old = next.speed[id] ?? { n: 0, ms: 0 }
        next.speed[id] = {
          n: old.n + s.n,
          ms: old.ms + s.ms,
          recent: [...(old.recent ?? []), ...(s.recent ?? [])].slice(-SPEED_WINDOW),
        }
      }
      next.history = { ...next.history }
      for (const [id, s] of Object.entries(res.stats)) {
        if (s.r + s.w === 0) continue
        const sp = res.speed?.[id]
        const point: SessionPoint = { at: Date.now(), r: s.r, w: s.w, ms: sp?.n ? sp.ms / sp.n : undefined }
        next.history[id] = [...(next.history[id] ?? []), point].slice(-HISTORY_LIMIT)
      }
      if (res.completedNode) {
        const { id, stars } = res.completedNode
        next.completed = { ...next.completed, [id]: Math.max(stars, next.completed[id] ?? 0) }
      }
      return next
    })
  }, [])

  const reset = useCallback(() => setProgress(defaults()), [])

  const markWritten = useCallback((code: string) => {
    setProgress((cur) => {
      if (cur.written.includes(code)) return cur
      const today = dayKey()
      const day = cur.days[today] ?? { xp: 0, ok: 0, bad: 0 }
      const next: Progress = {
        ...cur,
        written: [...cur.written, code],
        xp: cur.xp + WRITE_XP,
        todayDate: today,
        todayXp: (cur.todayDate === today ? cur.todayXp : 0) + WRITE_XP,
        days: { ...cur.days, [today]: { ...day, xp: day.xp + WRITE_XP } },
      }
      if (cur.lastDay !== today) {
        next.dayStreak = cur.lastDay === yesterdayKey() ? cur.dayStreak + 1 : 1
        next.lastDay = today
        next.bestStreak = Math.max(next.bestStreak, next.dayStreak)
      }
      return next
    })
  }, [])

  /** streak yang masih berlaku (hangus jika kemarin terlewat) */
  const liveStreak =
    progress.lastDay === dayKey() || progress.lastDay === yesterdayKey() ? progress.dayStreak : 0
  const todayXp = progress.todayDate === dayKey() ? progress.todayXp : 0

  return { progress, patch, record, reset, markWritten, liveStreak, todayXp }
}
