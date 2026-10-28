import { useState } from 'react'
import { addDays, dayKey, type DayStat } from '../../lib/storage'
import {ChartCard, Empty, Table } from './shared'
import { fmtShort, niceMax, TEXT_2 } from './helpers'

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
