import { useState } from 'react'
import Calendar from '../components/Calendar'
import { ActivityChart, GroupChart, LetterHistory, SpeedChart } from '../components/charts'
import { Modal } from '../components/Modal'
import Page from '../components/Page'
import { useApp } from '../lib/app-context'
import { GROUPS, KANA_BY_ID, SCRIPT_LABEL, SPECIAL_KANA, type Kana, type Script } from '../lib/kana'
import { BADGES, RANKS, rankFor } from '../lib/rank'

function Tile({ value, label, tone = '' }: { value: string | number; label: string; tone?: string }) {
  return (
    <div className="card px-2 py-4 text-center">
      <p className={`text-2xl font-black ${tone}`}>{value}</p>
      <p className="mt-1 text-[11px] font-bold uppercase tracking-widest text-mute">{label}</p>
    </div>
  )
}

function Section({ title, children, aside }: { title: string; children: React.ReactNode; aside?: string }) {
  return (
    <section className="mt-10">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 className="font-display text-2xl font-extrabold">{title}</h2>
        {aside && <span className="text-sm text-[#b9a782]">{aside}</span>}
      </div>
      {children}
    </section>
  )
}

/** petak penguasaan huruf: warna menurut akurasi, ketuk untuk melihat riwayat */
function MasteryGrid({
  kana,
  stats,
  speed,
  onPick,
}: {
  kana: Kana[]
  stats: Record<string, { r: number; w: number }>
  speed: Record<string, { n: number; ms: number }>
  onPick: (id: string) => void
}) {
  return (
    <div className="grid grid-cols-[repeat(auto-fill,minmax(54px,1fr))] gap-2">
      {kana.map((k) => {
        const st = stats[k.id]
        const n = st ? st.r + st.w : 0
        const a = n ? st!.r / n : null
        const tone =
          a === null ? 'border-[#3a2a20] bg-[#1a120d] text-[#6f604b]' : a >= 0.9 ? 'border-ok/60 bg-ok/20' : a >= 0.7 ? 'border-gold/60 bg-gold/20' : 'border-sharin/70 bg-sharin/25'
        const sp = speed[k.id]
        const sec = sp ? ` · rata-rata ${(sp.ms / sp.n / 1000).toFixed(1)} dtk` : ''
        return (
          <button
            key={k.id}
            onClick={() => onPick(k.id)}
            aria-label={`Riwayat ${k.char}`}
            title={a === null ? `${k.char} (${k.romaji[0]}): belum dilatih` : `${k.char} (${k.romaji[0]}): ${Math.round(a * 100)}% benar dari ${n} jawaban${sec}`}
            className={`font-jp grid aspect-square cursor-pointer place-items-center rounded-lg border text-xl font-bold transition hover:scale-105 hover:brightness-125 ${tone}`}
          >
            {k.char}
          </button>
        )
      })}
    </div>
  )
}

const fmtDay = (key: string) =>
  new Date(key + 'T00:00').toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

