import { useRef, useState, type PointerEvent } from 'react'
import { checkStrokes, cleanStrokes, type CheckResult, type Pt, type StrokeStatus } from '../lib/strokeCheck'
import type { StrokeData } from '../lib/strokes'
import { Grid } from './StrokeAnimator'

function toPath(pts: Pt[]) {
  if (pts.length === 1) return `M${pts[0][0]} ${pts[0][1]}l0.01 0`
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2
    const my = (pts[i][1] + pts[i + 1][1]) / 2
    d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`
  }
  const l = pts[pts.length - 1]
  return d + `L${l[0].toFixed(1)} ${l[1].toFixed(1)}`
}

const CHIP: Record<StrokeStatus, string> = {
  ok: 'benar',
  reversed: 'arah terbalik',
  order: 'urutan keliru',
  shape: 'bentuk kurang tepat',
  extra: 'berlebih',
}

interface Props {
  data: StrokeData
  onPass: () => void
  /** huruf ini sudah pernah ditulis benar (tidak ada XP lagi) */
  done: boolean
  xp: number
}

/**
 * Kanvas latihan menulis. Pemeriksaan dilakukan di browser dengan pencocokan geometri
 * (bentuk, arah, urutan) terhadap data KanjiVG, jadi tidak memakai AI maupun server.
 */
export default function DrawPad({ data, onPass, done, xp }: Props) {
  const [strokes, setStrokes] = useState<Pt[][]>([])
  const [cur, setCur] = useState<Pt[] | null>(null)
  const [ghost, setGhost] = useState(true)
  const [result, setResult] = useState<CheckResult | null>(null)
  const ref = useRef<SVGSVGElement>(null)
  const locked = result !== null

  const point = (e: PointerEvent): Pt => {
    const r = ref.current!.getBoundingClientRect()
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
    if (cur) setStrokes((s) => [...s, cur])
    setCur(null)
  }

  const check = () => {
    const r = checkStrokes(strokes, data.s)
    setResult(r)
    if (r.ok) onPass()
  }
  const reset = () => {
    setStrokes([])
    setCur(null)
    setResult(null)
  }

  // warna per goresan setelah diperiksa (goresan yang terbuang karena terlalu pendek tetap redup)
  let k = 0
  const colorOf = (pts: Pt[]) => {
    if (!result) return '#f3e7cf'
    if (!cleanStrokes([pts]).length) return '#8f7f66'
    return result.strokes[k++]?.status === 'ok' ? '#3ccf7a' : '#ff4d5e'
  }

  return (
    <div>
      <svg
        ref={ref}
        viewBox="0 0 109 109"
        className={`mx-auto aspect-square w-full max-w-sm select-none rounded-lg bg-[#120c09] ${locked ? '' : 'cursor-crosshair'}`}
        style={{ touchAction: 'none' }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerCancel={up}
        role="img"
        aria-label="Kanvas latihan menulis"
      >
        <Grid />
        {(ghost || locked) &&
          data.s.map((d, i) => (
            <path key={i} d={d} fill="none" stroke="#fff" strokeOpacity="0.13" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
          ))}
        {[...strokes, ...(cur ? [cur] : [])].map((pts, i) => (
          <path key={i} d={toPath(pts)} fill="none" stroke={colorOf(pts)} strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      </svg>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {locked ? (
          <button className="btn btn-red btn-sm" onClick={reset}>
            Coba lagi
          </button>
        ) : (
          <button className="btn btn-red btn-sm" disabled={!strokes.length} onClick={check}>
            Periksa
          </button>
        )}
        <button className="btn btn-ghost btn-sm" disabled={locked || !strokes.length} onClick={() => setStrokes((s) => s.slice(0, -1))}>
          Urungkan
        </button>
        <button className="btn btn-ghost btn-sm" disabled={!strokes.length && !locked} onClick={reset}>
          Hapus
        </button>
        <button className="btn btn-ghost btn-sm" aria-pressed={ghost} onClick={() => setGhost((g) => !g)}>
          Bayangan: {ghost ? 'nyala' : 'mati'}
        </button>
      </div>

      {result ? (
        <div
          role="status"
          className={`mx-auto mt-5 max-w-sm rounded-lg border p-4 ${result.ok ? 'border-ok/60 bg-ok/10' : 'border-sharin/60 bg-sharin/10'}`}
        >
          <p className={`font-display text-xl font-extrabold ${result.ok ? 'text-ok' : 'text-sharin-glow'}`}>{result.ok ? 'Benar!' : 'Belum tepat'}</p>
          <p className="mt-1 text-sm text-bone">{result.summary}</p>
          {result.ok && !done && <p className="mt-1 text-sm font-bold text-gold">+{xp} XP</p>}
          {result.strokes.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {result.strokes.map((s, i) => (
                <li
                  key={i}
                  className={`rounded px-2 py-0.5 text-xs font-semibold ${s.status === 'ok' ? 'bg-ok/20 text-ok' : 'bg-sharin/25 text-sharin-glow'}`}
                >
                  {i + 1}: {CHIP[s.status]}
                </li>
              ))}
            </ul>
          )}
          <p className="mt-3 text-xs text-[#8f7f66]">Pemeriksaan membandingkan bentuk, arah, dan urutan goresan; hasilnya berupa perkiraan.</p>
        </div>
      ) : (
        <p className="mt-2 text-center text-sm text-[#b9a782]">Tulis hurufnya, lalu tekan Periksa.</p>
      )}
    </div>
  )
}
