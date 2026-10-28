import type { ReactNode } from 'react'
import { TEXT_2 } from './helpers'

/* Grafik murni HTML/CSS: tanpa pustaka, batang tipis dengan ujung membulat dan celah 2px antar segmen. */

export function ChartCard({ title, note, children, table }: { title: string; note?: string; children: ReactNode; table: ReactNode }) {
  return (
    <div className="card p-5">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h3 className="font-display text-lg font-extrabold">{title}</h3>
        {note && <span className={`text-xs ${TEXT_2}`}>{note}</span>}
      </div>
      {children}
      <details className="mt-4 text-xs">
        <summary className={`cursor-pointer select-none ${TEXT_2} hover:text-bone`}>Lihat sebagai tabel</summary>
        <div className="mt-2 max-h-56 overflow-auto">{table}</div>
      </details>
    </div>
  )
}

export function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
  return (
    <table className="w-full text-left tabular-nums">
      <thead>
        <tr className={TEXT_2}>
          {head.map((h) => (
            <th key={h} className="py-1 pr-3 font-bold">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((r, i) => (
          <tr key={i} className="border-t border-edge">
            {r.map((c, j) => (
              <td key={j} className="py-1 pr-3">
                {c}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  )
}


export function MoreToggle({ open, total, preview, onToggle }: { open: boolean; total: number; preview: number; onToggle: () => void }) {
  if (total <= preview) return null
  return (
    <button
      onClick={onToggle}
      aria-expanded={open}
      className={`mt-3 flex w-full cursor-pointer items-center justify-center gap-1.5 rounded-md border border-edge py-1.5 text-xs font-bold transition hover:text-bone ${TEXT_2}`}
    >
      {open ? 'Ringkas' : `Tampilkan semua (${total})`}
      <span className={`inline-block transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
    </button>
  )
}

export const Empty = ({ children }: { children: ReactNode }) => (
  <p className={`py-8 text-center text-sm ${TEXT_2}`}>{children}</p>
)
