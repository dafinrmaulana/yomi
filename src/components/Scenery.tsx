import { useId } from 'react'
import type { Mangekyo } from '../lib/eye'
import { SharinganArt } from './Sharingan'

const Pine = ({ x, y, s = 1 }: { x: number; y: number; s?: number }) => (
  <g transform={`translate(${x} ${y}) scale(${s})`} fill="#090508">
    <rect x="-4" y="-10" width="8" height="40" />
    <path d="M0 -150 L34 -80 L16 -80 L44 -30 L-44 -30 L-16 -80 L-34 -80 Z" />
    <path d="M0 -118 L40 -44 L-40 -44 Z" />
  </g>
)

const Pagoda = ({ x, y }: { x: number; y: number }) => (
  <g transform={`translate(${x} ${y})`} fill="#0b060a">
    <path d="M-70 0 Q0 -30 70 0 L90 40 L-90 40 Z" />
    {[0, 1, 2, 3, 4].map((i) => {
      const w = 62 - i * 9
      const top = -(i + 1) * 46
      return (
        <g key={i}>
          <rect x={-w + 8} y={top + 8} width={(w - 8) * 2} height="34" />
          <path d={`M${-w - 20} ${top + 12} Q${-w} ${top + 6} ${-w + 12} ${top - 4} L${w - 12} ${top - 4} Q${w} ${top + 6} ${w + 20} ${top + 12} Z`} />
        </g>
      )
    })}
    <rect x="-2" y="-300" width="4" height="46" />
    <circle cy="-262" r="5" />
  </g>
)

/** latar pemandangan Jepang malam: bulan merah, gunung, pagoda, torii, pinus */
export default function Scenery({
  className = '',
  moonLevel,
  moonVariant,
  moonPulse,
}: {
  className?: string
  moonLevel?: number
  moonVariant?: Mangekyo
  /** Mangekyō menyala berdenyut sebagai peringatan */
  moonPulse?: boolean
}) {
  const id = useId().replace(/:/g, '')
  return (
    <div
      className={`pointer-events-none fixed inset-0 z-0 overflow-hidden ${className}`}
      style={{ background: 'linear-gradient(#06060a 0%, #14080e 45%, #2f0e17 78%, #4a1420 100%)' }}
      aria-hidden
    >
      {moonLevel !== undefined && (
        // bulan = mata yang mengikuti combo; elemen terpisah supaya selalu terlihat di layar sempit
        <div className="absolute right-[7%] top-[11%] aspect-square w-[min(44vw,280px)]">
          <div
            className="absolute -inset-[70%]"
            style={{
              background: `radial-gradient(circle, ${moonLevel >= 5 ? 'rgba(150,120,230,0.4)' : 'rgba(214,40,57,0.4)'}, transparent 62%)`,
              animation: moonPulse ? 'eye-warn 0.8s ease-in-out infinite' : undefined,
            }}
          />
          <svg
            key={moonLevel}
            viewBox="-1 -1 2 2"
            className="animate-pop relative h-full w-full overflow-visible opacity-90"
            style={moonPulse ? { animation: 'pop 0.35s cubic-bezier(0.2, 1.6, 0.4, 1), glow-pulse 0.8s ease-in-out 0.35s infinite' } : undefined}
          >
            <SharinganArt level={moonLevel} variant={moonVariant} />
          </svg>
        </div>
      )}
      <svg viewBox="0 0 1600 760" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-full w-full">
        <defs>
          <radialGradient id={`moon${id}`} cx="0.4" cy="0.35" r="0.75">
            <stop offset="0" stopColor="#ff5566" />
            <stop offset="0.6" stopColor="#c1202f" />
            <stop offset="1" stopColor="#6e0f1b" />
          </radialGradient>
          <radialGradient id={`glow${id}`}>
            <stop offset="0" stopColor="#d62839" stopOpacity="0.42" />
            <stop offset="1" stopColor="#d62839" stopOpacity="0" />
          </radialGradient>
          <linearGradient id={`mist${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#ff8c9a" stopOpacity="0" />
            <stop offset="1" stopColor="#ff8c9a" stopOpacity="0.1" />
          </linearGradient>
          <filter id={`blur${id}`}>
            <feGaussianBlur stdDeviation="14" />
          </filter>
        </defs>

        {/* bulan merah (versi statis, untuk layar tanpa combo) */}
        {moonLevel === undefined && (
          <>
            <circle cx="1170" cy="230" r="330" fill={`url(#glow${id})`} />
            <circle cx="1170" cy="230" r="125" fill={`url(#moon${id})`} />
            <g fill="none" stroke="#2a0509" strokeOpacity="0.35" strokeWidth="3">
              <circle cx="1170" cy="230" r="46" />
              <circle cx="1170" cy="230" r="86" />
            </g>
          </>
        )}

        {/* awan melayang */}
        <g fill="#1d0b12" opacity="0.8" filter={`url(#blur${id})`}>
          <ellipse cx="300" cy="250" rx="220" ry="16" style={{ animation: 'drift 70s ease-in-out infinite alternate' }} />
          <ellipse cx="820" cy="330" rx="260" ry="14" style={{ animation: 'drift 90s ease-in-out infinite alternate-reverse' }} />
          <ellipse cx="1300" cy="410" rx="200" ry="12" style={{ animation: 'drift 80s ease-in-out infinite alternate' }} />
        </g>

        {/* pegunungan */}
        <path d="M0 560 L130 505 L260 540 L400 470 L540 530 L680 480 L820 535 L990 470 L1130 525 L1290 465 L1450 520 L1600 485 L1600 760 L0 760Z" fill="#1a0c13" />
        <path d="M250 640 C 430 540 520 400 650 360 C 700 346 740 346 790 360 C 920 400 1010 540 1190 640 Z" fill="#120911" />
        <path d="M628 380 L668 352 L772 352 L812 380 L770 392 L736 374 L712 396 L688 376 L660 392 Z" fill="#3a2230" opacity="0.7" />

        {/* kabut */}
        <rect x="0" y="520" width="1600" height="200" fill={`url(#mist${id})`} />

        {/* bukit, pagoda, torii */}
        <path d="M0 700 C 120 600 260 610 380 640 C 500 600 600 640 700 700 L0 760Z" fill="#0b060a" />
        <Pagoda x={250} y={640} />
        <g fill="#16070c">
          <path d="M1230 640 Q1370 612 1510 640 L1504 662 Q1370 636 1236 662 Z" />
          <rect x="1252" y="660" width="86" height="12" transform="translate(40 -14)" />
          <rect x="1262" y="650" width="18" height="120" />
          <rect x="1458" y="650" width="18" height="120" />
        </g>
        <path d="M900 690 C 1050 640 1200 660 1600 700 L1600 760 L900 760Z" fill="#0b060a" />

        {/* pinus */}
        <Pine x={70} y={720} s={1.5} />
        <Pine x={170} y={740} s={1.1} />
        <Pine x={1020} y={735} s={1.2} />
        <Pine x={1100} y={745} s={0.9} />
        <Pine x={1540} y={730} s={1.6} />

        <rect x="0" y="735" width="1600" height="25" fill="#070407" />
      </svg>
    </div>
  )
}
