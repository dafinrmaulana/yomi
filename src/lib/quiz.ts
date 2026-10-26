import { ALL_KANA, type Kana } from './kana'
import type { AnswerMode, QuizMode } from './storage'

export interface QuizConfig {
  kind: 'path' | 'free' | 'review'
  title: string
  pool: Kana[]
  /** huruf dari pelajaran sebelumnya yang disisipkan sebagai pengulangan */
  review: Kana[]
  mode: QuizMode
  length: number
  answer: AnswerMode
  /** jumlah soal; null = tanpa henti */
  total: number | null
  hearts: boolean
  nodeId?: string
}

export interface QuizResult {
  config: QuizConfig
  correct: number
  wrong: number
  xp: number
  maxCombo: number
  seconds: number
  stats: Record<string, { r: number; w: number }>
  weak: Kana[]
  failed: boolean
  stars: number
}

export interface Question {
  seq: Kana[]
  type: 'type' | 'choice'
  options: string[]
}

type Stats = Record<string, { r: number; w: number }>

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/** huruf yang sering salah muncul lebih sering */
function weightedPick(pool: Kana[], stats: Stats): Kana {
  const weights = pool.map((k) => {
    const s = stats[k.id]
    if (!s) return 2
    return 1 + (3 * (s.w + 1)) / (s.r + s.w + 2)
  })
  let roll = Math.random() * weights.reduce((a, b) => a + b, 0)
  for (let i = 0; i < pool.length; i++) {
    roll -= weights[i]
    if (roll <= 0) return pool[i]
  }
  return pool[pool.length - 1]
}

export const questionXp = (len: number) => 10 + (len - 1) * 4

export function makeQuestion(cfg: QuizConfig, stats: Stats, avoidKey?: string): Question {
  const pickOne = () =>
    cfg.review.length && Math.random() < 0.3
      ? weightedPick(cfg.review, stats)
      : weightedPick(cfg.pool, stats)

  let seq: Kana[] = []
  for (let attempt = 0; attempt < 6; attempt++) {
    const len = cfg.mode === 'single' ? 1 : cfg.length
    seq = Array.from({ length: len }, pickOne)
    // hindari huruf yang sama berurutan di dalam gabungan, dan soal yang sama dua kali
    const dup = seq.some((k, i) => i > 0 && k.id === seq[i - 1].id) && cfg.pool.length > 1
    if (!dup && seq.map((k) => k.id).join() !== avoidKey) break
  }

  const wantChoice =
    cfg.mode === 'single' && (cfg.answer === 'choice' || (cfg.answer === 'mix' && Math.random() < 0.5))
  if (!wantChoice) return { seq, type: 'type', options: [] }

  const target = seq[0]
  const taken = new Set(target.romaji)
  const options = [target.romaji[0]]
  const sources = [shuffle([...cfg.pool, ...cfg.review]), shuffle(ALL_KANA)]
  for (const src of sources) {
    for (const k of src) {
      if (options.length >= 4) break
      const r = k.romaji[0]
      if (!taken.has(r) && !options.includes(r)) options.push(r)
    }
  }
  return { seq, type: 'choice', options: shuffle(options) }
}

export const starsFor = (correct: number, wrong: number) => {
  const acc = correct / Math.max(1, correct + wrong)
  return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1
}

export const PRAISE = ['Sugoi! (hebat)', 'Subarashii! (luar biasa)', 'Yoshi! (bagus)', 'Kanpeki! (sempurna)', 'Tadashii! (benar)', 'Ii ne! (mantap)']
export const pickPraise = () => rand(PRAISE)
