import { useEffect, useRef, useState } from 'react'
import type { StrokeData } from '../lib/strokes'

const SPEED = 1.1 // goresan per detik
const ease = (p: number) => p * p * (3 - 2 * p)

/** papan kotak 109×109 dengan garis bantu tengah */
export function Grid() {
  return (
    <>
      <rect x="1" y="1" width="107" height="107" fill="none" stroke="#4d3727" strokeWidth="1" />
      <path d="M54.5 1V108M1 54.5H108" stroke="#4d3727" strokeWidth="0.6" strokeDasharray="3 3" />
    </>
  )
}

export default function StrokeAnimator({ data }: { data: StrokeData }) {
  const count = data.s.length
  const reduced = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches
  const [t, setT] = useState(reduced ? count : 0)
  const [playing, setPlaying] = useState(!reduced)
  const tRef = useRef(t)
  const last = useRef(0)

  useEffect(() => {
    if (!playing) return
    last.current = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last.current) / 1000)
      last.current = now
      tRef.current = Math.min(count + 0.6, tRef.current + dt * SPEED)
      setT(tRef.current)
      if (tRef.current >= count + 0.6) return setPlaying(false)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing, count])

  const jump = (v: number, play = false) => {
    tRef.current = v
    setT(v)
    setPlaying(play)
  }
  const toggle = () => (playing ? setPlaying(false) : jump(t >= count ? 0 : t, true))
  const shown = Math.min(t, count)

  return (
    <div>
      <svg viewBox="0 0 109 109" className="mx-auto aspect-square w-full max-w-sm rounded-lg bg-[#120c09]" role="img" aria-label="Animasi urutan goresan">
        <Grid />
        {data.s.map((d, i) => (
          <path key={`g${i}`} d={d} fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
        {data.s.map((d, i) => {
          const p = Math.min(1, Math.max(0, shown - i))
          if (p <= 0) return null
          const active = p < 1 || (i === count - 1 ? false : Math.floor(shown) === i)
          return (
            <path
              key={i}
              d={d}
              pathLength={1}
              fill="none"
              stroke={active ? '#ff4d5e' : '#ece6da'}
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="1"
              strokeDashoffset={1 - ease(p)}
            />
          )
        })}
        {data.n.map(([x, y], i) =>
          shown > i + 0.05 ? (
            <g key={`n${i}`}>
              <circle cx={x} cy={y} r="4.2" fill="#d62839" />
              <text x={x} y={y + 2.1} textAnchor="middle" fontSize="6" fontWeight="700" fill="#fff">
                {i + 1}
              </text>
            </g>
          ) : null,
        )}
      </svg>

      <div className="mx-auto mt-4 grid max-w-sm grid-cols-3 gap-2 sm:grid-cols-4">
        <button className="btn btn-ghost btn-sm col-span-3 w-full sm:order-first sm:col-span-1" onClick={() => jump(0, true)}>
          Ulang
        </button>
        <button className="btn btn-ghost btn-sm w-full whitespace-nowrap !px-2" onClick={() => jump(Math.max(0, Math.ceil(t - 0.001) - 1))}>
          ‹ Mundur
        </button>
        <button className="btn btn-red btn-sm w-full" onClick={toggle}>
          {playing ? 'Jeda' : 'Putar'}
        </button>
        <button className="btn btn-ghost btn-sm w-full whitespace-nowrap !px-2" onClick={() => jump(Math.min(count, Math.floor(t + 0.001) + 1))}>
          Maju ›
        </button>
      </div>
      <p className="mt-2 text-center text-sm text-[#b9a782]">
        Goresan {Math.min(count, Math.max(1, Math.ceil(shown)))} dari {count}
      </p>
    </div>
  )
}

/** gambar satu langkah (goresan terbaru merah, bernomor); sisa goresan tampil redup sebagai petunjuk */
function StepSvg({ data, i, ghost = false, className = '' }: { data: StrokeData; i: number; ghost?: boolean; className?: string }) {
  const big = ghost // versi besar memakai garis dan nomor yang lebih proporsional
  return (
    <svg viewBox="0 0 109 109" className={`aspect-square w-full rounded bg-[#120c09] ${className}`} aria-hidden>
      <Grid />
      {ghost &&
        data.s.slice(i + 1).map((d, j) => (
          <path key={`g${j}`} d={d} fill="none" stroke="#fff" strokeOpacity="0.1" strokeWidth="4.5" strokeLinecap="round" strokeLinejoin="round" />
        ))}
      {data.s.slice(0, i + 1).map((d, j) => (
        <path
          key={j}
          d={d}
          fill="none"
          stroke={j === i ? '#ff4d5e' : '#ece6da'}
          strokeWidth={big ? 4.5 : 5.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
      <circle cx={data.n[i][0]} cy={data.n[i][1]} r={big ? 5 : 7} fill="#d62839" />
      <text x={data.n[i][0]} y={data.n[i][1] + (big ? 2.6 : 3.6)} textAnchor="middle" fontSize={big ? 7 : 10} fontWeight="800" fill="#fff">
        {i + 1}
      </text>
    </svg>
  )
}

/** deretan langkah: huruf terbentuk goresan demi goresan. Jika onPick ada, tiap gambar bisa diketuk untuk diperbesar. */
export function StrokeSteps({ data, onPick }: { data: StrokeData; onPick?: (i: number) => void }) {
  return (
    <ol className="flex gap-1.5">
      {data.s.map((_, i) => (
        <li key={i} className="min-w-0 max-w-[96px] flex-1">
          {onPick ? (
            <button
              type="button"
              onClick={() => onPick(i)}
              aria-label={`Lihat langkah ${i + 1} lebih besar`}
              className="block w-full cursor-zoom-in rounded transition hover:brightness-125 focus-visible:outline-2 focus-visible:outline-sharin"
            >
              <StepSvg data={data} i={i} />
            </button>
          ) : (
            <StepSvg data={data} i={i} />
          )}
        </li>
      ))}
    </ol>
  )
}

/** semua langkah sekaligus dalam ukuran besar, supaya urutannya terlihat jelas dalam satu pandangan */
export function StepsGrid({ data }: { data: StrokeData }) {
  const n = data.s.length
  return (
    <ol className={`grid gap-3 ${n <= 3 ? 'grid-cols-3' : 'grid-cols-2 sm:grid-cols-3'}`}>
      {data.s.map((_, i) => (
        <li key={i} className="text-center">
          <StepSvg data={data} i={i} ghost className="border border-[#4d3727]" />
          <span className="mt-1.5 block text-sm font-bold text-[#cdb88f]">Langkah {i + 1}</span>
        </li>
      ))}
    </ol>
  )
}
