import { describe, expect, it } from 'vitest'
import { freeConfig, selectedKana, withMode } from './free'
import { GROUPS } from './kana'
import type { FreeSettings } from './storage'

const vowels = GROUPS.hiragana[0].kana.map((k) => k.id)
const base: FreeSettings = { selected: vowels, mode: 'single', length: 4, answer: 'choice' }

describe('freeConfig', () => {
  it('membawa huruf terpilih, kata nyata, dan sesi tanpa batas', () => {
    const c = freeConfig(base)
    expect(c.pool.map((k) => k.id).sort()).toEqual([...vowels].sort())
    expect(c).toMatchObject({ kind: 'free', words: true, total: null, hearts: false, direction: 'read' })
  })

  it('mode gabungan selalu diketik, mode per huruf mengikuti pengaturan jawaban', () => {
    expect(freeConfig({ ...base, mode: 'combined' }).answer).toBe('type')
    expect(freeConfig(base).answer).toBe('choice')
  })

  it('meneruskan arah tulis dan cara menjawab', () => {
    expect(freeConfig({ ...base, direction: 'write', input: 'keyboard' })).toMatchObject({ direction: 'write', input: 'keyboard' })
  })

  it('huruf khusus tidak masuk pool soal, tapi diteruskan terpisah', () => {
    const c = freeConfig({ ...base, selected: [...vowels, 'hiragana:っ'] })
    expect(c.pool.some((k) => k.special)).toBe(false)
    expect(c.special).toEqual(['hiragana:っ'])
  })

  it('huruf tak dikenal diabaikan', () => {
    expect(selectedKana({ ...base, selected: ['xxx', vowels[0]] })).toHaveLength(1)
  })
})

describe('withMode', () => {
  it('mengganti mode tanpa mengubah huruf terpilih', () => {
    const c = withMode(base, 'combined')
    expect(c.mode).toBe('combined')
    expect(c.pool).toHaveLength(vowels.length)
  })
})
