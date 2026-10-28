import { useId } from 'react'
import type { Mangekyo } from '../lib/eye'
import itachi from '../assets/mangekyo/itachi.webp'
import obito from '../assets/mangekyo/obito.webp'
import sasuke from '../assets/mangekyo/sasuke.webp'
import shisui from '../assets/mangekyo/shisui.webp'

/** gambar Mangekyō per pemilik dan arah putarnya: -1 melawan arah jarum jam, 1 searah jarum jam */
const MANGEKYO_ART: Record<Mangekyo, { src: string; dir: 1 | -1 }> = {
  itachi: { src: itachi, dir: -1 },
  shisui: { src: shisui, dir: -1 },
  obito: { src: obito, dir: -1 },
  sasuke: { src: sasuke, dir: 1 },
}

interface Props {
  /** 1–3 tomoe, 4 = Mangekyō, 5 = Rinnegan, 6 = Rinnegan bertomoe (saran naik level sudah muncul) */
  level?: number
  /** Mangekyō milik siapa (level 4) */
  variant?: Mangekyo
  /** Mangekyō menyala berdenyut: tinggal satu kesempatan lagi sebelum gagal */
  pulse?: boolean
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

/** Rinnegan: iris ungu dengan cincin gelombang; bertomoe (Rinne-Sharingan) bila `tomoe` */
function RinneganArt({ tomoe, spin, gid }: { tomoe: boolean; spin: boolean; gid: string }) {
  return (
    <>
      <circle r="0.9" fill={`url(#${gid})`} />
      <g fill="none" stroke="#1a1030" strokeWidth="0.035">
        {[0.26, 0.42, 0.58, 0.74, 0.88].map((r) => (
          <circle key={r} r={r} />
        ))}
      </g>
      {tomoe && (
        <g>
          {spin && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to="-360 0 0" dur="20s" repeatCount="indefinite" />}
          {[
            { r: 0.37, s: 0.42 },
            { r: 0.54, s: 0.42 },
            { r: 0.71, s: 0.42 },
          ].map((ring, ri) =>
            [0, 1, 2].map((i) => (
              <g key={`${ri}-${i}`} transform={`rotate(${i * 120 + ri * 40}) translate(0 ${-ring.r}) scale(${ring.s})`}>
                <circle r="0.15" fill="#0c0618" />
                <path d={TOMOE} fill="#0c0618" />
              </g>
            )),
          )}
        </g>
      )}
      <circle r="0.1" fill="#0c0618" />
    </>
  )
}

/** gambar mata dalam koordinat satuan (radius 1, pusat 0,0); dipakai ikon dan bulan latar */
export function SharinganArt({ level, spin = true, variant = 'itachi' }: { level: number; spin?: boolean; variant?: Mangekyo }) {
  const uid = useId().replace(/:/g, '')
  const gid = `iris-${uid}`
  const rinne = level >= 5
  const tomoe = level >= 4 ? 0 : level
  if (level === 4) {
    const art = MANGEKYO_ART[variant]
    return (
      <image href={art.src} x="-0.97" y="-0.97" width="1.94" height="1.94">
        {spin && <animateTransform attributeName="transform" type="rotate" from="0 0 0" to={`${art.dir * 360} 0 0`} dur="14s" repeatCount="indefinite" />}
      </image>
    )
  }
  if (rinne) {
    return (
      <>
        <defs>
          <radialGradient id={gid}>
            <stop offset="0.2" stopColor="#e4d9fa" />
            <stop offset="0.65" stopColor="#a58fd6" />
            <stop offset="1" stopColor="#5a438f" />
          </radialGradient>
        </defs>
        <circle r="0.97" fill="#07040f" />
        <RinneganArt tomoe={level >= 6} spin={spin} gid={gid} />
      </>
    )
  }
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
<circle r={RING} fill="none" stroke="#050507" strokeWidth="0.045" strokeDasharray={RING_DASH} />
          {Array.from({ length: tomoe }, (_, i) => (
            <g key={i} transform={`rotate(${i * (360 / tomoe)}) translate(0 ${-RING}) scale(${TOMOE_SCALE})`}>
              <circle r="0.15" fill="#050507" />
              <path d={TOMOE} fill="#050507" />
            </g>
          ))}
      </g>
      <circle r="0.16" fill="#050507" />
    </>
  )
}

export default function Sharingan({ level = 3, variant, pulse, size = 40, spin = true, className = '' }: Props) {
  const mangekyo = level === 4
  return (
    <svg
      viewBox="-1 -1 2 2"
      width={size}
      height={size}
      className={className}
      style={mangekyo ? { overflow: 'visible', animation: `glow-pulse ${pulse ? 0.7 : 1.6}s ease-in-out infinite` } : { overflow: 'visible' }}
      aria-hidden
    >
      <SharinganArt level={level} spin={spin} variant={variant} />
    </svg>
  )
}
