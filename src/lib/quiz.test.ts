import { beforeEach, describe, expect, it } from 'vitest'
import { ALL_KANA, GROUPS, SPECIAL_KANA, type Kana } from './kana'
import { QuestionGenerator } from './generator'
import { checkKana, isChoiceAnswer, promptRomaji, starsFor, type QuizConfig } from './quiz'
import { matchesSequence, romajiAt } from './romaji'

const byChar = (chars: string): Kana[] => [...chars].map((c) => ALL_KANA.find((k) => k.char === c)!)

const config = (over: Partial<QuizConfig> = {}): QuizConfig => ({
  kind: 'free',
  title: 't',
  pool: GROUPS.hiragana.slice(0, 2).flatMap((g) => g.kana),
  review: [],
  mode: 'single',
  length: 3,
  answer: 'type',
  total: null,
  hearts: false,
  ...over,
})

describe('checkKana', () => {
  it('benar bila ketikan persis sama, spasi diabaikan', () => {
    expect(checkKana('かき', byChar('かき'))).toEqual({ ok: true, prefix: 2 })
    expect(checkKana('か き', byChar('かき'))).toEqual({ ok: true, prefix: 2 })
  })

  it('menghitung huruf benar dari depan saat salah', () => {
    expect(checkKana('かけ', byChar('かき'))).toEqual({ ok: false, prefix: 1 })
    expect(checkKana('', byChar('か'))).toEqual({ ok: false, prefix: 0 })
  })

  it('menolak ketikan berlebih', () => {
    expect(checkKana('かきく', byChar('かき')).ok).toBe(false)
  })

  it('mengenali yoon dua karakter sebagai satu huruf', () => {
    expect(checkKana('きゃ', [ALL_KANA.find((k) => k.char === 'きゃ')!])).toEqual({ ok: true, prefix: 1 })
  })
})

describe('isChoiceAnswer', () => {
  it('arah baca memeriksa romaji, arah tulis memeriksa huruf', () => {
    const q = { seq: byChar('し'), type: 'choice' as const, options: [] }
    expect(isChoiceAnswer(q, 'shi')).toBe(true)
    expect(isChoiceAnswer(q, 'ka')).toBe(false)
    expect(isChoiceAnswer(q, 'し', 'write')).toBe(true)
    expect(isChoiceAnswer(q, 'shi', 'write')).toBe(false)
  })
})

describe('promptRomaji', () => {
  it('memakai ejaan alternatif untuk huruf kembar bunyi (ぢ = di, づ = du)', () => {
    expect(promptRomaji(byChar('じ')[0])).toBe('ji')
    expect(promptRomaji(byChar('ぢ')[0])).not.toBe('ji')
  })
})

describe('starsFor', () => {
  it('bintang menurut akurasi', () => {
    expect(starsFor(9, 1)).toBe(3)
    expect(starsFor(7, 3)).toBe(2)
    expect(starsFor(1, 9)).toBe(1)
  })
})

describe('QuestionGenerator.next', () => {
  const makeQuestion = (cfg: QuizConfig, stats: Record<string, { r: number; w: number }>) => gen.next(cfg, stats)
  let gen: QuestionGenerator
  beforeEach(() => {
    gen = new QuestionGenerator()
  })

  it('per huruf: tiap huruf di pool keluar sekali sebelum ada yang terulang', () => {
    const cfg = config({ pool: byChar('あいうえお') })
    // semua huruf sudah terlatih, jadi tidak ada kartu tambahan di kocokan
    const stats = Object.fromEntries(cfg.pool.map((k) => [k.id, { r: 9, w: 0 }]))
    const drawn = Array.from({ length: 5 }, () => makeQuestion(cfg, stats).seq[0].id)
    expect(new Set(drawn).size).toBe(5)
  })

  it('gabungan: panjang sesuai pengaturan dan jenis ketik', () => {
    const cfg = config({ mode: 'combined', length: 6 })
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(cfg, {})
      expect(q.seq).toHaveLength(6)
      expect(q.type).toBe('type')
    }
  })

  it('pilihan ganda: empat pilihan unik yang memuat jawaban', () => {
    const cfg = config({ answer: 'choice' })
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion(cfg, {})
      expect(q.type).toBe('choice')
      expect(new Set(q.options).size).toBe(4)
      expect(q.options.some((o) => isChoiceAnswer(q, o))).toBe(true)
    }
  })

  it('arah tulis: pilihan ganda berisi huruf Jepang tanpa bacaan yang bentrok', () => {
    const cfg = config({ direction: 'write', answer: 'type' })
    for (let i = 0; i < 30; i++) {
      const q = makeQuestion(cfg, {})
      expect(q.type).toBe('choice')
      const wrong = q.options.filter((o) => o !== q.seq[0].char)
      expect(wrong.length).toBe(3)
      for (const w of wrong) {
        const k = ALL_KANA.find((x) => x.char === w && x.script === q.seq[0].script)!
        expect(k.romaji.some((r) => q.seq[0].romaji.includes(r))).toBe(false)
      }
    }
  })

  it('arah tulis gabungan: kepingan memuat semua huruf jawaban, plus pengecoh', () => {
    const cfg = config({ direction: 'write', mode: 'combined', length: 5 })
    for (let i = 0; i < 20; i++) {
      const q = makeQuestion(cfg, {})
      expect(q.type).toBe('tiles')
      const bank = [...q.options]
      for (const k of q.seq) {
        const at = bank.indexOf(k.char)
        expect(at).toBeGreaterThanOrEqual(0)
        bank.splice(at, 1)
      }
      expect(bank.length).toBeGreaterThanOrEqual(2)
    }
  })

  it('arah tulis dengan keyboard: tetap jenis ketik', () => {
    const cfg = config({ direction: 'write', input: 'keyboard', mode: 'combined', length: 4 })
    expect(makeQuestion(cfg, {}).type).toBe('type')
  })

  it('gabungan tidak mengulang rangkaian yang sama dalam satu sesi (kecuali pengulangan sengaja)', () => {
    const cfg = config({ mode: 'combined', length: 4, words: true, pool: GROUPS.hiragana.slice(0, 6).flatMap((g) => g.kana) })
    const keys = Array.from({ length: 40 }, () => makeQuestion(cfg, {}).seq.map((k) => k.id).join())
    expect(new Set(keys).size).toBe(keys.length)
  })
})

