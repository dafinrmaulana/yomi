import { ALL_KANA, type Kana } from './kana'
import type { Mangekyo } from './eye'
import { SLOW_MS_READ, SLOW_MS_WRITE } from './tuning'
import type { Segment } from './words'
import type { AnswerMode, Direction, QuizMode, SpeedStat, WriteInput } from './storage'

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
  /** arah tulis: kepingan huruf (default) atau keyboard */
  input?: WriteInput
  /** jumlah soal; null = tanpa henti */
  total: number | null
  hearts: boolean
  /** rangkaian disusun dari kata nyata bila pool memungkinkan */
  words?: boolean
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
  speed: Record<string, SpeedStat>
  /** rata-rata detik menjawab benar dalam sesi, null jika tidak ada */
  avgSeconds: number | null
  weak: Kana[]
  failed: boolean
  stars: number
  /** Mangekyō yang tampil di game ini, supaya halaman hasil memakai yang sama */
  mangekyo: Mangekyo
}

export interface Question {
  seq: Kana[]
  /** type = ketik jawaban (romaji untuk arah baca, huruf Jepang untuk arah tulis); tiles = susun dari kepingan (options) */
  type: 'type' | 'choice' | 'tiles'
  /** romaji (arah baca) atau huruf Jepang (arah tulis); untuk tiles: seluruh kepingan yang tersedia */
  options: string[]
  /** pembagian rangkaian jadi kata beserta artinya (hanya mode kata nyata) */
  words?: Segment[]
}

/** batas "cukup cepat" per huruf (ms); mengetik huruf Jepang lewat IME butuh waktu lebih lama */
export const slowMs = (direction?: Direction) => (direction === 'write' ? SLOW_MS_WRITE : SLOW_MS_READ)

const rand = <T,>(arr: T[]) => arr[Math.floor(Math.random() * arr.length)]

export const questionXp = (len: number) => 10 + (len - 1) * 4

/** rapikan ketikan huruf Jepang: buang spasi (termasuk spasi lebar) */
const normalizeKana = (s: string) => s.normalize('NFC').replace(/[\s\u3000]/g, '')

/** arah tulis: ketikan sama persis dengan huruf soal? prefix = jumlah huruf benar dari depan */
export function checkKana(input: string, seq: Kana[]): { ok: boolean; prefix: number } {
  const text = normalizeKana(input)
  let pos = 0
  let prefix = 0
  for (const k of seq) {
    if (!text.startsWith(k.char, pos)) break
    pos += k.char.length
    prefix++
  }
  return { ok: prefix === seq.length && pos === text.length, prefix }
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
