import { useState } from 'react'
import type { DayStat } from '../lib/storage'
import { dayKey } from '../lib/storage'

const WEEK = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min']

const level = (xp: number) => (xp <= 0 ? 0 : xp < 30 ? 1 : xp < 80 ? 2 : 3)
const TINT = ['bg-[#1a120d] text-[#8f7f66]', 'bg-sharin/25 text-bone', 'bg-sharin/50 text-white', 'bg-sharin text-white']

export default function Calendar({ days, onPick }: { days: Record<string, DayStat>; onPick: (key: string) => void }) {
  const now = new Date()
  const [cursor, setCursor] = useState({ y: now.getFullYear(), m: now.getMonth() })
  const today = dayKey()

  const first = new Date(cursor.y, cursor.m, 1)
  const lead = (first.getDay() + 6) % 7 // pekan dimulai Senin
  const total = new Date(cursor.y, cursor.m + 1, 0).getDate()
  const cells: (number | null)[] = [...Array(lead).fill(null), ...Array.from({ length: total }, (_, i) => i + 1)]
  const label = first.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })

  const move = (delta: number) => {
    const d = new Date(cursor.y, cursor.m + delta, 1)
    setCursor({ y: d.getFullYear(), m: d.getMonth() })
  }
  const monthXp = Object.entries(days)
    .filter(([k]) => k.startsWith(`${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}`))
    .reduce((a, [, v]) => a + v.xp, 0)

  return (
    <div>
      <div className="mb-3 flex items-center justify-between gap-3">
        <button className="btn btn-ghost btn-sm" onClick={() => move(-1)} aria-label="Bulan sebelumnya">
          ‹
        </button>
        <div className="text-center">
          <p className="font-display text-lg font-extrabold capitalize">{label}</p>
          <p className="text-xs text-[#b9a782]">{monthXp} XP bulan ini</p>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={() => move(1)} aria-label="Bulan berikutnya">
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-bold uppercase tracking-wider text-[#8f7f66]">
        {WEEK.map((w) => (
          <span key={w}>{w}</span>
        ))}
      </div>
      <div className="mt-1.5 grid grid-cols-7 gap-1.5">
        {cells.map((d, i) => {
          if (d === null) return <span key={`e${i}`} />
          const key = `${cursor.y}-${String(cursor.m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          const stat = days[key]
          const isToday = key === today
          return (
            <button
              key={key}
              onClick={() => onPick(key)}
              aria-label={`${d} ${label}${stat ? `, ${stat.xp} XP` : ', tidak ada latihan'}`}
              className={`grid aspect-square cursor-pointer place-items-center rounded-md text-sm font-bold transition hover:brightness-125 ${TINT[level(stat?.xp ?? 0)]} ${
                isToday ? 'ring-2 ring-gold' : ''
              }`}
            >
              {d}
            </button>
          )
        })}
      </div>

      <div className="mt-3 flex items-center justify-end gap-1.5 text-[11px] text-[#8f7f66]">
        sedikit
        {TINT.map((c, i) => (
          <span key={i} className={`size-3.5 rounded-sm ${c.split(' ')[0]}`} />
        ))}
        banyak
      </div>
    </div>
  )
}
