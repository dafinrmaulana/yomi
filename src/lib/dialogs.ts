import { RAW_DIALOGS } from '../data/dialogs'
import type { Kana } from './kana'
import { parseKana, type Segment } from './words'

export interface DialogLine {
  speaker: string
  seq: Kana[]
  /** satu bagian per kata (partikel menempel di katanya), tanpa arti: arti ada di tingkat baris */
  words: Segment[]
  meaning: string
}

export interface Dialog {
  id: string
  title: string
  lines: DialogLine[]
  /** semua id huruf yang dipakai dialog ini */
  ids: Set<string>
}

/** kalimat jadi urutan huruf dan pembagian kata; tanda baca dan spasi memisahkan kata dan tidak dijawab */
function parseLine(text: string): { seq: Kana[]; words: Segment[] } | null {
  const seq: Kana[] = []
  const words: Segment[] = []
  for (const token of text.split(/[\s、。？！]+/).filter(Boolean)) {
    const part = parseKana(token)
    if (!part) return null
    seq.push(...part)
    words.push({ len: part.length })
  }
  return seq.length ? { seq, words } : null
}

function build(): Dialog[] {
  return RAW_DIALOGS.map((d) => {
    const lines = d.lines.map(([speaker, text, meaning]): DialogLine => {
      const parsed = parseLine(text)
      // salah ketik di data harus ketahuan di tes, bukan diam-diam hilang
      if (!parsed) throw new Error(`Dialog "${d.id}": kalimat tidak bisa diurai: ${text}`)
      return { speaker, meaning, ...parsed }
    })
    return { id: d.id, title: d.title, lines, ids: new Set(lines.flatMap((l) => l.seq.map((k) => k.id))) }
  })
}

export const DIALOGS: Dialog[] = build()

/** dialog yang semua hurufnya ada di antara id yang dipilih (huruf biasa dan huruf khusus) */
export function eligibleDialogs(ids: Iterable<string>): Dialog[] {
  const have = new Set(ids)
  return DIALOGS.filter((d) => [...d.ids].every((id) => have.has(id)))
}
