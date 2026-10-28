import { describe, expect, it } from 'vitest'
import { KANA_BY_ID, type Kana } from './kana'
import { longestPrefix, matchesSequence } from './romaji'

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
