export type Script = 'hiragana' | 'katakana'

export interface Kana {
  id: string
  char: string
  /** romaji yang diterima, yang pertama dianggap utama */
  romaji: string[]
  script: Script
  group: string
  /** huruf khusus yang bacaannya bergantung pada huruf di sekitarnya (hanya muncul di kata nyata) */
  special?: 'sokuon' | 'choon'
}

export interface KanaGroup {
  id: string
  label: string
  kind: 'dasar' | 'dakuten' | 'yoon'
  kana: Kana[]
}

interface RawGroup {
  id: string
  label: string
  kind: KanaGroup['kind']
  items: string
}

// format item: "kana:romaji1,romaji2" dipisah spasi — dasarnya hiragana
const RAW: RawGroup[] = [
  { id: 'a', label: 'A', kind: 'dasar', items: 'あ:a い:i う:u え:e お:o' },
  { id: 'k', label: 'KA', kind: 'dasar', items: 'か:ka き:ki く:ku け:ke こ:ko' },
  { id: 's', label: 'SA', kind: 'dasar', items: 'さ:sa し:shi,si す:su せ:se そ:so' },
  { id: 't', label: 'TA', kind: 'dasar', items: 'た:ta ち:chi,ti つ:tsu,tu て:te と:to' },
  { id: 'n', label: 'NA', kind: 'dasar', items: 'な:na に:ni ぬ:nu ね:ne の:no' },
  { id: 'h', label: 'HA', kind: 'dasar', items: 'は:ha ひ:hi ふ:fu,hu へ:he ほ:ho' },
  { id: 'm', label: 'MA', kind: 'dasar', items: 'ま:ma み:mi む:mu め:me も:mo' },
  { id: 'y', label: 'YA', kind: 'dasar', items: 'や:ya ゆ:yu よ:yo' },
  { id: 'r', label: 'RA', kind: 'dasar', items: 'ら:ra り:ri る:ru れ:re ろ:ro' },
  { id: 'w', label: 'WA N', kind: 'dasar', items: 'わ:wa を:wo,o ん:n,nn' },
  { id: 'g', label: 'GA', kind: 'dakuten', items: 'が:ga ぎ:gi ぐ:gu げ:ge ご:go' },
  { id: 'z', label: 'ZA', kind: 'dakuten', items: 'ざ:za じ:ji,zi ず:zu ぜ:ze ぞ:zo' },
  { id: 'd', label: 'DA', kind: 'dakuten', items: 'だ:da ぢ:ji,di づ:zu,du で:de ど:do' },
  { id: 'b', label: 'BA', kind: 'dakuten', items: 'ば:ba び:bi ぶ:bu べ:be ぼ:bo' },
  { id: 'p', label: 'PA', kind: 'dakuten', items: 'ぱ:pa ぴ:pi ぷ:pu ぺ:pe ぽ:po' },
  {
    id: 'yk',
    label: 'KYA GYA',
    kind: 'yoon',
    items: 'きゃ:kya きゅ:kyu きょ:kyo ぎゃ:gya ぎゅ:gyu ぎょ:gyo',
  },
  {
    id: 'ys',
    label: 'SHA JA CHA',
    kind: 'yoon',
    items:
      'しゃ:sha,sya しゅ:shu,syu しょ:sho,syo じゃ:ja,jya,zya じゅ:ju,jyu,zyu じょ:jo,jyo,zyo ちゃ:cha,tya ちゅ:chu,tyu ちょ:cho,tyo',
  },
  {
    id: 'yn',
    label: 'NYA HYA MYA RYA',
    kind: 'yoon',
    items:
      'にゃ:nya にゅ:nyu にょ:nyo ひゃ:hya ひゅ:hyu ひょ:hyo みゃ:mya みゅ:myu みょ:myo りゃ:rya りゅ:ryu りょ:ryo',
  },
  {
    id: 'yb',
    label: 'BYA PYA',
    kind: 'yoon',
    items: 'びゃ:bya びゅ:byu びょ:byo ぴゃ:pya ぴゅ:pyu ぴょ:pyo',
  },
]

const toKatakana = (s: string) =>
  [...s].map((c) => String.fromCharCode(c.charCodeAt(0) + 0x60)).join('')

function build(script: Script): KanaGroup[] {
  return RAW.map((g) => ({
    id: g.id,
    label: g.label,
    kind: g.kind,
    kana: g.items.split(' ').map((item) => {
      const [hira, rom] = item.split(':')
      const char = script === 'hiragana' ? hira : toKatakana(hira)
      return {
        id: `${script}:${char}`,
        char,
        romaji: rom.split(','),
        script,
        group: g.id,
      }
    }),
  }))
}

export const GROUPS: Record<Script, KanaGroup[]> = {
  hiragana: build('hiragana'),
  katakana: build('katakana'),
}

export const ALL_KANA: Kana[] = [...GROUPS.hiragana, ...GROUPS.katakana].flatMap((g) => g.kana)

/**
 * っ/ッ (konsonan rangkap) dan ー (vokal panjang). Bukan bagian dari pilihan huruf, statistik per baris, atau soal
 * acak, karena bacaannya mengikuti huruf lain; hanya dipakai di kata nyata. `romaji` di sini cuma label tampilan,
 * bacaan sebenarnya dihitung di `romajiAt` (lib/romaji).
 */
export const SPECIAL_KANA: Kana[] = [
  { id: 'hiragana:っ', char: 'っ', romaji: ['tsu kecil'], script: 'hiragana', group: 'special', special: 'sokuon' },
  { id: 'katakana:ッ', char: 'ッ', romaji: ['tsu kecil'], script: 'katakana', group: 'special', special: 'sokuon' },
  { id: 'hiragana:ー', char: 'ー', romaji: ['panjang'], script: 'hiragana', group: 'special', special: 'choon' },
  { id: 'katakana:ー', char: 'ー', romaji: ['panjang'], script: 'katakana', group: 'special', special: 'choon' },
]

export const KANA_BY_ID: Record<string, Kana> = Object.fromEntries([...ALL_KANA, ...SPECIAL_KANA].map((k) => [k.id, k]))

export const SCRIPT_LABEL: Record<Script, string> = { hiragana: 'Hiragana', katakana: 'Katakana' }

export const KIND_LABEL: Record<KanaGroup['kind'], string> = {
  dasar: 'Dasar',
  dakuten: 'Dakuten & Handakuten',
  yoon: 'Yōon (gabungan)',
}

const TITLE_PREFIX = { dasar: 'Baris', dakuten: 'Bersuara', yoon: 'Gabungan' } as const
export const groupTitle = (g: KanaGroup) => `${TITLE_PREFIX[g.kind]} ${g.label}`
