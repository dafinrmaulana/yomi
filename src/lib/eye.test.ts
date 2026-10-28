import { describe, expect, it } from 'vitest'
import { MANGEKYO, pickMangekyo, sharinganLevel } from './eye'

describe('sharinganLevel', () => {
  it('naik menurut combo', () => {
    expect([0, 2, 3, 5, 6, 9, 10, 50].map(sharinganLevel)).toEqual([1, 1, 2, 2, 3, 3, 4, 4])
  })
})

describe('pickMangekyo', () => {
  it('selalu berbeda dari pilihan sebelumnya dan berasal dari daftar', () => {
    let prev = pickMangekyo()
    for (let i = 0; i < 50; i++) {
      const next = pickMangekyo()
      expect(MANGEKYO).toContain(next)
      expect(next).not.toBe(prev)
      prev = next
    }
  })
})
