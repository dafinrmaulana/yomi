import type { Kana } from './kana'

export const normalize = (s: string) => s.toLowerCase().replace(/[\s'’\-·]/g, '')

/** apakah input persis sama dengan salah satu kombinasi romaji dari urutan kana */
export function matchesSequence(input: string, seq: Kana[]): boolean {
  const text = normalize(input)
  const go = (i: number, pos: number): boolean => {
    if (i === seq.length) return pos === text.length
    return seq[i].romaji.some((r) => text.startsWith(r, pos) && go(i + 1, pos + r.length))
  }
  return text.length > 0 && go(0, 0)
}

/** berapa kana berurutan dari awal yang sudah dibaca benar (untuk statistik per huruf) */
export function longestPrefix(input: string, seq: Kana[]): number {
  const text = normalize(input)
  const go = (i: number, pos: number): number => {
    if (i === seq.length) return i
    let best = i
    for (const r of seq[i].romaji) {
      if (text.startsWith(r, pos)) best = Math.max(best, go(i + 1, pos + r.length))
    }
    return best
  }
  return go(0, 0)
}

export const display = (seq: Kana[]) => seq.map((k) => k.romaji[0]).join(' ')
