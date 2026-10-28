import { useState } from 'react'
import { GROUP_PREVIEW } from '../../lib/tuning'
import { GROUPS, groupTitle, type Script } from '../../lib/kana'
import { ChartCard, Empty, MoreToggle, Table } from './shared'


export function GroupChart({ stats }: { stats: Record<string, { r: number; w: number }> }) {
  const [open, setOpen] = useState(false)
  const rows = (['hiragana', 'katakana'] as Script[])
    .flatMap((script) => GROUPS[script])
    .map((g) => {
      const r = g.kana.reduce((a, k) => a + (stats[k.id]?.r ?? 0), 0)
      const w = g.kana.reduce((a, k) => a + (stats[k.id]?.w ?? 0), 0)
      return { g, name: `${g.kana[0].script === 'hiragana' ? 'Hira' : 'Kata'} · ${groupTitle(g)}`, n: r + w, acc: r + w ? r / (r + w) : 0 }
    })
    .filter((x) => x.n > 0)
    .sort((a, b) => a.acc - b.acc)
    .slice(0, 10)

  return (
    <ChartCard
      title="Akurasi per kelompok huruf"
      note="Yang paling lemah di atas"
      table={
        <Table
          head={['Kelompok', 'Akurasi', 'Jawaban']}
          rows={rows.map((r) => [r.name, `${Math.round(r.acc * 100)}%`, r.n])}
        />
      }
    >
      {rows.length === 0 ? (
        <Empty>Belum ada jawaban yang tercatat.</Empty>
      ) : (
        <>
        <ul className="space-y-2 pt-5">
          {(open ? rows : rows.slice(0, GROUP_PREVIEW)).map((r) => (
            <li key={r.g.id} className="flex items-center gap-2" title={`${r.name}: ${Math.round(r.acc * 100)}% dari ${r.n} jawaban`}>
              <span className="w-28 shrink-0 truncate text-xs font-semibold text-bone sm:w-36 sm:text-sm">{r.name}</span>
              <div className="h-5 flex-1">
                <div className="h-full rounded-r-[4px] bg-ok" style={{ width: `${Math.max(r.acc * 100, 1)}%` }} />
              </div>
              <span className="w-12 shrink-0 text-right text-sm font-bold tabular-nums">{Math.round(r.acc * 100)}%</span>
            </li>
          ))}
        </ul>
        <MoreToggle open={open} total={rows.length} preview={GROUP_PREVIEW} onToggle={() => setOpen((o) => !o)} />
        </>
      )}
    </ChartCard>
  )
}
