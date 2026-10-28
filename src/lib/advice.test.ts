import { describe, expect, it } from 'vitest'
import { adviceFor, applyAction, NEAR_UP, STREAK_FOR_UP, TEST_MISSES, testMisses, upProgress, type SessionLog } from './advice'
import { GROUPS } from './kana'
import type { FreeSettings } from './storage'

const ids = GROUPS.hiragana[0].kana.map((k) => k.id)
const settings = (over: Partial<FreeSettings> = {}): FreeSettings => ({ selected: ids, mode: 'combined', length: 3, answer: 'type', ...over })

/** catatan tes di mana tiap huruf sudah benar `fast` kali */
const log = (fast: number, wrong = 0): SessionLog =>
  Object.fromEntries(ids.map((id, i) => [id, { r: fast, w: i === 0 ? wrong : 0, fast }]))

describe('adviceFor: naik level di dalam game', () => {
  it('muncul bila semua huruf benar-cepat dan tanpa salah', () => {
    const a = adviceFor(settings(), {}, {}, undefined, log(2))
    expect(a[0]?.kind).toBe('up')
  })

  it('satu salah masih ditoleransi, dua salah tidak', () => {
    expect(adviceFor(settings(), {}, {}, undefined, log(2, TEST_MISSES))[0]?.kind).toBe('up')
    expect(adviceFor(settings(), {}, {}, undefined, log(2, TEST_MISSES + 1))[0]?.kind).not.toBe('up')
  })

  it('tidak muncul bila ada huruf yang belum pernah benar di tes', () => {
    const test = log(2)
    delete test[ids[0]]
    expect(adviceFor(settings(), {}, {}, undefined, test)[0]?.kind).not.toBe('up')
  })

  it('tidak muncul bila huruf sampel belum cukup benar-cepat', () => {
    expect(adviceFor(settings(), {}, {}, undefined, log(1))[0]?.kind).not.toBe('up')
  })

  it('aksi menyesuaikan mode: per huruf menawarkan gabungan, gabungan menaikkan panjang', () => {
    const single = adviceFor(settings({ mode: 'single' }), {}, {}, undefined, log(2))[0]
    expect(single.actions.some((a) => a.kind === 'mode')).toBe(true)
    const combined = adviceFor(settings({ length: 4 }), {}, {}, undefined, log(2))[0]
    expect(combined.actions.find((a) => a.kind === 'length')).toMatchObject({ value: 5 })
  })
})

describe('adviceFor: fokus', () => {
  it('muncul bila banyak huruf yang sudah dicoba masih salah', () => {
    const stats = Object.fromEntries(ids.map((id) => [id, { r: 1, w: 4 }]))
    const session: SessionLog = Object.fromEntries(ids.map((id) => [id, { r: 1, w: 2, fast: 0 }]))
    expect(adviceFor(settings(), stats, {}, session)[0]?.kind).toBe('focus')
  })

  it('tidak muncul sebelum cukup banyak jawaban di sesi', () => {
    const stats = Object.fromEntries(ids.map((id) => [id, { r: 1, w: 4 }]))
    expect(adviceFor(settings(), stats, {}, {})).toHaveLength(0)
  })
})

describe('upProgress', () => {
  it('0 di awal, 1 saat semua syarat terpenuhi', () => {
    expect(upProgress(settings(), {}, {}, {}, 0)).toBe(0)
    expect(upProgress(settings(), {}, {}, log(2), STREAK_FOR_UP)).toBe(1)
  })

  it('dibatasi oleh syarat yang paling jauh', () => {
    expect(upProgress(settings(), {}, {}, log(2), 5)).toBeCloseTo(0.5)
    expect(upProgress(settings(), {}, {}, log(0), STREAK_FOR_UP)).toBe(0)
  })

  it('NEAR_UP berada di antara 0 dan 1', () => {
    expect(NEAR_UP).toBeGreaterThan(0)
    expect(NEAR_UP).toBeLessThan(1)
  })
})

describe('testMisses & applyAction', () => {
  it('menjumlah salah seluruh huruf', () => {
    expect(testMisses({ a: { r: 1, w: 2, fast: 0 }, b: { r: 0, w: 1, fast: 0 } })).toBe(3)
  })

  it('menerapkan aksi ke pengaturan tanpa mengubah aslinya', () => {
    const s = settings()
    expect(applyAction(s, { kind: 'length', value: 8, label: '' })).toMatchObject({ mode: 'combined', length: 8 })
    expect(applyAction(s, { kind: 'letters', ids: ['x'], replace: true, label: '' }).selected).toEqual(['x'])
    expect(applyAction(s, { kind: 'letters', ids: ['x'], replace: false, label: '' }).selected).toContain('x')
    expect(applyAction(s, { kind: 'finish', label: '' })).toBe(s)
    expect(s.length).toBe(3)
  })
})
