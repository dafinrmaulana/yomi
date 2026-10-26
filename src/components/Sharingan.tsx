import { useId } from 'react'

interface Props {
  /** 0–3 tomoe, 4 = Mangekyō */
  level?: number
  size?: number
  spin?: boolean
  className?: string
}

// tomoe: kepala bulat + ekor melengkung (bentuk asli), diperkecil agar utuh di dalam iris
const TOMOE = 'M -0.15 0 C -0.2 -0.25 0.05 -0.4 0.3 -0.3 C 0.12 -0.28 0.1 -0.12 0.15 0 Z'
const RING = 0.5
const TOMOE_SCALE = 0.7
// cincin putus-putus: 16 ruas, tiap ruas 60% dan celah 40%
const RING_DASH = ((2 * Math.PI * RING) / 16) * 0.6 + ' ' + ((2 * Math.PI * RING) / 16) * 0.4

const BLADE = 'M -0.2 -0.08 C -0.38 -0.46 -0.2 -0.78 0.36 -0.9 C 0.05 -0.68 0.06 -0.4 0.2 -0.1 Z'

/** combo 0–2: 1 tomoe, 3–5: 2, 6–9: 3, 10+: Mangekyō */
export const sharinganLevel = (combo: number) => (combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1)

/** gambar mata dalam koordinat satuan (radius 1, pusat 0,0); dipakai ikon dan bulan latar */
export function SharinganArt({ level, spin = true }: { level: number; spin?: boolean }) {
  const uid = useId().replace(/:/g, '')
  const gid = `iris-${uid}`
  const mangekyo = level >= 4
  const tomoe = mangekyo ? 0 : level
  return (
    <>
      <defs>
        <radialGradient id={gid}>
          <stop offset="0.3" stopColor="#ff4d5e" />
          <stop offset="0.75" stopColor="#d62839" />
          <stop offset="1" stopColor="#8f1623" />
        </radialGradient>
      </defs>
      <circle r="0.97" fill="#050507" />
      <circle r="0.9" fill={`url(#${gid})`} />
      <g>
        {spin && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            from="0 0 0"
            // tomoe dan Mangekyō berputar berlawanan arah jarum jam
            to="-360 0 0"
            dur="14s"
            repeatCount="indefinite"
          />
        )}
        {mangekyo ? (
          <>
            <g fill="#050507">
              <circle r="0.3" />
              {[0, 120, 240].map((a) => (
                <path key={a} d={BLADE} transform={`rotate(${a})`} />
              ))}
            </g>
            <circle r="0.18" fill="#c1202f" />
          </>
        ) : (
          <>
            <circle r={RING} fill="none" stroke="#050507" strokeWidth="0.045" strokeDasharray={RING_DASH} />
            {Array.from({ length: tomoe }, (_, i) => (
              <g key={i} transform={`rotate(${i * (360 / tomoe)}) translate(0 ${-RING}) scale(${TOMOE_SCALE})`}>
                <circle r="0.15" fill="#050507" />
                <path d={TOMOE} fill="#050507" />
              </g>
            ))}
          </>
        )}
      </g>
      <circle r={mangekyo ? 0.09 : 0.16} fill="#050507" />
    </>
  )
}

export default function Sharingan({ level = 3, size = 40, spin = true, className = '' }: Props) {
  const mangekyo = level >= 4
  return (
    <svg
      viewBox="-1 -1 2 2"
      width={size}
      height={size}
      className={className}
      style={mangekyo ? { overflow: 'visible', animation: 'glow-pulse 1.6s ease-in-out infinite' } : { overflow: 'visible' }}
      aria-hidden
    >
      <SharinganArt level={level} spin={spin} />
    </svg>
  )
}
