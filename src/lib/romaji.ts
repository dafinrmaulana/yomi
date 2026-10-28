import type { Kana } from './kana'

/**
 * Bacaan yang diterima untuk huruf ke-i dalam rangkaian. Huruf biasa: daftar romajinya. っ/ッ: huruf konsonan
 * pertama dari huruf berikutnya (きって → ki · t · te). ー: huruf vokal dari huruf sebelumnya (ケー → ke · e).
 */
export function romajiAt(seq: Kana[], i: number): string[] {
  const k = seq[i]
  if (k.special === 'sokuon') {
    const next = seq[i + 1]
    if (!next || next.special) return ['']
    return [...new Set(romajiAt(seq, i + 1).map((r) => r[0]))]
  }
  if (k.special === 'choon') {
    const prev = seq[i - 1]
    if (!prev || prev.special) return ['']
    // vokal sebelumnya, atau tanda '-' (ge-mu)
    return [...new Set(romajiAt(seq, i - 1).map((r) => r[r.length - 1])), '-']
  }
  return k.romaji
}

/** buang spasi dan pemisah; tanda '-' dipertahankan karena bisa berarti ー (ge-mu) atau sekadar pemisah */
export const normalize = (s: string) => s.toLowerCase().replace(/[\s'’·]/g, '')

/** posisi yang mungkin setelah satu huruf: langsung, atau melewati satu '-' pemisah (ka-ki) */
const after = (text: string, pos: number) => (text[pos] === '-' ? [pos, pos + 1] : [pos])

/** apakah input persis sama dengan salah satu kombinasi romaji dari urutan kana */
export function matchesSequence(input: string, seq: Kana[]): boolean {
  const text = normalize(input)
  const go = (i: number, pos: number): boolean => {
    if (i === seq.length) return after(text, pos).includes(text.length)
    return romajiAt(seq, i).some((r) => after(text, pos).some((p) => text.startsWith(r, p) && go(i + 1, p + r.length)))
  }
  return text.length > 0 && go(0, 0)
}

/** berapa kana berurutan dari awal yang sudah dibaca benar (untuk statistik per huruf) */
export function longestPrefix(input: string, seq: Kana[]): number {
  const text = normalize(input)
  const go = (i: number, pos: number): number => {
    if (i === seq.length) return i
    let best = i
    for (const r of romajiAt(seq, i)) {
      for (const p of after(text, pos)) if (text.startsWith(r, p)) best = Math.max(best, go(i + 1, p + r.length))
    }
    return best
  }
  return go(0, 0)
}

export const display = (seq: Kana[]) => seq.map((_, i) => romajiAt(seq, i)[0]).join(' ')
