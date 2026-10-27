import Confetti from '../components/Confetti'
import Petals from '../components/Petals'
import Scenery from '../components/Scenery'
import Sharingan from '../components/Sharingan'
import type { QuizResult } from '../lib/quiz'

interface Props {
  result: QuizResult
  bonusXp: number
  onRetry: () => void
  onBack: () => void
}

const fmtTime = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m ${s % 60}s` : `${s}s`)

export default function Summary({ result, bonusXp, onRetry, onBack }: Props) {
  const { correct, wrong, failed, config } = result
  const total = correct + wrong
  const acc = total ? Math.round((correct / total) * 100) : 0
  const celebrate = !failed && acc >= 50

  const title = failed ? 'Chakra habis…' : config.kind === 'path' ? 'Pelajaran selesai!' : config.kind === 'review' ? 'Ulangan selesai!' : 'Sesi selesai!'
  const sub = failed
    ? 'Nyawamu habis. Ulangi dan perhatikan huruf yang tertukar.'
    : acc >= 90
      ? 'Matamu tajam. Sharingan sepenuhnya terbuka.'
      : acc >= 70
        ? 'Bagus. Sedikit lagi latihan.'
        : 'Terus berlatih, huruf akan menempel di mata.'

  const stats = [
    { label: 'XP', value: `+${result.xp + bonusXp}`, color: 'text-gold' },
    { label: 'Combo maks', value: String(result.maxCombo), color: 'text-bone' },
    { label: 'Waktu', value: fmtTime(result.seconds), color: 'text-bone' },
    { label: 'Rata-rata', value: result.avgSeconds === null ? '–' : `${result.avgSeconds.toFixed(1)}s`, color: 'text-bone' },
  ]

  return (
    <div className="relative grid min-h-dvh place-items-center px-4 py-10">
      <Scenery />
      <Petals count={10} />
      {celebrate && <Confetti />}
      <div className="relative z-10 w-full max-w-lg text-center">
        <div className="animate-pop mx-auto mb-4 w-fit">
          <Sharingan level={failed ? 1 : acc >= 90 ? 4 : 3} size={120} spin={!failed} />
        </div>
        <h1 className="text-4xl font-black text-glow">{title}</h1>
        <p className="mt-2 text-mute">{sub}</p>

        {config.kind === 'path' && !failed && (
          <div className="mt-4 flex justify-center gap-1">
            {[1, 2, 3].map((i) => (
              <svg key={i} viewBox="0 0 24 24" width="36" height="36" className={i <= result.stars ? 'animate-pop text-gold' : 'text-edge'} fill="currentColor" style={{ animationDelay: `${i * 0.12}s` }}>
                <path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 8.9z" />
              </svg>
            ))}
          </div>
        )}

        <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="card flex flex-col justify-center px-2 py-4">
              <p className={`whitespace-nowrap text-2xl font-black ${s.color}`}>{s.value}</p>
              <p className="mt-1 text-[11px] font-bold uppercase leading-tight tracking-wider text-mute">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="card mt-3 grid grid-cols-3 divide-x divide-edge py-4">
          <div>
            <p className="text-3xl font-black text-ok">{correct}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-mute">Benar</p>
          </div>
          <div>
            <p className="text-3xl font-black text-sharin-glow">{wrong}</p>
            <p className="text-xs font-bold uppercase tracking-widest text-mute">Salah</p>
          </div>
          <div>
            <p className={`text-3xl font-black ${acc >= 70 ? 'text-ok' : 'text-sharin-glow'}`}>{acc}%</p>
            <p className="text-xs font-bold uppercase tracking-widest text-mute">Akurasi</p>
          </div>
        </div>

        {bonusXp > 0 && <p className="mt-3 text-sm font-bold text-gold">Bonus pelajaran selesai +{bonusXp} XP</p>}

        {result.weak.length > 0 && (
          <div className="card mt-3 p-4 text-left">
            <h2 className="mb-3 text-xs font-bold uppercase tracking-widest text-mute">Huruf yang perlu diulang</h2>
            <div className="flex flex-wrap gap-2">
              {result.weak.map((k) => (
                <div key={k.id} className="rounded-xl border border-sharin/40 bg-sharin/10 px-3 py-1.5 text-center">
                  <span className="font-jp text-2xl font-bold">{k.char}</span>
                  <span className="block text-[10px] font-semibold text-mute">{k.romaji[0]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 flex gap-3">
          <button className="btn btn-ghost flex-1" onClick={onBack}>
            Kembali
          </button>
          <button className="btn btn-red flex-1" onClick={onRetry}>
            {config.kind === 'path' ? (failed ? 'Coba lagi' : 'Ulangi') : 'Latihan lagi'}
          </button>
        </div>
      </div>
    </div>
  )
}
