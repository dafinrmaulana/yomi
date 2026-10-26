import { useMemo } from 'react'

const COLORS = ['#d62839', '#ff4d5e', '#e9b44c', '#ece6da', '#c9566f']

export default function Confetti({ count = 60 }: { count?: number }) {
  const bits = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        left: Math.random() * 100,
        w: 6 + Math.random() * 6,
        dur: 2.2 + Math.random() * 2,
        delay: Math.random() * 0.6,
        dx: (Math.random() - 0.5) * 200,
        rot: 360 + Math.random() * 720,
        color: COLORS[Math.floor(Math.random() * COLORS.length)],
      })),
    [count],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-50 overflow-hidden" aria-hidden>
      {bits.map((b, i) => (
        <span
          key={i}
          className="absolute -top-4 block"
          style={{
            left: `${b.left}%`,
            width: b.w,
            height: b.w * 1.6,
            background: b.color,
            animation: `confetti ${b.dur}s ease-in ${b.delay}s forwards`,
            ['--dx' as string]: `${b.dx}px`,
            ['--rot' as string]: `${b.rot}deg`,
          }}
        />
      ))}
    </div>
  )
}
