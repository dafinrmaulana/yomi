import { KANA_BY_ID } from '../../lib/kana'
import type { SessionPoint } from '../../lib/storage'
import {Empty, Table } from './shared'
import { TEXT_2 } from './helpers'

const SHOWN = 12

interface Col {
  label: string
  value: number | null
  tip: string
}

function SessionColumns({ title, cols, max, fmt, color }: { title: string; cols: Col[]; max: number; fmt: (v: number) => string; color: string }) {
  const H = 90
  const last = cols.length - 1
  return (
    <div>
      <p className={`mb-2 text-xs font-bold uppercase tracking-widest ${TEXT_2}`}>{title}</p>
      <div className="flex items-end justify-between gap-1 border-b border-edge" style={{ height: H + 18 }}>
        {cols.map((c, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end" title={c.tip}>
            {c.value !== null && i === last && (
              <span className="mb-0.5 text-[10px] font-bold tabular-nums text-bone">{fmt(c.value)}</span>
            )}
            {c.value !== null ? (
              <div className="w-full max-w-6 rounded-t-[4px]" style={{ height: Math.max((c.value / max) * H, 3), background: color }} />
            ) : (
              <div className="h-[3px] w-full max-w-6 bg-edge" />
            )}
          </div>
        ))}
      </div>
      <div className={`mt-1 flex justify-between gap-1 text-[10px] tabular-nums ${TEXT_2}`}>
        {cols.map((c, i) => (
          <span key={i} className="flex-1 text-center">
            {c.label}
          </span>
        ))}
      </div>
    </div>
  )
}

export function LetterHistory({ id, history }: { id: string; history: SessionPoint[] }) {
  const k = KANA_BY_ID[id]
  if (history.length === 0) {
    return <Empty>Riwayat per sesi untuk {k?.char} baru terekam mulai sesi latihan berikutnya.</Empty>
  }
  const all = history.map((h, i) => ({ ...h, no: i + 1, acc: h.r / (h.r + h.w) }))
  const shown = all.slice(-SHOWN)
  const r = all.reduce((a, h) => a + h.r, 0)
  const w = all.reduce((a, h) => a + h.w, 0)
  const timed = all.filter((h) => h.ms !== undefined)
  const avg = timed.length ? timed.reduce((a, h) => a + (h.ms ?? 0), 0) / timed.length / 1000 : null
  const maxSec = Math.max(...timed.map((h) => (h.ms ?? 0) / 1000), 1)
  const date = (at: number) => new Date(at).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-2 text-center">
        {[
          { v: all.length, l: 'Sesi' },
          { v: `${Math.round((r / (r + w)) * 100)}%`, l: 'Akurasi' },
          { v: avg === null ? '–' : `${avg.toFixed(1)}s`, l: 'Rata-rata' },
          { v: r + w, l: 'Jawaban' },
        ].map((t) => (
          <div key={t.l} className="card py-2.5">
            <p className="text-lg font-black tabular-nums">{t.v}</p>
            <p className="text-[10px] font-bold uppercase tracking-wider text-mute">{t.l}</p>
          </div>
        ))}
      </div>

      <SessionColumns
        title="Akurasi per sesi"
        cols={shown.map((h) => ({ label: String(h.no), value: h.acc * 100, tip: `Sesi ${h.no} · ${date(h.at)}: ${Math.round(h.acc * 100)}% (${h.r} benar, ${h.w} salah)` }))}
        max={100}
        fmt={(v) => `${Math.round(v)}%`}
        color="var(--color-ok)"
      />
      <SessionColumns
        title="Waktu jawab per sesi (detik)"
        cols={shown.map((h) => ({
          label: String(h.no),
          value: h.ms === undefined ? null : h.ms / 1000,
          tip: h.ms === undefined ? `Sesi ${h.no} · ${date(h.at)}: belum ada jawaban benar` : `Sesi ${h.no} · ${date(h.at)}: rata-rata ${(h.ms / 1000).toFixed(1)} dtk`,
        }))}
        max={maxSec}
        fmt={(v) => `${v.toFixed(1)}s`}
        color="var(--color-gold)"
      />
      <p className={`-mt-2 text-[10px] ${TEXT_2}`}>Angka di bawah kolom = nomor sesi{all.length > SHOWN ? `, ${SHOWN} sesi terakhir` : ''}.</p>

      <details className="text-xs">
        <summary className={`cursor-pointer select-none ${TEXT_2} hover:text-bone`}>Lihat sebagai tabel</summary>
        <div className="mt-2 max-h-48 overflow-auto">
          <Table
            head={['Sesi', 'Tanggal', 'Benar', 'Salah', 'Akurasi', 'Waktu']}
            rows={[...all].reverse().map((h) => [h.no, date(h.at), h.r, h.w, `${Math.round(h.acc * 100)}%`, h.ms === undefined ? '–' : `${(h.ms / 1000).toFixed(1)}s`])}
          />
        </div>
      </details>
    </div>
  )
}
