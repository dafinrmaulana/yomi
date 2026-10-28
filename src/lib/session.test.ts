import { describe, expect, it } from 'vitest'
import { ALL_KANA, GROUPS } from './kana'
import { STREAK_FOR_UP, TEST_MISSES } from './tuning'
import { SessionTracker, type AdviceSettings } from './session'

const pool = GROUPS.hiragana[0].kana
const settings: AdviceSettings = { mode: 'combined', length: 5, selected: pool.map((k) => k.id), direction: 'read' }

/** jawab satu soal berisi seluruh pool; `ms` per soal */
const answer = (t: SessionTracker, ok: boolean, ms = 500, s = settings, wasNear = false) =>
  t.record({ seq: pool, prefix: ok ? pool.length : 1, ok, ms, settings: s, wasNear })

describe('SessionTracker.record', () => {
  it('menghitung benar sampai huruf sebelum yang salah, dan salah di huruf pertama yang keliru', () => {
    const t = new SessionTracker()
    answer(t, false) // prefix 1: huruf ke-0 benar, ke-1 salah, sisanya tidak dihitung
    expect(t.stats[pool[0].id]).toEqual({ r: 1, w: 0 })
    expect(t.stats[pool[1].id]).toEqual({ r: 0, w: 1 })
    expect(t.stats[pool[2].id]).toBeUndefined()
  })

  it('waktu hanya dicatat untuk jawaban benar, dibagi rata ke tiap huruf', () => {
    const t = new SessionTracker()
    answer(t, false, 1000)
    expect(t.speed).toEqual({})
    const { each } = answer(t, true, 5000)
    expect(each).toBe(1000)
    expect(t.speed[pool[0].id]).toMatchObject({ n: 1, ms: 1000 })
  })

  it('satu salah ditoleransi, salah kedua mengulang tes', () => {
    const t = new SessionTracker()
    for (let i = 0; i < TEST_MISSES; i++) expect(answer(t, false).outcome).toBeNull()
    expect(answer(t, false).outcome).toBe('reset')
  })

  it('salah saat sudah dekat memberi peringatan, bukan reset', () => {
    const t = new SessionTracker()
    expect(answer(t, false, 500, settings, true).outcome).toBe('warn')
  })
})

describe('SessionTracker: saran naik level', () => {
  const play = (t: SessionTracker, n: number) => {
    for (let i = 0; i < n; i++) answer(t, true, 500)
  }

  it('muncul hanya setelah benar beruntun cukup panjang', () => {
    const t = new SessionTracker()
    play(t, STREAK_FOR_UP - 1)
    expect(t.advice(settings, {}, {}, [])?.kind).not.toBe('up')
    play(t, 1)
    expect(t.advice(settings, {}, {}, [])?.kind).toBe('up')
  })

  it('saran yang sudah ditutup tidak muncul lagi', () => {
    const t = new SessionTracker()
    play(t, STREAK_FOR_UP)
    const a = t.advice(settings, {}, {}, [])!
    expect(t.advice(settings, {}, {}, [a.key])).toBeUndefined()
  })

  it('penilaian mulai dari awal saat pengaturan berganti', () => {
    const t = new SessionTracker()
    play(t, STREAK_FOR_UP)
    const other = { ...settings, length: settings.length + 1 }
    expect(t.advice(other, {}, {}, [])?.kind).not.toBe('up')
    expect(t.isNear(other, {}, {})).toBe(false)
  })

  it('isNear menyala sebelum saran muncul', () => {
    const t = new SessionTracker()
    play(t, 8)
    expect(t.isNear(settings, {}, {})).toBe(true)
  })
})

describe('SessionTracker: gabungan dengan data lama', () => {
  it('menjumlahkan statistik dan waktu sesi dengan data sebelumnya', () => {
    const t = new SessionTracker()
    answer(t, true, 1000)
    const id = pool[0].id
    expect(t.mergedStats({ [id]: { r: 4, w: 1 } })[id]).toEqual({ r: 5, w: 1 })
    expect(t.mergedSpeed({ [id]: { n: 2, ms: 4000, recent: [2000, 2000] } })[id]).toMatchObject({ n: 3, ms: 4000 + 200 })
  })

  it('huruf katakana ikut terhitung tanpa error', () => {
    const t = new SessionTracker()
    t.record({ seq: ALL_KANA.slice(-3), prefix: 3, ok: true, ms: 300, settings, wasNear: false })
    expect(Object.keys(t.stats)).toHaveLength(3)
  })
})
