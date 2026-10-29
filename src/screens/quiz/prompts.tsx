import { SCRIPT_LABEL } from '../../lib/kana'
import { promptRomaji, type Question } from '../../lib/quiz'

const MOBILE_ROW = 6

/**
 * Soal arah baca. Kata nyata ditata per kata (baris hanya putus di antara kata). Rangkaian acak yang panjang
 * dipotong per enam huruf di layar kecil dengan nomor baris, supaya urutan bacanya jelas: kiri ke kanan, atas ke bawah.
 */
export function KanaPrompt({ seq, words, size }: { seq: Question['seq']; words?: Question['words']; size: string }) {
  const base = `font-jp font-black leading-tight text-glow ${size}`
  const spacing = { letterSpacing: seq.length > 1 ? '0.12em' : undefined }
  const chars = seq.map((k) => k.char)

  if (words) {
    const starts = words.map((_, i) => words.slice(0, i).reduce((a, x) => a + x.len, 0))
    return (
      <div className={`flex flex-wrap justify-start gap-x-5 gap-y-1 text-left sm:justify-center ${base}`} style={spacing}>
        {words.map((w, i) => {
          const t = chars.slice(starts[i], starts[i] + w.len).join('')
          return (
            <span key={i} className="whitespace-nowrap">
              {t}
            </span>
          )
        })}
      </div>
    )
  }

  if (seq.length <= MOBILE_ROW) {
    return (
      <span className={`text-left ${base}`} style={spacing}>
        {chars.join('')}
      </span>
    )
  }
  const rows = Array.from({ length: Math.ceil(chars.length / MOBILE_ROW) }, (_, i) => chars.slice(i * MOBILE_ROW, (i + 1) * MOBILE_ROW).join(''))
  return (
    <>
      <div className="flex flex-col gap-1 sm:hidden">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-center text-[11px] font-bold tabular-nums text-mute" aria-hidden>
              {i + 1}
            </span>
            <span className={`text-left ${base}`} style={spacing}>
              {r}
            </span>
          </div>
        ))}
      </div>
      <span className={`hidden text-left sm:inline ${base}`} style={spacing}>
        {chars.join('')}
      </span>
    </>
  )
}

/** soal arah tulis: romaji tiap huruf, plus label skrip supaya jelas hiragana atau katakana */
export function RomajiPrompt({ seq, words }: { seq: Question['seq']; words?: Question['words'] }) {
  const scripts = new Set(seq.map((k) => k.script))
  const mixed = scripts.size > 1
  const groups = (words ?? seq.map(() => ({ len: 1 }))).map((w, i, all) => ({ len: w.len, from: all.slice(0, i).reduce((a, x) => a + x.len, 0) }))
  const size =
    seq.length > 12 ? 'text-xl sm:text-2xl' : seq.length > 8 ? 'text-2xl sm:text-3xl' : seq.length > 3 ? 'text-3xl sm:text-4xl' : seq.length > 1 ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl'
  return (
    <div className="flex flex-col items-center gap-2">
      {!mixed && (
        <span className="rounded bg-black/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#cdb88f]">
          {SCRIPT_LABEL[seq[0].script]}
        </span>
      )}
      <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-2">
        {groups.map((g, gi) => (
          // kata nyata/kalimat: huruf satu kata dirapatkan, antar-kata diberi jarak lebih lebar
          <span key={gi} className={`flex items-end ${words ? 'gap-2' : ''}`}>
            {seq.slice(g.from, g.from + g.len).map((k, i) => (
              <span key={i} className="flex flex-col items-center">
                <span className={`font-black leading-none tracking-wide text-glow ${size}`}>{promptRomaji(k)}</span>
                {mixed && <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-mute">{SCRIPT_LABEL[k.script]}</span>}
              </span>
            ))}
          </span>
        ))}
      </div>
    </div>
  )
}
