import { GROUPS, KANA_BY_ID } from './kana'
import type { QuizConfig } from './quiz'
import type { FreeSettings, QuizMode } from './storage'

/** id huruf khusus (っ/ッ, ー) di antara pilihan */
export const specialIds = (ids: string[]) => ids.filter((id) => KANA_BY_ID[id]?.special)

/** huruf biasa yang dipilih di pengaturan Latihan Bebas (urutan mengikuti daftar huruf); huruf khusus tidak termasuk */
export function selectedKana(s: FreeSettings) {
  const ids = new Set(s.selected)
  return Object.values(GROUPS)
    .flatMap((gs) => gs.flatMap((g) => g.kana))
    .filter((k) => ids.has(k.id))
}

/**
 * Pengaturan Latihan Bebas jadi konfigurasi kuis. Aturan yang berlaku di satu tempat: mode gabungan arah baca
 * selalu diketik, kata nyata selalu dipakai, dan arah tulis memakai kepingan kecuali memilih keyboard.
 */
export function freeConfig(s: FreeSettings): QuizConfig {
  return {
    kind: 'free',
    title: 'Latihan Bebas',
    pool: selectedKana(s),
    special: specialIds(s.selected),
    review: [],
    mode: s.mode,
    length: s.length,
    answer: s.mode === 'combined' ? 'type' : s.answer,
    direction: s.direction ?? 'read',
    input: s.input,
    words: true,
    total: null,
    hearts: false,
  }
}

/** konfigurasi yang sama dengan mode diganti (per huruf ↔ gabungan), tanpa mengubah huruf yang dipilih */
export function withMode(s: FreeSettings, mode: QuizMode): QuizConfig {
  return freeConfig({ ...s, mode })
}
