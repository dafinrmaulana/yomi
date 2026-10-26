interface Props {
  /** 0–3 tomoe, 4 = Mangekyō */
  level?: number
  size?: number
  spin?: boolean
  className?: string
}

const TOMOE = 'M -0.15 0 C -0.2 -0.25 0.05 -0.4 0.3 -0.3 C 0.12 -0.28 0.1 -0.12 0.15 0 Z'
const BLADE = 'M 0 -0.1 C 0.32 -0.28 0.58 -0.5 0.42 -0.86 C 0.14 -0.62 -0.12 -0.46 -0.2 -0.18 Z'

export const sharinganLevel = (combo: number) =>
  combo >= 15 ? 4 : combo >= 10 ? 3 : combo >= 6 ? 2 : combo >= 3 ? 1 : 0

export default function Sharingan({ level = 3, size = 40, spin = true, className = '' }: Props) {
  const mangekyo = level >= 4
  const tomoe = mangekyo ? 0 : level
  return (
    <svg
      viewBox="-1 -1 2 2"
      width={size}
      height={size}
      className={className}
      style={mangekyo ? { animation: 'glow-pulse 1.6s ease-in-out infinite' } : undefined}
      aria-hidden
    >
      <defs>
        <radialGradient id={`iris-${mangekyo ? 'm' : 's'}`}>
          <stop offset="0.3" stopColor="#ff4d5e" />
          <stop offset="0.75" stopColor="#d62839" />
          <stop offset="1" stopColor="#8f1623" />
        </radialGradient>
      </defs>
      <circle r="0.97" fill="#050507" />
      <circle r="0.9" fill={`url(#iris-${mangekyo ? 'm' : 's'})`} />
      <g className={spin ? 'animate-spin-slow' : ''} style={{ transformOrigin: 'center' }}>
        {mangekyo ? (
          <g fill="#050507">
            {[0, 120, 240].map((a) => (
              <path key={a} d={BLADE} transform={`rotate(${a})`} />
            ))}
          </g>
        ) : (
          <>
            <circle r="0.6" fill="none" stroke="#050507" strokeWidth="0.05" />
            {Array.from({ length: tomoe }, (_, i) => (
              <g key={i} transform={`rotate(${i * (360 / Math.max(tomoe, 1))}) translate(0 -0.6)`}>
                <circle r="0.15" fill="#050507" />
                <path d={TOMOE} fill="#050507" />
              </g>
            ))}
          </>
        )}
      </g>
      <circle r={mangekyo ? 0.14 : 0.2} fill="#050507" />
    </svg>
  )
}
