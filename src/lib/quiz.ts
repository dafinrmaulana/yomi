import { ALL_KANA, type Kana } from './kana'
import { pickWords, type Segment } from './words'
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

type Stats = Record<string, { r: number; w: number }>
type Speed = Record<string, SpeedStat>

/** batas "cukup cepat" per huruf (ms); mengetik huruf Jepang lewat IME butuh waktu lebih lama */
export const slowMs = (direction?: Direction) => (direction === 'write' ? 4000 : 2500)

/** huruf dianggap lambat bila rata-rata beberapa jawaban terakhirnya di atas batas; pulih setelah cepat berkali-kali */
function slowness(k: Kana, speed: Speed, limit: number): number {
  const recent = speed[k.id]?.recent
  if (!recent?.length) return 0
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  return avg > limit ? avg / limit : 0
}

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

/** huruf yang jarang/belum pernah dilatih: 0 bila sudah >= 3 jawaban, makin besar makin kurang latihan */
function freshness(k: Kana, stats: Stats): number {
  const n = (stats[k.id]?.r ?? 0) + (stats[k.id]?.w ?? 0)
  return n >= 3 ? 0 : ((3 - n) / 3) * 2
}

function buildDeck(pool: Kana[], stats: Stats, speed: Speed, limit: number, last?: Kana): Kana[] {
  const extraCap = Math.max(1, Math.floor(pool.length * 0.4))
  // kurang latihan, sering salah, atau lambat dibaca -> dapat kartu tambahan; yang paling butuh didahulukan
  const need = (k: Kana) => freshness(k, stats) + (isWeak(k, stats) ? 1 : 0) + slowness(k, speed, limit)
  const extras = shuffle(pool.filter((k) => need(k) > 0))
    .sort((a, b) => need(b) - need(a))
    .slice(0, extraCap)
  // kartu diambil dari ujung belakang; huruf kurang latihan diberi bobot agar cenderung keluar lebih awal
  // supaya mereka kebagian tampil walau sesi dihentikan sebelum putaran habis
  const deck = [...pool, ...extras]
    .map((k) => ({ k, key: Math.random() + (freshness(k, stats) > 0 ? 0.6 : 0) }))
    .sort((a, b) => a.key - b.key)
    .map((x) => x.k)
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

function draw(pool: Kana[], stats: Stats, speed: Speed, limit: number, prev?: Kana): Kana {
  let deck = decks.get(pool)
  if (!deck || deck.length === 0) {
    deck = buildDeck(pool, stats, speed, limit, prev)
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

/**
 * Huruf yang baru dijawab lambat disisipkan lagi beberapa kartu ke depan di kocokan yang sedang berjalan,
 * supaya cepat muncul lagi (tidak menunggu putaran berikutnya).
 */
export function requeue(cfg: QuizConfig, k: Kana) {
  const pool = cfg.pool.some((p) => p.id === k.id) ? cfg.pool : cfg.review
  const deck = decks.get(pool)
  if (!deck || deck.length < 2) return
  if (deck.slice(-8).some((c) => c.id === k.id)) return
  const gap = 3 + Math.floor(Math.random() * 4)
  deck.splice(Math.max(0, deck.length - gap), 0, k)
}

/** porsi soal gabungan yang disusun dari kata nyata */
const WORD_SHARE = 0.85

/*
 * Soal gabungan tidak boleh sama dengan yang sudah keluar di sesi ini, kecuali memang sengaja diulang:
 * rangkaian yang dijawab salah atau lambat dimunculkan lagi beberapa soal kemudian, paling banyak MAX_RETRIES kali,
 * dan berhenti begitu dijawab benar dan cepat.
 */
const keyOf = (seq: Kana[]) => seq.map((k) => k.id).join()
const seen = new WeakMap<QuizConfig, Set<string>>()
const wordUses = new WeakMap<QuizConfig, Map<string, number>>()
const retryQueue = new WeakMap<QuizConfig, { seq: Kana[]; words?: Segment[]; due: number }[]>()
const retryTries = new WeakMap<QuizConfig, Map<string, number>>()
const MAX_RETRIES = 2
const SEEN_LIMIT = 500

export function scheduleRetry(cfg: QuizConfig, q: Question) {
  if (cfg.mode !== 'combined') return
  const key = keyOf(q.seq)
  const tries = retryTries.get(cfg) ?? new Map<string, number>()
  retryTries.set(cfg, tries)
  const n = tries.get(key) ?? 0
  if (n >= MAX_RETRIES) {
    tries.delete(key)
    return
  }
  tries.set(key, n + 1)
  const list = retryQueue.get(cfg) ?? []
  if (!list.some((r) => keyOf(r.seq) === key)) list.push({ seq: q.seq, words: q.words, due: 3 + Math.floor(Math.random() * 3) })
  retryQueue.set(cfg, list)
}

/** rangkaian dijawab benar dan cepat: hentikan pengulangannya */
export function clearRetry(cfg: QuizConfig, q: Question) {
  retryTries.get(cfg)?.delete(keyOf(q.seq))
}

/** arah tulis tanpa keyboard: jawaban disusun dari kepingan */
const wantsTiles = (cfg: QuizConfig) => cfg.direction === 'write' && cfg.input !== 'keyboard'

/** kepingan huruf Jepang: semua huruf jawaban ditambah beberapa pengecoh, diacak */
function tileBank(cfg: QuizConfig, seq: Kana[]): string[] {
  const answer = seq.map((k) => k.char)
  const readings = new Set(seq.flatMap((k) => k.romaji))
  const script = seq[0].script
  const decoys = Math.max(2, Math.ceil(seq.length / 2))
  const out: string[] = []
  const sources = [shuffle([...cfg.pool, ...cfg.review]), shuffle(ALL_KANA)]
  for (const src of sources) {
    for (const k of src) {
      if (out.length >= decoys) break
      if (k.script !== script || answer.includes(k.char) || out.includes(k.char)) continue
      if (k.romaji.some((r) => readings.has(r))) continue
      out.push(k.char)
    }
  }
  return shuffle([...answer, ...out])
}

/** rangkaian gabungan jadi soal: kepingan untuk arah tulis (kecuali pakai keyboard), ketik selain itu */
function combinedQuestion(cfg: QuizConfig, seq: Kana[], words?: Segment[]): Question {
  if (wantsTiles(cfg)) return { seq, type: 'tiles', options: tileBank(cfg, seq), words }
  return { seq, type: 'type', options: [], words }
}

export function makeQuestion(cfg: QuizConfig, stats: Stats, avoidKey?: string, speed: Speed = {}): Question {
  const limit = slowMs(cfg.direction)
  const pickOne = (): Kana => {
    const prev = lastDrawn.get(cfg)
    const k =
      cfg.review.length && Math.random() < 0.3 ? draw(cfg.review, stats, speed, limit, prev) : draw(cfg.pool, stats, speed, limit, prev)
    lastDrawn.set(cfg, k)
    return k
  }

  const len = cfg.mode === 'single' ? 1 : cfg.length

  let seq: Kana[]
  let words: Segment[] | undefined
  if (cfg.mode === 'combined') {
    // pengulangan yang disengaja: rangkaian yang tadi salah/lambat dan sudah waktunya muncul lagi
    const queue = retryQueue.get(cfg)
    if (queue?.length) {
      queue.forEach((r) => r.due--)
      const i = queue.findIndex((r) => r.due <= 0 && keyOf(r.seq) !== avoidKey)
      if (i >= 0) {
        const [r] = queue.splice(i, 1)
        return combinedQuestion(cfg, r.seq, r.words)
      }
    }

    // rangkaian baru: kebanyakan dari kata nyata (arti ditampilkan), sisanya huruf acak biasa supaya huruf
    // yang jarang ada di kata tetap terlatih. Dicoba ulang bila sama dengan yang pernah keluar di sesi ini.
    const used = seen.get(cfg) ?? new Set<string>()
    seen.set(cfg, used)
    const uses = wordUses.get(cfg) ?? new Map<string, number>()
    wordUses.set(cfg, uses)
    const make = () => {
      if (cfg.words && Math.random() < WORD_SHARE) {
        const w = pickWords([...cfg.pool, ...cfg.review], stats, len, (n) => Array.from({ length: n }, pickOne), avoidKey, uses)
        if (w) return { seq: w.seq, words: w.words }
      }
      return { seq: Array.from({ length: len }, pickOne), words: undefined }
    }
    let out = make()
    for (let attempt = 0; attempt < 10 && (used.has(keyOf(out.seq)) || keyOf(out.seq) === avoidKey); attempt++) out = make()
    if (used.size >= SEEN_LIMIT) used.clear()
    used.add(keyOf(out.seq))
    ;({ seq, words } = out)
    return combinedQuestion(cfg, seq, words)
  }

  seq = Array.from({ length: len }, pickOne)
  // satu huruf: yang persis sama dengan sebelumnya diambil ulang sekali (kocokan tetap berjalan)
  if (avoidKey && keyOf(seq) === avoidKey && cfg.pool.length > 1) {
    seq = Array.from({ length: len }, pickOne)
  }

  const write = cfg.direction === 'write'
  // arah tulis tanpa keyboard: per huruf selalu pilihan ganda
  const wantChoice =
    cfg.mode === 'single' &&
    (wantsTiles(cfg) || cfg.answer === 'choice' || (cfg.answer === 'mix' && Math.random() < 0.5))
  if (!wantChoice) return { seq, type: 'type', options: [] }

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
