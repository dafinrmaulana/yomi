import { useImperativeHandle, useRef, useState, type PointerEvent, type Ref } from 'react'
import type { Kana } from '../lib/kana'
import { checkStrokes, cleanStrokes, type CheckResult, type Pt } from '../lib/strokeCheck'
import type { StrokeData } from '../lib/strokes'
import { toPath } from './DrawPad'
import { Grid } from './StrokeAnimator'

export interface DrawAnswerHandle {
  /** periksa huruf yang sedang ditulis */
  check: () => void
  /** lewati soal; dihitung salah mulai huruf yang sedang ditulis */
  skip: () => void
}

interface Props {
  seq: Kana[]
  strokes: Record<string, StrokeData>
  /** soal sudah dinilai */
  locked: boolean
  /** jumlah goresan di kanvas berubah (untuk tombol Periksa) */
  onDraw: (count: number) => void
  /** ok = semua huruf benar; prefix = jumlah huruf (kana) yang benar sebelum salah */
  onFinish: (ok: boolean, prefix: number) => void
  ref?: Ref<DrawAnswerHandle>
}

interface Glyph {
  char: string
  /** indeks kana di soal (きゃ = 2 glyph, 1 kana) */
  kana: number
}

/**
 * Jawaban arah tulis: pengguna menulis setiap huruf Jepang secara berurutan di kanvas.
 * Tidak ada bayangan sebelum dinilai, supaya jawabannya tidak terlihat.
 */
export default function DrawAnswer({ seq, strokes, locked, onDraw, onFinish, ref }: Props) {
  const glyphs: Glyph[] = seq.flatMap((k, i) => [...k.char].map((char) => ({ char, kana: i })))
  const [idx, setIdx] = useState(0)
  const [lines, setLines] = useState<Pt[][]>([])
  const [cur, setCur] = useState<Pt[] | null>(null)
  const [result, setResult] = useState<CheckResult | null>(null)
  const [skipped, setSkipped] = useState(false)
  const svg = useRef<SVGSVGElement>(null)

  const glyph = glyphs[Math.min(idx, glyphs.length - 1)]
  const data = strokes[glyph.char]
  const passedAll = locked && result?.ok === true

  const setDrawn = (next: Pt[][]) => {
    setLines(next)
    onDraw(next.length)
  }

  useImperativeHandle(ref, () => ({
    check() {
      if (locked || !data || !lines.length) return
      const r = checkStrokes(lines, data.s)
      if (!r.ok) {
        setResult(r)
        onFinish(false, glyph.kana)
        return
      }
      if (idx === glyphs.length - 1) {
        setResult(r)
        onFinish(true, seq.length)
        return
      }
      setIdx(idx + 1)
      setDrawn([])
    },
    skip() {
      if (locked) return
      setSkipped(true)
      onFinish(false, glyph.kana)
    },
  }))

  const point = (e: PointerEvent): Pt => {
    const r = svg.current!.getBoundingClientRect()
    const clamp = (v: number) => Math.min(109, Math.max(0, v))
    return [clamp(((e.clientX - r.left) / r.width) * 109), clamp(((e.clientY - r.top) / r.height) * 109)]
  }
  const down = (e: PointerEvent) => {
    if (locked) return
    e.currentTarget.setPointerCapture(e.pointerId)
    setCur([point(e)])
  }
  const move = (e: PointerEvent) => cur && setCur((c) => (c ? [...c, point(e)] : c))
  const up = () => {
    if (cur) setDrawn([...lines, cur])
    setCur(null)
  }

  // warna goresan setelah dinilai: hijau benar, merah salah
  let k = 0
  const colorOf = (pts: Pt[]) => {
    if (!result || skipped) return '#f3e7cf'
    if (!cleanStrokes([pts]).length) return '#8f7f66'
    return result.strokes[k++]?.status === 'ok' ? '#3ccf7a' : '#ff4d5e'
  }

  return (
    <div className="mt-6 w-full max-w-xs">
      {glyphs.length > 1 && (
        <ol className="mb-3 flex flex-wrap justify-center gap-1.5" aria-label="Huruf yang sudah ditulis">
          {glyphs.map((g, i) => {
            const done = i < idx || passedAll
            const reveal = done || locked
            const wrong = locked && !passedAll && i >= idx
            return (
              <li
                key={i}
                className={`font-jp grid size-10 place-items-center rounded border-2 text-xl font-bold ${
                  done
                    ? 'border-ok/60 bg-ok/10 text-ok'
                    : wrong
                      ? 'border-sharin/60 bg-sharin/10 text-sharin-glow'
                      : i === idx
                        ? 'border-[#cdb88f] text-bone'
                        : 'border-[#3a2a20] text-mute'
                }`}
              >
                {reveal ? g.char : i === idx ? '✎' : '·'}
              </li>
            )
          })}
        </ol>
      )}

      <svg
        ref={svg}
        viewBox="0 0 109 109"
        className={`mx-auto aspect-square w-full select-none rounded-lg border-2 border-[#4d3727] bg-[#120c09]/90 ${
          locked ? '' : 'cursor-crosshair'
        }`}
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="img"
        aria-label={`Kanvas menulis huruf ke-${idx + 1}`}
      >
        <Grid />
        {/* bayangan huruf yang benar hanya muncul setelah dinilai salah */}
        {locked && !passedAll && data &&
          data.s.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        {[...lines, ...(cur ? [cur] : [])].map((pts, i) => (
          <path key={i} d={toPath(pts)} fill="none" stroke={colorOf(pts)} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>

      {locked ? (
        <p className="mt-2 min-h-5 text-center text-sm text-[#cdb88f]">
          {skipped ? 'Dilewati. Bayangan menunjukkan huruf yang benar.' : !passedAll && result ? result.summary : ''}
        </p>
      ) : (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <button className="btn btn-ghost btn-sm w-full" disabled={!lines.length} onClick={() => setDrawn(lines.slice(0, -1))}>
            Urungkan
          </button>
          <button className="btn btn-ghost btn-sm w-full" disabled={!lines.length} onClick={() => setDrawn([])}>
            Hapus
          </button>
        </div>
      )}
    </div>
  )
}
