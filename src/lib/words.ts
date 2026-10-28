import { WORDS_HIRAGANA, WORDS_KATAKANA, type WordEntry } from '../data/words'
import { ALL_KANA, type Kana } from './kana'

const BY_CHAR: Record<string, Kana> = Object.fromEntries(ALL_KANA.map((k) => [k.char, k]))
const SMALL_YOON = new Set(['ゃ', 'ゅ', 'ょ', 'ャ', 'ュ', 'ョ'])

export interface Word extends WordEntry {
  seq: Kana[]
  /** semua id huruf penyusun, untuk mencocokkan dengan pool */
  ids: string[]
}

/** urai tulisan kana jadi urutan huruf aplikasi (yoon dua karakter jadi satu huruf); null bila ada karakter asing */
export function parseKana(text: string): Kana[] | null {
  const chars = [...text]
  const out: Kana[] = []
  for (let i = 0; i < chars.length; i++) {
    const pair = chars[i + 1] && SMALL_YOON.has(chars[i + 1]) ? chars[i] + chars[i + 1] : null
    const k = (pair && BY_CHAR[pair]) || BY_CHAR[chars[i]]
    if (!k) return null
    if (pair && BY_CHAR[pair]) i++
    out.push(k)
  }
  return out
}

function build(list: WordEntry[]): Word[] {
  const seen = new Set<string>()
  const out: Word[] = []
  for (const w of list) {
    if (seen.has(w.text)) continue
    const seq = parseKana(w.text)
    if (!seq || seq.length < 2) continue
    seen.add(w.text)
    out.push({ ...w, seq, ids: seq.map((k) => k.id) })
  }
  return out
}

export const WORDS: Word[] = [...build(WORDS_HIRAGANA), ...build(WORDS_KATAKANA)]

type Stats = Record<string, { r: number; w: number }>

/** seberapa butuh latihan sebuah huruf (belum dilatih atau sering salah = tinggi) */
function need(k: Kana, stats: Stats): number {
  const s = stats[k.id]
  const n = s ? s.r + s.w : 0
  return 1 + (n < 3 ? 2 : 0) + (n ? (3 * s!.w) / n : 0)
}

/** rangkaian panjang butuh lebih banyak kata (rata-rata kata ~3 huruf) */
const maxWords = (length: number) => Math.max(3, Math.ceil(length / 2.5))

/**
 * Susun rangkaian sepanjang `length` huruf dari kata-kata nyata yang hurufnya ada di pool.
 * Kata yang mengandung huruf butuh-latihan lebih sering dipilih. Panjang yang tidak ada kata tunggalnya
 * diisi dengan merangkai beberapa kata. Mengembalikan null bila pool terlalu kecil untuk membentuk kata.
 */
/** bagian rangkaian: kata nyata (punya arti) atau huruf pengisi (tanpa arti) */
export interface Segment {
  meaning?: string
  len: number
}

/**
 * `avoid`: kunci soal sebelumnya (id huruf dipisah koma) agar tidak sama dua kali.
 * `filler`: pengambil huruf untuk sisa panjang yang tidak bisa diisi kata nyata (tanpa arti).
 * `uses`: berapa kali tiap kata (teksnya) sudah dipakai di sesi ini; kata yang paling jarang dipakai didahulukan
 * supaya semua kata yang mungkin dibentuk bergiliran dulu sebelum ada yang terulang. Diisi oleh fungsi ini.
 */
export function pickWords(
  pool: Kana[],
  stats: Stats,
  length: number,
  filler: (n: number) => Kana[],
  avoid?: string,
  uses: Map<string, number> = new Map(),
): { seq: Kana[]; words: Segment[] } | null {
  const ids = new Set(pool.map((k) => k.id))
  const fit = WORDS.filter((w) => w.ids.every((id) => ids.has(id)))
  if (fit.length === 0) return null

  const weigh = (w: Word) => w.seq.reduce((a, k) => a + need(k, stats), 0) / w.seq.length
  const choose = (cands: Word[]) => {
    let roll = Math.random() * cands.reduce((a, w) => a + weigh(w), 0)
    for (const w of cands) {
      roll -= weigh(w)
      if (roll <= 0) return w
    }
    return cands[cands.length - 1]
  }

  for (let attempt = 0; attempt < 6; attempt++) {
    const parts: Word[] = []
    let rest = length
    while (rest > 0 && parts.length < maxWords(length)) {
      const muat = fit.filter((w) => w.seq.length <= rest && !parts.includes(w))
      if (muat.length === 0) break
      // hanya kata yang paling jarang dipakai (giliran merata); sisanya baru ikut bila tingkat ini habis
      const least = Math.min(...muat.map((w) => uses.get(w.text) ?? 0))
      const fresh = muat.filter((w) => (uses.get(w.text) ?? 0) === least)
      const cands = fresh.length >= 2 || fresh.some((w) => w.seq.length === rest) ? fresh : muat
      const longest = Math.max(...cands.map((w) => w.seq.length))
      // utamakan kata yang pas mengisi sisa; kalau tak ada, ambil yang terpanjang yang muat
      const near = cands.filter((w) => w.seq.length >= longest - 1)
      const exact = cands.filter((w) => w.seq.length === rest)
      let from = exact
      if (!from.length) {
        // tak ada kata yang pas: ambil kata panjang yang menyisakan >= 2 huruf supaya bisa dirangkai dengan kata lain
        const split = parts.length < maxWords(length) - 1 ? cands.filter((w) => w.seq.length <= rest - 2) : []
        const top = split.length ? Math.max(...split.map((w) => w.seq.length)) : 0
        from = split.length ? split.filter((w) => w.seq.length >= top - 1) : near
      }
      parts.push(choose(from))
      rest -= parts[parts.length - 1].seq.length
    }
    if (parts.length === 0) continue
    const segments: Segment[] = parts.map((w) => ({ meaning: w.meaning, len: w.seq.length }))
    const seq = parts.flatMap((w) => w.seq)
    // sisa yang tak muat kata nyata diisi huruf biasa (tanpa arti), supaya panjangnya tetap sesuai pengaturan
    if (rest > 0) {
      seq.push(...filler(rest))
      segments.push({ len: rest })
    }
    if (seq.map((k) => k.id).join() === avoid && fit.length > 1) continue
    for (const w of parts) uses.set(w.text, (uses.get(w.text) ?? 0) + 1)
    return { seq, words: segments }
  }
  return null
}
