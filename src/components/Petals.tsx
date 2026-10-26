import { useMemo } from 'react'

/** kelopak sakura jatuh pelan sebagai latar */
export default function Petals({ count = 14 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: Math.random() * 100,
        size: 8 + Math.random() * 10,
        dur: 14 + Math.random() * 16,
        delay: -Math.random() * 30,
        drift: (Math.random() - 0.3) * 240,
        hue: i % 3 === 0 ? '#d62839' : '#c9566f',
      })),
    [count],
  )
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden" aria-hidden>
      {petals.map((p, i) => (
        <span
          key={i}
          className="absolute top-0 block opacity-0"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 0.75,
            background: p.hue,
            borderRadius: '150% 0 150% 0',
            filter: 'blur(0.3px)',
            animation: `petal ${p.dur}s linear ${p.delay}s infinite`,
            ['--drift' as string]: `${p.drift}px`,
          }}
        />
      ))}
    </div>
  )
}
