import { GROUPS, type Script } from './kana'

export interface WriteChar {
  char: string
  /** code point heksadesimal, dipakai di alamat halaman */
  code: string
  romaji: string
  script: Script
}

export interface WriteRow {
  id: string
  title: string
  chars: WriteChar[]
}

export interface WriteSection {
  kind: string
  title: string
  rows: WriteRow[]
}

const code = (c: string) => c.codePointAt(0)!.toString(16)
const kata = (c: string) => String.fromCharCode(c.charCodeAt(0) + 0x60)

const SMALL = [
  { hira: 'ゃ', romaji: 'ya kecil' },
  { hira: 'ゅ', romaji: 'yu kecil' },
  { hira: 'ょ', romaji: 'yo kecil' },
  { hira: 'っ', romaji: 'tsu kecil' },
]

export function writeSections(script: Script): WriteSection[] {
  const make = (char: string, romaji: string): WriteChar => ({ char, code: code(char), romaji, script })
  const rowsOf = (kind: 'dasar' | 'dakuten') =>
    GROUPS[script]
      .filter((g) => g.kind === kind)
      .map((g) => ({
        id: g.id,
        title: kind === 'dasar' ? `Baris ${g.label}` : `Bersuara ${g.label}`,
        chars: g.kana.map((k) => make(k.char, k.romaji[0])),
      }))
  return [
    { kind: 'dasar', title: 'Huruf dasar', rows: rowsOf('dasar') },
    { kind: 'dakuten', title: 'Huruf bersuara (dakuten & handakuten)', rows: rowsOf('dakuten') },
    {
      kind: 'kecil',
      title: 'Huruf kecil',
      rows: [
        {
          id: 'kecil',
          title: 'Huruf kecil',
          chars: SMALL.map((s) => make(script === 'hiragana' ? s.hira : kata(s.hira), s.romaji)),
        },
      ],
    },
  ]
}

export const allWriteChars = (script: Script) => writeSections(script).flatMap((s) => s.rows.flatMap((r) => r.chars))

export function findWriteChar(hex: string): WriteChar | null {
  for (const s of ['hiragana', 'katakana'] as Script[]) {
    const f = allWriteChars(s).find((c) => c.code === hex)
    if (f) return f
  }
  return null
}

/** catatan untuk huruf yang sering tertukar */
export const NOTES: Record<string, string> = {
  ぬ: 'Ujung ぬ berakhir dengan simpul kecil, sedangkan め tidak. Itu pembeda utama keduanya.',
  め: 'め tidak punya simpul di ujungnya. Kalau ada simpul, itu ぬ.',
  ね: 'ね berakhir dengan simpul kecil di kanan bawah. れ dan わ tidak punya simpul.',
  れ: 'Ujung れ keluar ke kanan tanpa simpul. Kalau ada simpul, itu ね.',
  わ: 'Ujung わ melengkung ke atas tanpa simpul. Jangan tertukar dengan れ dan ね.',
  シ: 'Dua titik di シ lebih datar dan mengarah ke kanan. Di ツ, titiknya lebih tegak mengarah ke bawah.',
  ツ: 'Titik-titik ツ lebih tegak ke bawah. Di シ, titiknya lebih datar ke kanan.',
  ソ: 'ソ: titik pendek di kiri dan sapuan panjang dari atas ke kiri bawah. ン lebih mendatar.',
  ン: 'ン mirip シ tanpa titik ketiga: goresan pendek di kiri atas dan sapuan ke kanan atas.',
  い: 'い ditulis dari dua goresan yang melengkung. Goresan kiri lebih panjang dari kanan.',
  り: 'り mirip い, tetapi goresan kanan lebih panjang dan turun menyapu.',
}

export const SMALL_NOTE =
  'Huruf kecil ditulis sama seperti hurufnya yang besar, hanya ukurannya sekitar setengah dan diletakkan di bagian bawah-kanan kotak.'
