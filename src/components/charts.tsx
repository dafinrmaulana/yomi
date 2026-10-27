import { useState } from 'react'
import { GROUPS, KANA_BY_ID, groupTitle, type Script } from '../lib/kana'
import { slowMs } from '../lib/quiz'
import { addDays, dayKey, type DayStat, type SessionPoint, type SpeedStat } from '../lib/storage'

/* Grafik murni HTML/CSS: tanpa pustaka, batang tipis dengan ujung membulat dan celah 2px antar segmen. */

const TEXT_2 = 'text-[#b9a782]'

function ChartCard({ title, note, children, table }: { title: string; note?: string; children: React.ReactNode; table: React.ReactNode }) {
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

function Table({ head, rows }: { head: string[]; rows: (string | number)[][] }) {
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

const SPEED_PREVIEW = 3
const GROUP_PREVIEW = 4

function MoreToggle({ open, total, preview, onToggle }: { open: boolean; total: number; preview: number; onToggle: () => void }) {
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

const Empty = ({ children }: { children: React.ReactNode }) => (
  <p className={`py-8 text-center text-sm ${TEXT_2}`}>{children}</p>
)

const fmtShort = (key: string) =>
  new Date(key + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

/** tick sumbu-y yang bulat: 0, 5, 10 ... */
function niceMax(v: number) {
  if (v <= 5) return 5
  const step = 10 ** Math.floor(Math.log10(v))
  return Math.ceil(v / step) * step
}

/* ---------- 1. Jawaban per hari (benar vs salah) ---------- */

const DAYS = 14
const HATCH = 'repeating-linear-gradient(45deg, #ff4d5e 0 3px, #5b2029 3px 6px)'

export function ActivityChart({ days }: { days: Record<string, DayStat> }) {
  const [hover, setHover] = useState<number | null>(null)
  const today = dayKey()
  const keys = Array.from({ length: DAYS }, (_, i) => addDays(today, i - (DAYS - 1)))
  const data = keys.map((k) => ({ key: k, ok: days[k]?.ok ?? 0, bad: days[k]?.bad ?? 0 }))
  const peak = Math.max(...data.map((d) => d.ok + d.bad))
  const max = niceMax(peak)
  const H = 150

  return (
    <ChartCard
      title="Jawaban 14 hari terakhir"
      note="Benar dan salah per hari"
      table={
        <Table
          head={['Tanggal', 'Benar', 'Salah', 'Akurasi']}
          rows={data.map((d) => [
            fmtShort(d.key),
            d.ok,
            d.bad,
            d.ok + d.bad ? `${Math.round((d.ok / (d.ok + d.bad)) * 100)}%` : '–',
          ])}
        />
      }
    >
      {peak === 0 ? (
        <Empty>Belum ada jawaban dalam 14 hari terakhir.</Empty>
      ) : (
        <>
          <div className="mb-3 flex gap-4 text-xs text-bone">
            <span className="flex items-center gap-1.5">
              <i className="inline-block size-2.5 rounded-sm bg-ok" />
              Benar
            </span>
            <span className="flex items-center gap-1.5">
              <i className="inline-block size-2.5 rounded-sm" style={{ background: HATCH }} />
              Salah
            </span>
          </div>
          <div className="relative flex" style={{ height: H + 22 }}>
            {/* sumbu-y */}
            <div className={`relative w-8 shrink-0 text-[10px] tabular-nums ${TEXT_2}`} style={{ height: H }}>
              {[max, max / 2, 0].map((t) => (
                <span key={t} className="absolute right-1 -translate-y-1/2" style={{ top: H - (t / max) * H }}>
                  {Math.round(t)}
                </span>
              ))}
            </div>
            <div className="relative flex-1">
              {[max, max / 2, 0].map((t) => (
                <div key={t} className="absolute inset-x-0 border-t border-edge" style={{ top: H - (t / max) * H }} />
              ))}
              <div className="absolute inset-x-0 top-0 flex items-end justify-between gap-1" style={{ height: H }}>
                {data.map((d, i) => {
                  const total = d.ok + d.bad
                  const hOk = (d.ok / max) * H
                  const hBad = (d.bad / max) * H
                  return (
                    <div
                      key={d.key}
                      className="group relative flex h-full flex-1 items-end justify-center"
                      onMouseEnter={() => setHover(i)}
                      onMouseLeave={() => setHover((h) => (h === i ? null : h))}
                      onFocus={() => setHover(i)}
                      onBlur={() => setHover((h) => (h === i ? null : h))}
                      tabIndex={0}
                      aria-label={`${fmtShort(d.key)}: ${d.ok} benar, ${d.bad} salah`}
                    >
                      <div className="flex w-full max-w-6 flex-col justify-end gap-[2px]">
                        {d.bad > 0 && (
                          <div
                            className={`${d.ok > 0 ? '' : 'rounded-b-none'} rounded-t-[4px]`}
                            style={{ height: Math.max(hBad, 3), background: HATCH }}
                          />
                        )}
                        {d.ok > 0 && (
                          <div
                            className={`bg-ok ${d.bad > 0 ? '' : 'rounded-t-[4px]'}`}
                            style={{ height: Math.max(hOk, 3) }}
                          />
                        )}
                      </div>
                      {hover === i && (
                        <div
                          className="pointer-events-none absolute z-10 whitespace-nowrap rounded-md border border-edge bg-panel-2 px-2.5 py-1.5 text-xs shadow-lg"
                          style={{
                            bottom: Math.min(hOk + hBad + 10, H - 4),
                            left: i < 3 ? 0 : i > DAYS - 4 ? 'auto' : '50%',
                            right: i > DAYS - 4 ? 0 : 'auto',
                            transform: i < 3 || i > DAYS - 4 ? undefined : 'translateX(-50%)',
                          }}
                        >
                          <p className="font-bold">{fmtShort(d.key)}</p>
                          <p className="text-ok">{d.ok} benar</p>
                          <p className="text-sharin-glow">{d.bad} salah</p>
                          {total > 0 && <p className={TEXT_2}>{Math.round((d.ok / total) * 100)}% akurasi</p>}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
              <div className={`absolute inset-x-0 flex justify-between gap-1 text-[10px] ${TEXT_2}`} style={{ top: H + 6 }}>
                {data.map((d, i) => (
                  <span key={d.key} className="flex-1 text-center tabular-nums">
                    {i % 2 === (DAYS - 1) % 2 ? d.key.slice(8).replace(/^0/, '') : ''}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </ChartCard>
  )
}

/* ---------- 2. Huruf paling lambat ---------- */

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

/* ---------- 3. Akurasi per kelompok huruf ---------- */

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

/* ---------- 4. Riwayat satu huruf per sesi ---------- */

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
