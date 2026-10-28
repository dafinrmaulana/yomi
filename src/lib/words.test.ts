import { describe, expect, it } from 'vitest'
import { WORDS_HIRAGANA, WORDS_KATAKANA } from '../data/words'
import { ALL_KANA, GROUPS } from './kana'
import { parseKana, pickWords, WORDS } from './words'

describe('daftar kata', () => {
  it('semua kata bisa diurai jadi huruf aplikasi (tidak ada yang diam-diam terbuang)', () => {
    for (const w of [...WORDS_HIRAGANA, ...WORDS_KATAKANA]) {
      expect(parseKana(w.text), w.text).not.toBeNull()
    }
  })

  it('tidak ada kata ganda dan semuanya punya arti', () => {
    const texts = WORDS.map((w) => w.text)
    expect(new Set(texts).size).toBe(texts.length)
    for (const w of WORDS) expect(w.meaning, w.text).toBeTruthy()
  })
})

describe('parseKana', () => {
  it('menggabungkan yoon jadi satu huruf dan menolak karakter asing', () => {
    expect(parseKana('きょう')?.map((k) => k.char)).toEqual(['きょ', 'う'])
    expect(parseKana('かa')).toBeNull()
  })
})

describe('pickWords', () => {
  const pool = GROUPS.hiragana.slice(0, 10).flatMap((g) => g.kana)
  const filler = (n: number) => Array.from({ length: n }, () => pool[0])

  it('panjang hasil selalu sama dengan yang diminta, dan jumlah segmen cocok', () => {
    for (const length of [2, 3, 5, 7, 12, 20]) {
      const r = pickWords(pool, {}, length, filler)
      expect(r, `panjang ${length}`).not.toBeNull()
      expect(r!.seq).toHaveLength(length)
      expect(r!.words.reduce((a, w) => a + w.len, 0)).toBe(length)
    }
  })

  it('kata yang dipilih hanya memakai huruf dari pool', () => {
    const ids = new Set(pool.map((k) => k.id))
    for (let i = 0; i < 30; i++) {
      const r = pickWords(pool, {}, 6, () => [])!
      let from = 0
      for (const w of r.words) {
        if (w.meaning) for (const k of r.seq.slice(from, from + w.len)) expect(ids.has(k.id)).toBe(true)
        from += w.len
      }
    }
  })

  it('mengembalikan null bila pool terlalu kecil untuk membentuk kata', () => {
    expect(pickWords([ALL_KANA[0]], {}, 4, filler)).toBeNull()
  })

  it('kata yang paling jarang dipakai bergiliran dulu', () => {
    const uses = new Map<string, number>()
    const seen: string[] = []
    for (let i = 0; i < 12; i++) {
      const r = pickWords(pool, {}, 2, filler, undefined, uses)!
      seen.push(r.seq.map((k) => k.char).join(''))
    }
    const fit = WORDS.filter((w) => w.ids.every((id) => pool.some((k) => k.id === id)) && w.seq.length === 2)
    // tidak ada kata yang dipakai dua kali sebelum semua kata muat dipakai sekali
    const firstRound = seen.slice(0, Math.min(fit.length, seen.length))
    expect(new Set(firstRound).size).toBe(firstRound.length)
  })
})
