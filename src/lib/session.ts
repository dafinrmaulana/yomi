import { adviceFor, testMisses, upProgress, type Advice, type SessionLog } from './advice'
import type { Kana } from './kana'
import { slowMs } from './quiz'
import type { FreeSettings, SpeedStat } from './storage'
import { NEAR_UP, SPEED_WINDOW, STREAK_FOR_UP, TEST_MISSES } from './tuning'

type Stats = Record<string, { r: number; w: number }>
type Speed = Record<string, SpeedStat>

/** pengaturan yang dipakai menilai saran; berubah = penilaian dimulai dari awal */
export type AdviceSettings = Pick<FreeSettings, 'mode' | 'length' | 'selected' | 'direction'>

export const scopeOf = (s: AdviceSettings) => `${s.mode}|${s.length}|${s.selected.length}`

/** apa yang terjadi pada tes naik level setelah sebuah jawaban */
export type TestOutcome = 'reset' | 'warn' | null

/**
 * Pencatat satu sesi latihan: statistik dan waktu per huruf, serta catatan untuk saran naik level
 * (benar beruntun, masa tes, catatan sesi). Tidak bergantung pada React; hanya `record` yang mengubah isinya.
 */
export class SessionTracker {
  /** benar/salah per huruf di sesi ini */
  readonly stats: Stats = {}
  /** waktu jawab benar per huruf di sesi ini */
  readonly speed: Speed = {}
  /** catatan per huruf untuk saran fokus; dikosongkan tiap pengaturan berubah */
  private log: SessionLog = {}
  /** masa tes naik level: dimulai ulang dari kosong setiap salah melebihi toleransi atau pengaturan berubah */
  private test: SessionLog = {}
  /** jawaban benar beruntun sejak pengaturan terakhir berubah; saran naik level harus dibuktikan di level yang baru */
  private run = 0
  private scope = ''

  /** catatan yang berlaku untuk pengaturan ini (kosong bila pengaturan sudah berganti sejak catatan terakhir) */
  private view(settings: AdviceSettings) {
    return scopeOf(settings) === this.scope ? { log: this.log, test: this.test, run: this.run } : { log: {}, test: {}, run: 0 }
  }

  /**
   * Catat satu jawaban. `prefix` = jumlah huruf benar sebelum huruf yang salah; `ms` = waktu soal; `wasNear` =
   * tes naik level sudah dekat sebelum jawaban ini.
   * Hasil: 'reset' (salah melebihi toleransi, tes diulang), 'warn' (salah dalam toleransi saat sudah dekat), atau null.
   */
  record(a: { seq: Kana[]; prefix: number; ok: boolean; ms: number; settings: AdviceSettings; wasNear: boolean }): {
    each: number
    outcome: TestOutcome
  } {
    const scope = scopeOf(a.settings)
    if (scope !== this.scope) {
      this.scope = scope
      this.log = {}
      this.test = {}
      this.run = 0
    }
    // waktu berpikir dibagi rata ke tiap huruf, tanpa batas atas
    const each = a.ms / a.seq.length
    const limit = slowMs(a.settings.direction)
    a.seq.forEach((k, i) => {
      if (i > a.prefix) return
      const s = (this.stats[k.id] ??= { r: 0, w: 0 })
      if (i < a.prefix) s.r++
      else s.w++
      for (const book of [this.log, this.test]) {
        const l = (book[k.id] ??= { r: 0, w: 0, fast: 0 })
        if (i < a.prefix) {
          l.r++
          if (each <= limit) l.fast++
        } else l.w++
      }
    })

    let outcome: TestOutcome = null
    // satu salah ditoleransi per tes; salah berikutnya mengulang tes dan hitungan benar beruntun dari awal
    if (a.ok) this.run++
    else if (testMisses(this.test) > TEST_MISSES) {
      this.test = {}
      this.run = 0
      outcome = 'reset'
    } else if (a.wasNear) outcome = 'warn'

    if (a.ok) {
      for (const k of a.seq) {
        const s = (this.speed[k.id] ??= { n: 0, ms: 0, recent: [] })
        s.n++
        s.ms += each
        s.recent = [...(s.recent ?? []), each].slice(-SPEED_WINDOW)
      }
    }
    return { each, outcome }
  }

  /** statistik seluruh waktu ditambah sesi ini */
  mergedStats(base: Stats): Stats {
    const out = { ...base }
    for (const [id, s] of Object.entries(this.stats)) {
      const o = out[id] ?? { r: 0, w: 0 }
      out[id] = { r: o.r + s.r, w: o.w + s.w }
    }
    return out
  }

  mergedSpeed(base: Speed): Speed {
    const out = { ...base }
    for (const [id, s] of Object.entries(this.speed)) {
      const o = out[id] ?? { n: 0, ms: 0 }
      out[id] = { n: o.n + s.n, ms: o.ms + s.ms, recent: [...(o.recent ?? []), ...(s.recent ?? [])].slice(-SPEED_WINDOW) }
    }
    return out
  }

  /** saran untuk pengaturan ini; saran naik level baru muncul setelah benar beruntun cukup panjang */
  advice(settings: AdviceSettings, baseStats: Stats, baseSpeed: Speed, dismissed: string[]): Advice | undefined {
    const { log, test, run } = this.view(settings)
    return adviceFor(settings, this.mergedStats(baseStats), this.mergedSpeed(baseSpeed), log, test).find(
      (a) => !dismissed.includes(a.key) && (a.kind !== 'up' || run >= STREAK_FOR_UP),
    )
  }

  /** tes naik level sudah dekat (belum tentu lolos) */
  isNear(settings: AdviceSettings, baseStats: Stats, baseSpeed: Speed): boolean {
    const { test, run } = this.view(settings)
    return upProgress(settings, this.mergedStats(baseStats), this.mergedSpeed(baseSpeed), test, run) >= NEAR_UP
  }
}
