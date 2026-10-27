import { GROUPS, KANA_BY_ID, groupTitle, type Kana, type Script } from './kana'
import { slowMs } from './quiz'
import type { FreeSettings, QuizMode, SpeedStat } from './storage'

type Stats = Record<string, { r: number; w: number }>

export type AdviceAction =
  | { kind: 'length'; value: number; label: string }
  | { kind: 'mode'; value: QuizMode; label: string }
  | { kind: 'letters'; ids: string[]; replace: boolean; label: string }

export interface Advice {
  /** berubah saat pengaturan berubah, dipakai untuk mengingat saran yang sudah ditutup */
  key: string
  title: string
  body: string
  actions: AdviceAction[]
}

const MAX_LENGTH = 6
/** jumlah huruf terlemah yang diuji */
const SAMPLE = 8
const MIN_ACC = 0.9
/** minimal jawaban per huruf sebelum dinilai */
const MIN_ATTEMPTS = 3

export function applyAction(s: FreeSettings, a: AdviceAction): FreeSettings {
  if (a.kind === 'length') return { ...s, mode: 'combined', length: a.value }
  if (a.kind === 'mode') return { ...s, mode: a.value }
  return { ...s, selected: a.replace ? a.ids : [...new Set([...s.selected, ...a.ids])] }
}

interface Rated {
  k: Kana
  n: number
  acc: number
  slow: boolean
  /** makin besar makin butuh latihan */
  need: number
}

/** grup huruf berikutnya yang layak ditambahkan: yang belum disentuh dulu, lalu yang belum lengkap */
function nextGroup(selected: Set<string>, firstScript: Script) {
  const order: Script[] = firstScript === 'hiragana' ? ['hiragana', 'katakana'] : ['katakana', 'hiragana']
  const groups = order.flatMap((s) => GROUPS[s]).filter((g) => g.kana.some((k) => !selected.has(k.id)))
  return groups.find((g) => g.kana.every((k) => !selected.has(k.id))) ?? groups[0]
}

/**
 * Saran latihan. Yang diuji adalah sampel huruf terlemah (belum dilatih, sering salah, atau lambat),
 * bukan sembarang soal: kalau huruf tersulit sudah lancar, sisanya pasti ikut lancar.
 * - Naik level: tiap huruf sampel punya >= 3 jawaban, akurasi >= 90%, dan tidak lambat.
 * - Fokus: sebagian huruf masih sering salah atau lambat.
 */
export function adviceFor(
  s: Pick<FreeSettings, 'mode' | 'length' | 'selected' | 'direction'>,
  stats: Stats,
  speed: Record<string, SpeedStat>,
): Advice[] {
  const limit = slowMs(s.direction)
  const rated: Rated[] = []
  for (const id of s.selected) {
    const k = KANA_BY_ID[id]
    if (!k) continue
    const st = stats[id] ?? { r: 0, w: 0 }
    const n = st.r + st.w
    const recent = speed[id]?.recent
    const avg = recent?.length ? recent.reduce((a, b) => a + b, 0) / recent.length : 0
    const acc = n ? st.r / n : 0
    const slow = avg > limit
    rated.push({ k, n, acc, slow, need: (n < MIN_ATTEMPTS ? 2 : 0) + (1 - acc) + (slow ? 1 : 0) })
  }
  if (rated.length === 0) return []

  const sample = [...rated].sort((a, b) => b.need - a.need).slice(0, SAMPLE)
  const key = `${s.mode}|${s.length}|${s.selected.length}`
  const out: Advice[] = []

  const passed = sample.every((r) => r.n >= MIN_ATTEMPTS && r.acc >= MIN_ACC && !r.slow)

  if (passed) {
    const actions: AdviceAction[] = []
    if (s.mode === 'single') actions.push({ kind: 'mode', value: 'combined', label: 'Coba gabungan' })
    else if (s.length < MAX_LENGTH) actions.push({ kind: 'length', value: s.length + 1, label: `Naikkan ke ${s.length + 1} huruf` })
    const g = nextGroup(new Set(s.selected), rated[0].k.script)
    if (g) actions.push({ kind: 'letters', ids: g.kana.map((k) => k.id), replace: false, label: `Tambah ${groupTitle(g)}` })
    if (actions.length) {
      out.push({
        key: `up|${key}`,
        title: s.mode === 'single' ? 'Per huruf sudah lancar' : `Sudah lancar di ${s.length} huruf gabungan`,
        body: `Huruf yang paling sulit buatmu (${sample
          .slice(0, 4)
          .map((r) => r.k.char)
          .join(', ')}${sample.length > 4 ? ', …' : ''}) sudah dibaca tepat dan cepat. Saatnya naik level.`,
        actions,
      })
    }
    return out
  }

  // fokus: cukup banyak huruf yang sudah dicoba tapi masih goyah
  const tried = rated.filter((r) => r.n >= MIN_ATTEMPTS)
  const weak = tried.filter((r) => r.acc < 0.8 || r.slow).sort((a, b) => a.acc - b.acc)
  if (tried.length >= 3 && weak.length / tried.length >= 0.3) {
    const worst = weak.slice(0, SAMPLE)
    const actions: AdviceAction[] = []
    if (s.mode === 'combined') actions.push({ kind: 'mode', value: 'single', label: 'Latihan per huruf' })
    const same = worst.length === s.selected.length && worst.every((r) => s.selected.includes(r.k.id))
    if (!same) actions.push({ kind: 'letters', ids: worst.map((r) => r.k.id), replace: true, label: 'Fokus ke huruf ini' })
    out.push({
      key: `focus|${key}`,
      title: 'Beberapa huruf masih goyah',
      body: `${worst
        .slice(0, 4)
        .map((r) => r.k.char)
        .join(', ')} masih sering salah atau lambat dibaca. Latihan khusus huruf ini akan membantu.`,
      actions,
    })
  }
  return out
}
