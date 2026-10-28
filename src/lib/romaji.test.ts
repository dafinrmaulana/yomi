import { describe, expect, it } from 'vitest'
import { KANA_BY_ID } from './kana'
import { parseKana } from './words'
import { display, longestPrefix, matchesSequence, romajiAt } from './romaji'

const first = (chars: string) => [...chars].map((c) => Object.values(KANA_BY_ID).find((k) => k.char === c)!)

describe('matchesSequence', () => {
  it('menerima romaji utama maupun alternatif', () => {
    expect(matchesSequence('shi', first('し'))).toBe(true)
    expect(matchesSequence('si', first('し'))).toBe(true)
  })

  it('mengabaikan spasi, huruf besar, dan tanda pemisah', () => {
    expect(matchesSequence('Ka Ki-Ku', first('かきく'))).toBe(true)
  })

  it('menolak jawaban kosong, kurang, lebih, atau salah', () => {
    expect(matchesSequence('', first('か'))).toBe(false)
    expect(matchesSequence('ka', first('かき'))).toBe(false)
    expect(matchesSequence('kakiku', first('かき'))).toBe(false)
    expect(matchesSequence('ki', first('か'))).toBe(false)
  })
})

describe('longestPrefix', () => {
  it('menghitung huruf berurutan yang benar dari depan', () => {
    expect(longestPrefix('kakiku', first('かきけ'))).toBe(2)
    expect(longestPrefix('kaki', first('かき'))).toBe(2)
    expect(longestPrefix('xx', first('かき'))).toBe(0)
  })

  it('tidak melompati huruf yang salah', () => {
    expect(longestPrefix('kaxku', first('かきく'))).toBe(1)
  })
})

const word = (t: string) => parseKana(t)!

describe('っ/ッ (konsonan rangkap)', () => {
  it('bacaannya adalah konsonan huruf berikutnya', () => {
    expect(romajiAt(word('きって'), 1)).toEqual(['t'])
    expect(matchesSequence('kitte', word('きって'))).toBe(true)
    expect(matchesSequence('kite', word('きって'))).toBe(false)
    expect(matchesSequence('kipte', word('きって'))).toBe(false)
  })

  it('ikut variasi romaji huruf berikutnya (matchi / matti)', () => {
    expect(matchesSequence('matchi', word('まっち'))).toBe(true)
    expect(matchesSequence('matti', word('まっち'))).toBe(true)
    expect(matchesSequence('kasshu', word('かっしゅ'))).toBe(true)
  })

  it('longestPrefix menghitung sampai huruf sebelum yang salah', () => {
    expect(longestPrefix('kipte', word('きって'))).toBe(1)
    expect(longestPrefix('kitte', word('きって'))).toBe(3)
  })
})

describe('ー (vokal panjang)', () => {
  it('bacaannya adalah vokal huruf sebelumnya', () => {
    expect(romajiAt(word('ゲーム'), 1)).toEqual(['e', '-'])
    expect(matchesSequence('geemu', word('ゲーム'))).toBe(true)
    expect(matchesSequence('ge-mu', word('ゲーム'))).toBe(true)
    expect(matchesSequence('gemu', word('ゲーム'))).toBe(false)
  })

  it('display menampilkan bacaan menurut konteks', () => {
    expect(display(word('ゲーム'))).toBe('ge e mu')
    expect(display(word('きって'))).toBe('ki t te')
  })
})

describe('tanda hubung', () => {
  it('masih boleh dipakai sebagai pemisah antar huruf (kata biasa)', () => {
    expect(matchesSequence('ka-ki-ku', first('かきく'))).toBe(true)
    expect(matchesSequence('ka-ki-ku-', first('かきく'))).toBe(true)
  })

  it('tidak bisa menggantikan huruf yang bukan ー', () => {
    expect(matchesSequence('k-a', first('か'))).toBe(false)
  })
})
