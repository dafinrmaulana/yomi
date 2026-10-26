import Page from '../components/Page'
import { useApp } from '../lib/app-context'
import { KANA_BY_ID, type Kana } from '../lib/kana'
import type { QuizConfig } from '../lib/quiz'
import { Link } from '../lib/router'
import { dayKey, SRS_DAYS } from '../lib/storage'

interface Props {
  onStart: (c: QuizConfig) => void
}

const config = (pool: Kana[]): QuizConfig => ({
  kind: 'review',
  title: 'Ulangan Harian',
  pool,
  review: [],
  mode: 'single',
  length: 1,
  answer: 'mix',
  total: Math.min(20, Math.max(8, pool.length)),
  hearts: false,
})

export default function Ulang({ onStart }: Props) {
  const { progress } = useApp()
  const today = dayKey()

  const due = Object.entries(progress.srs)
    .filter(([, c]) => c.due <= today)
    .sort((a, b) => a[1].due.localeCompare(b[1].due) || a[1].box - b[1].box)
    .map(([id]) => KANA_BY_ID[id])
    .filter(Boolean)
  const batch = due.slice(0, 20)

  const weak = Object.entries(progress.stats)
    .filter(([, s]) => s.w > 0)
    .map(([id, s]) => ({ k: KANA_BY_ID[id], rate: s.w / (s.r + s.w) }))
    .filter((x) => x.k)
    .sort((a, b) => b.rate - a.rate)
    .slice(0, 12)
    .map((x) => x.k)

  const upcoming = Object.values(progress.srs)
    .map((c) => c.due)
    .filter((d) => d > today)
    .sort()[0]

  return (
    <Page
      eyebrow="Ulangan Harian"
      title="Ulangi yang hampir lupa"
      lead="Huruf yang salah muncul lagi hari ini. Huruf yang benar muncul kembali beberapa hari kemudian, semakin lama semakin jarang."
      size="md"
    >
      {batch.length > 0 ? (
        <section className="card p-6">
          <p className="text-sm text-[#cdb88f]">Menunggu hari ini</p>
          <p className="mt-1 text-4xl font-black">
            {due.length} <span className="text-lg font-bold text-[#cdb88f]">huruf</span>
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {batch.map((k) => (
              <span key={k.id} className="font-jp rounded-lg border border-[#4d3727] bg-[#2a1c14] px-3 py-1.5 text-xl font-bold">
                {k.char}
              </span>
            ))}
          </div>
          {due.length > batch.length && <p className="mt-2 text-xs text-[#8f7f66]">Sesi ini membahas {batch.length} huruf pertama.</p>}
          <button className="btn btn-red mt-6" onClick={() => onStart(config(batch))}>
            Mulai ulangan
          </button>
        </section>
      ) : (
        <section className="card p-6">
          <h2 className="font-display text-2xl font-extrabold">Semua beres</h2>
          <p className="mt-2 text-[#cdb88f]">
            {Object.keys(progress.srs).length === 0
              ? 'Belum ada huruf yang perlu diulang. Selesaikan satu misi di papan dulu, nanti huruf-hurufnya muncul di sini.'
              : upcoming
                ? `Tidak ada huruf yang jatuh tempo hari ini. Ulangan berikutnya: ${new Date(upcoming + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long' })}.`
                : 'Tidak ada huruf yang jatuh tempo hari ini.'}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            {weak.length > 0 && (
              <button className="btn btn-gold" onClick={() => onStart(config(weak))}>
                Latih huruf yang lemah
              </button>
            )}
            <Link to="/missions" className="btn btn-ghost">
              Ke papan misi
            </Link>
          </div>
        </section>
      )}

      <section className="mt-8 rounded-lg border border-[#3a2a20] bg-[#120c09]/70 p-5">
        <h2 className="font-display text-lg font-extrabold">Cara kerjanya</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#b9a782]">
          Setiap huruf punya jadwal ulang. Jawab benar, jaraknya naik: {SRS_DAYS.slice(1).join(', ')} hari. Jawab salah, huruf itu
          kembali ke hari ini.
        </p>
      </section>
    </Page>
  )
}