describe('QuestionGenerator: keadaan per instance', () => {
  it('dua generator tidak berbagi kocokan atau riwayat soal', () => {
    const cfg = config({ pool: byChar('あいうえお') })
    const stats = Object.fromEntries(cfg.pool.map((k) => [k.id, { r: 9, w: 0 }]))
    const a = new QuestionGenerator()
    const b = new QuestionGenerator()
    const fromA = Array.from({ length: 5 }, () => a.next(cfg, stats).seq[0].id)
    const fromB = Array.from({ length: 5 }, () => b.next(cfg, stats).seq[0].id)
    expect(new Set(fromA).size).toBe(5)
    expect(new Set(fromB).size).toBe(5)
  })

  it('rangkaian yang salah dijadwalkan ulang, paling banyak dua kali', () => {
    const cfg = config({ mode: 'combined', length: 3 })
    const gen = new QuestionGenerator()
    const q = gen.next(cfg, {})
    const key = q.seq.map((k) => k.id).join()
    let repeats = 0
    for (let round = 0; round < 3; round++) {
      gen.scheduleRetry(cfg, q)
      for (let i = 0; i < 8; i++) {
        if (gen.next(cfg, {}).seq.map((k) => k.id).join() === key) {
          repeats++
          break
        }
      }
    }
    expect(repeats).toBe(2)
  })

  it('clearRetry (dijawab benar dan cepat) mengosongkan hitungan ulang sehingga jatah ulang pulih', () => {
    const cfg = config({ mode: 'combined', length: 3 })
    const gen = new QuestionGenerator()
    const q = gen.next(cfg, {})
    const key = q.seq.map((k) => k.id).join()
    const shownAgain = () => {
      gen.scheduleRetry(cfg, q)
      for (let i = 0; i < 8; i++) if (gen.next(cfg, {}).seq.map((k) => k.id).join() === key) return true
      return false
    }
    expect(shownAgain()).toBe(true)
    expect(shownAgain()).toBe(true)
    gen.clearRetry(cfg, q)
    expect(shownAgain()).toBe(true)
  })
})

describe('kata dengan huruf khusus di dalam soal', () => {
  const pool = [...GROUPS.hiragana, ...GROUPS.katakana].flatMap((g) => g.kana)

  it('jawaban dari bacaan utama selalu diterima, dan susunan huruf aslinya selalu benar', () => {
    const cfg = config({ pool, mode: 'combined', length: 6, words: true, special: SPECIAL_KANA.map((k) => k.id) })
    const gen = new QuestionGenerator()
    let withSpecial = 0
    for (let i = 0; i < 400; i++) {
      const q = gen.next(cfg, {})
      if (q.seq.some((k) => k.special)) withSpecial++
      const typed = q.seq.map((_, j) => romajiAt(q.seq, j)[0]).join('')
      expect(matchesSequence(typed, q.seq), typed).toBe(true)
      expect(checkKana(q.seq.map((k) => k.char).join(''), q.seq).ok).toBe(true)
    }
    expect(withSpecial).toBeGreaterThan(0)
  })

  it('tanpa memilih huruf khusus, tidak ada soal yang memuatnya', () => {
    const cfg = config({ pool, mode: 'combined', length: 6, words: true })
    const gen = new QuestionGenerator()
    for (let i = 0; i < 300; i++) expect(gen.next(cfg, {}).seq.some((k) => k.special)).toBe(false)
  })

  it('hanya huruf khusus yang dipilih yang dipakai (っ saja, tanpa ー)', () => {
    const cfg = config({ pool, mode: 'combined', length: 6, words: true, special: ['hiragana:っ', 'katakana:ッ'] })
    const gen = new QuestionGenerator()
    for (let i = 0; i < 300; i++) for (const k of gen.next(cfg, {}).seq) expect(k.special).not.toBe('choon')
  })

  it('kepingan arah tulis memuat huruf khusus yang diminta jawaban', () => {
    const cfg = config({ pool, mode: 'combined', length: 6, words: true, direction: 'write', special: SPECIAL_KANA.map((k) => k.id) })
    const gen = new QuestionGenerator()
    for (let i = 0; i < 200; i++) {
      const q = gen.next(cfg, {})
      for (const k of q.seq) expect(q.options).toContain(k.char)
    }
  })
})
