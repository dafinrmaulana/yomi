import { ALL_KANA, type Kana } from './kana'
import { slowMs, type Question, type QuizConfig } from './quiz'
import type { SpeedStat } from './storage'
import { pickWords, type Segment } from './words'

type Stats = Record<string, { r: number; w: number }>
type Speed = Record<string, SpeedStat>

/** huruf dianggap lambat bila rata-rata beberapa jawaban terakhirnya di atas batas; pulih setelah cepat berkali-kali */
function slowness(k: Kana, speed: Speed, limit: number): number {
  const recent = speed[k.id]?.recent
  if (!recent?.length) return 0
  const avg = recent.reduce((a, b) => a + b, 0) / recent.length
  return avg > limit ? avg / limit : 0
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

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

/** porsi soal gabungan yang disusun dari kata nyata */
const WORD_SHARE = 0.85

const MAX_RETRIES = 2
const SEEN_LIMIT = 500

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

/** pilihan ganda untuk satu huruf: bacaan (arah baca) atau huruf Jepang (arah tulis) */
function choiceQuestion(cfg: QuizConfig, seq: Kana[]): Question {
  const target = seq[0]
  if (cfg.direction === 'write') {
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

const keyOf = (seq: Kana[]) => seq.map((k) => k.id).join()

/*
 * Soal gabungan tidak boleh sama dengan yang sudah keluar di sesi ini, kecuali memang sengaja diulang:
 * rangkaian yang dijawab salah atau lambat dimunculkan lagi beberapa soal kemudian, paling banyak MAX_RETRIES kali,
 * dan berhenti begitu dijawab benar dan cepat.
 */
type Retry = { seq: Kana[]; words?: Segment[]; due: number }

/**
 * Pembuat soal untuk satu sesi latihan. Semua keadaan yang berubah selama sesi (kocokan kartu, rangkaian yang
 * sudah keluar, antrean pengulangan, pemakaian kata) disimpan di instance ini, bukan di variabel global, dan
 * dibedakan per pengaturan (`QuizConfig`) sehingga pengaturan yang diganti di tengah sesi mulai dari kosong.
 */
export class QuestionGenerator {
  private decks = new WeakMap<Kana[], Kana[]>()
  private lastDrawn = new WeakMap<QuizConfig, Kana>()
  private seen = new WeakMap<QuizConfig, Set<string>>()
  private wordUses = new WeakMap<QuizConfig, Map<string, number>>()
  private retryQueue = new WeakMap<QuizConfig, Retry[]>()
  private retryTries = new WeakMap<QuizConfig, Map<string, number>>()

  private draw(pool: Kana[], stats: Stats, speed: Speed, limit: number, prev?: Kana): Kana {
    let deck = this.decks.get(pool)
    if (!deck || deck.length === 0) {
      deck = buildDeck(pool, stats, speed, limit, prev)
      this.decks.set(pool, deck)
    }
    // hindari huruf yang sama berturut-turut bila masih ada pilihan lain di kocokan
    if (prev && deck[deck.length - 1].id === prev.id && pool.length > 1) {
      const j = deck.findIndex((k) => k.id !== prev.id)
      if (j >= 0) [deck[j], deck[deck.length - 1]] = [deck[deck.length - 1], deck[j]]
    }
    return deck.pop()!
  }

  /**
   * Huruf yang baru dijawab lambat disisipkan lagi beberapa kartu ke depan di kocokan yang sedang berjalan,
   * supaya cepat muncul lagi (tidak menunggu putaran berikutnya).
   */
  requeue(cfg: QuizConfig, k: Kana) {
    const pool = cfg.pool.some((p) => p.id === k.id) ? cfg.pool : cfg.review
    const deck = this.decks.get(pool)
    if (!deck || deck.length < 2) return
    if (deck.slice(-8).some((c) => c.id === k.id)) return
    const gap = 3 + Math.floor(Math.random() * 4)
    deck.splice(Math.max(0, deck.length - gap), 0, k)
  }

  /** jadwalkan rangkaian yang salah/lambat untuk muncul lagi beberapa soal kemudian (hanya mode gabungan) */
  scheduleRetry(cfg: QuizConfig, q: Question) {
    if (cfg.mode !== 'combined') return
    const key = keyOf(q.seq)
    const tries = this.retryTries.get(cfg) ?? new Map<string, number>()
    this.retryTries.set(cfg, tries)
    const n = tries.get(key) ?? 0
    if (n >= MAX_RETRIES) {
      tries.delete(key)
      return
    }
    tries.set(key, n + 1)
    const list = this.retryQueue.get(cfg) ?? []
    if (!list.some((r) => keyOf(r.seq) === key)) list.push({ seq: q.seq, words: q.words, due: 3 + Math.floor(Math.random() * 3) })
    this.retryQueue.set(cfg, list)
  }

  /** rangkaian dijawab benar dan cepat: hentikan pengulangannya */
  clearRetry(cfg: QuizConfig, q: Question) {
    this.retryTries.get(cfg)?.delete(keyOf(q.seq))
  }

  /** soal berikutnya; `avoidKey` = kunci soal sebelumnya supaya tidak sama dua kali berturut-turut */
  next(cfg: QuizConfig, stats: Stats, avoidKey?: string, speed: Speed = {}): Question {
    const limit = slowMs(cfg.direction)
    const pickOne = (): Kana => {
      const prev = this.lastDrawn.get(cfg)
      const k =
        cfg.review.length && Math.random() < 0.3
          ? this.draw(cfg.review, stats, speed, limit, prev)
          : this.draw(cfg.pool, stats, speed, limit, prev)
      this.lastDrawn.set(cfg, k)
      return k
    }

    const len = cfg.mode === 'single' ? 1 : cfg.length

    if (cfg.mode === 'combined') {
      // pengulangan yang disengaja: rangkaian yang tadi salah/lambat dan sudah waktunya muncul lagi
      const queue = this.retryQueue.get(cfg)
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
      const used = this.seen.get(cfg) ?? new Set<string>()
      this.seen.set(cfg, used)
      const uses = this.wordUses.get(cfg) ?? new Map<string, number>()
      this.wordUses.set(cfg, uses)
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
      return combinedQuestion(cfg, out.seq, out.words)
    }

    let seq = Array.from({ length: len }, pickOne)
    // satu huruf: yang persis sama dengan sebelumnya diambil ulang sekali (kocokan tetap berjalan)
    if (avoidKey && keyOf(seq) === avoidKey && cfg.pool.length > 1) {
      seq = Array.from({ length: len }, pickOne)
    }

    // arah tulis tanpa keyboard: per huruf selalu pilihan ganda
    const wantChoice = wantsTiles(cfg) || cfg.answer === 'choice' || (cfg.answer === 'mix' && Math.random() < 0.5)
    return wantChoice ? choiceQuestion(cfg, seq) : { seq, type: 'type', options: [] }
  }
}
