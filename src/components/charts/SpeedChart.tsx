import { useState } from 'react'
import { KANA_BY_ID } from '../../lib/kana'
import { slowMs } from '../../lib/quiz'
import { SPEED_PREVIEW } from '../../lib/tuning'
import type { SpeedStat } from '../../lib/storage'
import {ChartCard, Empty, MoreToggle, Table } from './shared'
import { TEXT_2 } from './helpers'


export function SpeedChart({ speed, direction = 'read' }: { speed: Record<string, SpeedStat>; direction?: 'read' | 'write' }) {
  const [hover, setHover] = useState<string | null>(null)
  const [open, setOpen] = useState(false)
  const limit = slowMs(direction) / 1000
  const rows = Object.entries(speed)
    .filter(([id, v]) => v.n >= 2 && KANA_BY_ID[id])
    .map(([id, v]) => ({ k: KANA_BY_ID[id], sec: v.ms / v.n / 1000, n: v.n }))
    .sort((a, b) => b.sec - a.sec)
    .slice(0, 10)
  const max = Math.max(limit * 1.3, ...rows.map((r) => r.sec))

  return (
    <ChartCard
      title="Huruf paling lambat dibaca"
      note="Rata-rata detik menjawab benar"
      table={
        <Table
          head={['Huruf', 'Bacaan', 'Rata-rata', 'Jawaban']}
          rows={rows.map((r) => [r.k.char, r.k.romaji[0], `${r.sec.toFixed(1)} dtk`, r.n])}
        />
      }
    >
      {rows.length === 0 ? (
        <Empty>Butuh minimal 2 jawaban benar per huruf untuk dihitung.</Empty>
      ) : (
        <>
        <div className="relative">
          {/* garis batas cepat */}
          <div className="pointer-events-none absolute inset-y-0 left-10 right-16">
            <div className="absolute inset-y-0 border-l border-bone/50" style={{ left: `${(limit / max) * 100}%` }}>
              <span className="absolute -top-0.5 left-1.5 whitespace-nowrap text-[10px] text-bone/70">
                batas cepat {limit.toFixed(1)}s
              </span>
            </div>
          </div>
          <ul className="space-y-2 pt-5">
            {(open ? rows : rows.slice(0, SPEED_PREVIEW)).map((r) => (
              <li
                key={r.k.id}
                className="flex cursor-default items-center gap-2 outline-none"
                tabIndex={0}
                aria-label={`${r.k.char} (${r.k.romaji[0]}): ${r.sec.toFixed(1)} detik dari ${r.n} jawaban`}
                onMouseEnter={() => setHover(r.k.id)}
                onMouseLeave={() => setHover((h) => (h === r.k.id ? null : h))}
                onFocus={() => setHover(r.k.id)}
                onBlur={() => setHover((h) => (h === r.k.id ? null : h))}
                onClick={() => setHover((h) => (h === r.k.id ? null : r.k.id))}
              >
                <span className="font-jp w-8 shrink-0 text-center text-xl font-bold">{r.k.char}</span>
                <div className="relative h-5 flex-1">
                  <div
                    className={`h-full rounded-r-[4px] bg-gold transition ${hover === r.k.id ? 'brightness-125' : ''}`}
                    style={{ width: `${Math.max((r.sec / max) * 100, 1)}%` }}
                  />
                  {hover === r.k.id && (
                    <div
                      className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md border border-edge bg-panel-2 px-2.5 py-1.5 text-xs shadow-lg"
                      style={{ left: `clamp(15%, ${Math.max((r.sec / max) * 100, 1)}%, 85%)` }}
                    >
                      <p className="font-bold">
                        <span className="font-jp text-base">{r.k.char}</span> · {r.k.romaji[0]}
                      </p>
                      <p className="text-gold">{r.sec.toFixed(1)} detik rata-rata</p>
                      <p className={TEXT_2}>dari {r.n} jawaban benar</p>
                    </div>
                  )}
                </div>
                <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums">{r.sec.toFixed(1)}s</span>
              </li>
            ))}
          </ul>
        </div>
        <MoreToggle open={open} total={rows.length} preview={SPEED_PREVIEW} onToggle={() => setOpen((o) => !o)} />
        </>
      )}
    </ChartCard>
  )
}
