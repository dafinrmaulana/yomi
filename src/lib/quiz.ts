import { ALL_KANA, type Kana } from './kana'
import type { AnswerMode, Direction, QuizMode } from './storage'

export interface QuizConfig {
  kind: 'path' | 'free' | 'review'
  title: string
  pool: Kana[]
  /** huruf dari pelajaran sebelumnya yang disisipkan sebagai pengulangan */
  review: Kana[]
  mode: QuizMode
  length: number
  answer: AnswerMode
  /** arah soal; default 'read' */
  direction?: Direction
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
  /** draw = jawab dengan menulis huruf Jepang di kanvas */
  type: 'type' | 'choice' | 'draw'
  /** romaji (arah baca) atau huruf Jepang (arah tulis) */
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

/**
 * Kocokan kartu per kuis: setiap huruf di pool keluar sekali per putaran sebelum ada yang terulang,
 * sehingga sebaran merata. Huruf yang sering salah mendapat satu kartu tambahan per putaran.
 */
const decks = new WeakMap<Kana[], Kana[]>()

function isWeak(k: Kana, stats: Stats): boolean {
  const s = stats[k.id]
  if (!s || s.w === 0) return false
  return s.w / (s.r + s.w) >= 0.3
}

function buildDeck(pool: Kana[], stats: Stats, last?: Kana): Kana[] {
  const extraCap = Math.max(1, Math.floor(pool.length * 0.3))
  const extras = shuffle(pool.filter((k) => isWeak(k, stats))).slice(0, extraCap)
  const deck = shuffle([...pool, ...extras])
  // kartu tambahan jangan bersebelahan dengan kartu aslinya
  for (let i = 1; i < deck.length; i++) {
    if (deck[i].id !== deck[i - 1].id) continue
    const j = deck.findIndex((k, idx) => idx > i && k.id !== deck[i].id && deck[idx - 1]?.id !== deck[i].id)
    if (j > 0) {
      ;[deck[i], deck[j]] = [deck[j], deck[i]]
    }
  }
  // awal putaran baru jangan sama dengan kartu terakhir putaran sebelumnya
  if (last && pool.length > 1 && deck[0].id === last.id) {
    const j = deck.findIndex((k) => k.id !== last.id)
    if (j > 0) [deck[0], deck[j]] = [deck[j], deck[0]]
  }
  return deck
}

function draw(pool: Kana[], stats: Stats, prev?: Kana): Kana {
  let deck = decks.get(pool)
  if (!deck || deck.length === 0) {
    deck = buildDeck(pool, stats, prev)
    decks.set(pool, deck)
  }
  // hindari huruf yang sama berturut-turut bila masih ada pilihan lain di kocokan
  if (prev && deck[deck.length - 1].id === prev.id && pool.length > 1) {
    const j = deck.findIndex((k) => k.id !== prev.id)
    if (j >= 0) [deck[j], deck[deck.length - 1]] = [deck[deck.length - 1], deck[j]]
  }
  return deck.pop()!
}

const lastDrawn = new WeakMap<QuizConfig, Kana>()

export const questionXp = (len: number) => 10 + (len - 1) * 4

export function makeQuestion(cfg: QuizConfig, stats: Stats, avoidKey?: string): Question {
  const pickOne = (): Kana => {
    const prev = lastDrawn.get(cfg)
    const k =
      cfg.review.length && Math.random() < 0.3 ? draw(cfg.review, stats, prev) : draw(cfg.pool, stats, prev)
    lastDrawn.set(cfg, k)
    return k
  }

  const len = cfg.mode === 'single' ? 1 : cfg.length
  let seq: Kana[] = Array.from({ length: len }, pickOne)
  // soal yang persis sama dengan sebelumnya: ambil ulang sekali (kocokan tetap berjalan)
  if (avoidKey && seq.map((k) => k.id).join() === avoidKey && cfg.pool.length > 1) {
    seq = Array.from({ length: len }, pickOne)
  }

  const write = cfg.direction === 'write'
  const wantChoice =
    cfg.mode === 'single' && (cfg.answer === 'choice' || (cfg.answer === 'mix' && Math.random() < 0.5))
  if (!wantChoice) return { seq, type: write ? 'draw' : 'type', options: [] }

  const target = seq[0]
  if (write) {
    // pilihan huruf Jepang: skrip sama, panjang sama, dan bacaannya tidak boleh bentrok dengan jawaban
    const clash = (k: Kana) => k.romaji.some((r) => target.romaji.includes(r))
    const options = [target.char]
    const fits = (k: Kana) => k.script === target.script && k.char.length === target.char.length
    const sources = [shuffle([...cfg.pool, ...cfg.review]).filter(fits), shuffle(ALL_KANA.filter(fits))]
    for (const src of sources) {
      for (const k of src) {
        if (options.length >= 4) break
        if (!clash(k) && !options.includes(k.char)) options.push(k.char)
      }
    }
    return { seq, type: 'choice', options: shuffle(options) }
  }

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

/** jawaban pilihan ganda benar? */
export function isChoiceAnswer(q: Question, opt: string, direction: Direction = 'read'): boolean {
  return direction === 'write' ? q.seq[0].char === opt : q.seq[0].romaji.includes(opt)
}

/**
 * Romaji yang ditampilkan sebagai soal arah tulis. Bila bacaan utama dipakai huruf lain di skrip
 * yang sama (じ/ぢ = ji, ず/づ = zu), pakai ejaan alternatif supaya soal tidak ambigu (ぢ = di).
 */
export function promptRomaji(k: Kana): string {
  // huruf yang lebih dulu di daftar (じ, ず) tetap memakai bacaan utamanya
  const before = ALL_KANA.slice(0, ALL_KANA.indexOf(k))
  const taken = (r: string) => before.some((o) => o.script === k.script && o.romaji[0] === r)
  if (!taken(k.romaji[0])) return k.romaji[0]
  return k.romaji.find((r) => !taken(r)) ?? k.romaji[0]
}

export const starsFor = (correct: number, wrong: number) => {
  const acc = correct / Math.max(1, correct + wrong)
  return acc >= 0.9 ? 3 : acc >= 0.7 ? 2 : 1
}

export const PRAISE = ['Sugoi! (hebat)', 'Subarashii! (luar biasa)', 'Yoshi! (bagus)', 'Kanpeki! (sempurna)', 'Tadashii! (benar)', 'Ii ne! (mantap)']
export const pickPraise = () => rand(PRAISE)