export default function Statistik() {
  const { progress } = useApp()
  const [script, setScript] = useState<Script>('hiragana')
  const [picked, setPicked] = useState<string | null>(null)
  const [letter, setLetter] = useState<string | null>(null)

  const { rank, next, pct, index } = rankFor(progress.xp)
  const total = progress.totalCorrect + progress.totalWrong
  const acc = total ? Math.round((progress.totalCorrect / total) * 100) : null
  const speedN = Object.values(progress.speed).reduce((a, v) => a + v.n, 0)
  const avgSec = speedN ? Object.values(progress.speed).reduce((a, v) => a + v.ms, 0) / speedN / 1000 : null
  const earned = BADGES.filter((b) => b.earned(progress))
  const day = picked ? progress.days[picked] : undefined

  return (
    <Page eyebrow="Statistik" title="Perjalanan Ninja-mu" lead="Pangkat, kalender latihan, penguasaan tiap huruf, dan lencana yang sudah kamu raih.">
      {/* pangkat */}
      <section className="card p-6">
        <p className="text-xs font-bold uppercase tracking-[0.25em] text-sharin-glow">Pangkat saat ini</p>
        <h2 className="font-display mt-1 text-4xl font-extrabold">{rank.name}</h2>
        <p className="mt-1 text-sm text-[#cdb88f]">{rank.desc}</p>
        <div className="mt-4 flex items-baseline justify-between text-sm">
          <span className="font-bold">{progress.xp} XP</span>
          <span className="text-[#cdb88f]">{next ? `${next.min - progress.xp} XP lagi ke ${next.name}` : 'Pangkat tertinggi tercapai'}</span>
        </div>
        <div className="mt-1.5 h-3 overflow-hidden rounded-full bg-black/40">
          <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
        </div>
        <ol className="mt-5 grid grid-cols-3 gap-2 sm:grid-cols-6">
          {RANKS.map((r, i) => (
            <li
              key={r.id}
              className={`rounded-md border px-2 py-2 text-center text-xs font-bold ${
                i <= index ? 'border-sharin/60 bg-sharin/15 text-bone' : 'border-[#3a2a20] text-[#6f604b]'
              }`}
            >
              {r.name}
              <span className="mt-0.5 block text-[10px] font-semibold opacity-70">{r.min} XP</span>
            </li>
          ))}
        </ol>
      </section>

      {/* ringkasan */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-7">
        <Tile value={progress.totalCorrect} label="Benar" tone="text-ok" />
        <Tile value={progress.totalWrong} label="Salah" tone="text-sharin-glow" />
        <Tile value={acc === null ? '–' : `${acc}%`} label="Akurasi" />
        <Tile value={Object.keys(progress.days).length} label="Hari aktif" />
        <Tile value={Math.max(progress.bestStreak, progress.dayStreak)} label="Streak terbaik" tone="text-gold" />
        <Tile value={progress.bestCombo} label="Combo terbaik" />
        <Tile value={avgSec === null ? '–' : `${avgSec.toFixed(1)} dtk`} label="Rata-rata jawab" />
      </div>

      {/* kalender */}
      <Section title="Kalender latihan" aside="Ketuk tanggal untuk melihat detail">
        <div className="card mx-auto max-w-md p-5">
          <Calendar days={progress.days} onPick={setPicked} />
        </div>
      </Section>

      {/* peta penguasaan */}
      <Section title="Penguasaan huruf" aside="Ketuk huruf untuk melihat riwayatnya">
        <div className="tabs mb-4 max-w-md" role="tablist" aria-label="Pilih skrip">
          {(['hiragana', 'katakana'] as Script[]).map((s) => (
            <button key={s} role="tab" aria-selected={script === s} onClick={() => setScript(s)} className="tab">
              {SCRIPT_LABEL[s]}
            </button>
          ))}
        </div>
        <MasteryGrid kana={GROUPS[script].flatMap((g) => g.kana)} stats={progress.stats} speed={progress.speed} onPick={setLetter} />
        <p className="mb-2 mt-5 text-xs font-bold uppercase tracking-widest text-[#b9a782]">Huruf khusus</p>
        <MasteryGrid kana={SPECIAL_KANA.filter((k) => k.script === script)} stats={progress.stats} speed={progress.speed} onPick={setLetter} />
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#b9a782]">
          <span><i className="mr-1.5 inline-block size-3 rounded-sm bg-ok/50 align-middle" />90%+ kuat</span>
          <span><i className="mr-1.5 inline-block size-3 rounded-sm bg-gold/50 align-middle" />70–89% cukup</span>
          <span><i className="mr-1.5 inline-block size-3 rounded-sm bg-sharin/60 align-middle" />di bawah 70% perlu diulang</span>
          <span><i className="mr-1.5 inline-block size-3 rounded-sm bg-[#1a120d] align-middle ring-1 ring-[#3a2a20]" />belum dilatih</span>
        </div>
      </Section>

      {/* analisis */}
      <Section title="Analisis" aside="Grafik dari riwayat latihanmu">
        <div className="grid items-start gap-4 lg:grid-cols-2">
          <div className="lg:col-span-2">
            <ActivityChart days={progress.days} />
          </div>
          <SpeedChart speed={progress.speed} />
          <GroupChart stats={progress.stats} />
        </div>
      </Section>

      {/* lencana */}
      <Section title="Lencana" aside={`${earned.length} dari ${BADGES.length}`}>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {BADGES.map((b) => {
            const got = earned.includes(b)
            return (
              <li key={b.id} className={`card flex flex-col items-center px-3 py-4 text-center ${got ? '' : 'opacity-50'}`}>
                <span
                  className={`grid size-14 place-items-center rounded-full border-2 text-lg font-black ${
                    got
                      ? 'border-[#4d0a11] bg-gradient-to-b from-[#dc3443] to-[#a3141f] text-white shadow-[0_3px_0_#4d0a11]'
                      : 'border-[#3a2a20] bg-[#1a120d] text-[#6f604b]'
                  }`}
                >
                  {got ? b.mark : '?'}
                </span>
                <p className="mt-2 text-sm font-bold">{b.name}</p>
                <p className="mt-0.5 text-xs leading-snug text-[#b9a782]">{b.desc}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      <Modal
        open={picked !== null}
        title={picked ? fmtDay(picked) : ''}
        onClose={() => setPicked(null)}
        footer={
          <button className="btn btn-ghost" onClick={() => setPicked(null)}>
            Tutup
          </button>
        }
      >
        {day ? (
          <dl className="mt-1 grid grid-cols-2 gap-3 text-center">
            <div className="card py-3">
              <dd className="text-2xl font-black text-gold">+{day.xp}</dd>
              <dt className="text-xs uppercase tracking-widest text-mute">XP</dt>
            </div>
            <div className="card py-3">
              <dd className="text-2xl font-black">{day.ok + day.bad ? Math.round((day.ok / (day.ok + day.bad)) * 100) : 0}%</dd>
              <dt className="text-xs uppercase tracking-widest text-mute">Akurasi</dt>
            </div>
            <div className="card py-3">
              <dd className="text-2xl font-black text-ok">{day.ok}</dd>
              <dt className="text-xs uppercase tracking-widest text-mute">Benar</dt>
            </div>
            <div className="card py-3">
              <dd className="text-2xl font-black text-sharin-glow">{day.bad}</dd>
              <dt className="text-xs uppercase tracking-widest text-mute">Salah</dt>
            </div>
          </dl>
        ) : (
          <p>Tidak ada latihan di hari ini.</p>
        )}
      </Modal>

      <Modal
        open={letter !== null}
        title={letter ? `${KANA_BY_ID[letter].char} · ${KANA_BY_ID[letter].romaji[0]}` : ''}
        onClose={() => setLetter(null)}
        wide
        footer={
          <button className="btn btn-ghost" onClick={() => setLetter(null)}>
            Tutup
          </button>
        }
      >
        {letter && <LetterHistory id={letter} history={progress.history[letter] ?? []} />}
      </Modal>
    </Page>
  )
}
