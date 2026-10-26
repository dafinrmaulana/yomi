import { useState } from 'react'
import Petals from '../components/Petals'
import Sharingan from '../components/Sharingan'
import Torii from '../components/Torii'
import { KANA_BY_ID, KIND_LABEL, SCRIPT_LABEL, type Script } from '../lib/kana'
import { isUnlocked, nodesFor, type PathNode } from '../lib/path'
import { DAILY_GOAL, type Progress } from '../lib/storage'

interface Props {
  progress: Progress
  streak: number
  todayXp: number
  onLesson: (n: PathNode) => void
  onFree: () => void
  onToggleMute: () => void
  onReset: () => void
}

const OFFSETS = [0, 44, 66, 44, 0, -44, -66, -44]

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="16" height="16" className={i <= n ? 'text-gold' : 'text-edge'} fill="currentColor">
          <path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 8.9z" />
        </svg>
      ))}
    </div>
  )
}

export default function Home({ progress, streak, todayXp, onLesson, onFree, onToggleMute, onReset }: Props) {
  const [script, setScript] = useState<Script>('hiragana')
  const nodes = nodesFor(script)
  const goalPct = Math.min(100, (todayXp / DAILY_GOAL) * 100)
  const total = progress.totalCorrect + progress.totalWrong
  const accuracy = total ? Math.round((progress.totalCorrect / total) * 100) : null

  const weak = Object.entries(progress.stats)
    .filter(([, s]) => s.w > 0)
    .map(([id, s]) => ({ k: KANA_BY_ID[id], rate: s.w / (s.r + s.w), w: s.w }))
    .filter((x) => x.k)
    .sort((a, b) => b.rate - a.rate || b.w - a.w)
    .slice(0, 8)

  return (
    <div className="bg-seigaiha relative min-h-dvh">
      <Petals />

      <header className="sticky top-0 z-30 border-b border-edge bg-ink/85 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Sharingan level={3} size={34} />
            <span className="text-xl font-black tracking-wide">Yomi</span>
            <span className="font-jp text-sm text-mute">読み</span>
          </div>
          <div className="flex items-center gap-2 text-sm font-extrabold">
            <span className="flex items-center gap-1.5 rounded-xl bg-panel px-3 py-1.5" title="Streak harian">
              <span className={streak ? '' : 'grayscale'}>🔥</span>
              <span className={streak ? 'text-gold' : 'text-mute'}>{streak}</span>
            </span>
            <span className="rounded-xl bg-panel px-3 py-1.5 text-sharin-glow" title="Total XP">
              {progress.xp} <span className="text-xs text-mute">XP</span>
            </span>
            <button
              onClick={onToggleMute}
              className="grid size-9 cursor-pointer place-items-center rounded-xl bg-panel text-mute transition hover:text-bone"
              title={progress.mute ? 'Suara mati' : 'Suara menyala'}
              aria-label="Suara"
            >
              {progress.mute ? '🔇' : '🔊'}
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto grid max-w-5xl gap-8 px-4 pb-24 pt-6 lg:grid-cols-[1fr_340px]">
        {/* kolom jalur */}
        <section className="order-2 lg:order-1">
          <div className="card relative mb-6 overflow-hidden px-6 py-6">
            <Torii className="absolute -right-4 bottom-0 h-28 text-sharin/20" />
            <span className="font-jp pointer-events-none absolute -top-6 right-24 text-[9rem] font-black leading-none text-white/[0.03]">
              読
            </span>
            <p className="text-xs font-bold uppercase tracking-[0.25em] text-sharin-glow">Jalur Latihan</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Buka matamu, baca setiap huruf.</h1>
            <p className="mt-1 max-w-md text-sm text-mute">
              Selesaikan pelajaran satu per satu. Setiap node memuat 10 soal dan kamu punya 5 nyawa.
            </p>
          </div>

          <div className="mb-8 flex gap-2">
            {(['hiragana', 'katakana'] as Script[]).map((s) => (
              <button
                key={s}
                onClick={() => setScript(s)}
                className={`btn flex-1 ${script === s ? 'btn-red' : 'btn-ghost'}`}
              >
                <span className="font-jp text-base normal-case">{SCRIPT_LABEL[s]}</span>
              </button>
            ))}
          </div>

          <ol className="flex flex-col items-center">
            {nodes.map((node, i) => {
              const stars = progress.completed[node.id] ?? 0
              const unlocked = isUnlocked(node, progress.completed)
              const current = unlocked && stars === 0
              const showHeader = i === 0 || nodes[i - 1].group.kind !== node.group.kind
              const x = OFFSETS[i % OFFSETS.length]
              return (
                <li key={node.id} className="flex w-full flex-col items-center">
                  {showHeader && (
                    <div className="mb-10 mt-6 flex w-full items-center gap-4">
                      <div className="h-px flex-1 bg-edge" />
                      <span className="text-xs font-bold uppercase tracking-[0.2em] text-mute">
                        {KIND_LABEL[node.group.kind]}
                      </span>
                      <div className="h-px flex-1 bg-edge" />
                    </div>
                  )}
                  <div className="mb-5 flex flex-col items-center gap-1.5" style={{ transform: `translateX(${x}px)` }}>
                    <div className="relative">
                      {current && (
                        <span className="absolute -top-9 left-1/2 -translate-x-1/2 animate-float whitespace-nowrap rounded-xl border-2 border-sharin bg-panel px-3 py-1 text-xs font-extrabold text-sharin-glow">
                          MULAI
                        </span>
                      )}
                      <button
                        disabled={!unlocked}
                        onClick={() => onLesson(node)}
                        aria-label={`Pelajaran ${node.group.label}`}
                        className={`font-jp relative grid size-20 cursor-pointer place-items-center rounded-full text-4xl font-black transition active:translate-y-1 disabled:cursor-not-allowed ${
                          !unlocked
                            ? 'bg-panel-2 text-mute/50 shadow-[0_6px_0_var(--color-edge)]'
                            : stars
                              ? 'bg-sharin text-white shadow-[0_6px_0_var(--color-sharin-dark)] hover:brightness-110'
                              : 'bg-sharin-glow text-white shadow-[0_6px_0_var(--color-sharin-dark)] ring-4 ring-sharin/30 hover:brightness-110'
                        }`}
                      >
                        {unlocked ? node.group.kana[0].char : (
                          <svg viewBox="0 0 24 24" width="30" height="30" fill="currentColor">
                            <path d="M7 10V8a5 5 0 0110 0v2h1a1 1 0 011 1v9a1 1 0 01-1 1H6a1 1 0 01-1-1v-9a1 1 0 011-1zm2 0h6V8a3 3 0 00-6 0z" />
                          </svg>
                        )}
                      </button>
                    </div>
                    <span className="text-xs font-extrabold tracking-widest text-mute">{node.group.label}</span>
                    {stars > 0 && <Stars n={stars} />}
                  </div>
                </li>
              )
            })}
          </ol>
        </section>

        {/* kolom samping */}
        <aside className="order-1 flex flex-col gap-4 lg:order-2 lg:sticky lg:top-20 lg:self-start">
          <div className="card p-5">
            <div className="mb-2 flex items-center justify-between">
              <h2 className="text-sm font-extrabold uppercase tracking-widest">Target harian</h2>
              <span className="text-sm font-bold text-gold">
                {Math.min(todayXp, DAILY_GOAL)}/{DAILY_GOAL} XP
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-panel-2">
              <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${goalPct}%` }} />
            </div>
            <p className="mt-2 text-xs text-mute">
              {goalPct >= 100 ? 'Target hari ini tercapai. Sugoi!' : 'Kumpulkan XP untuk menjaga streak-mu.'}
            </p>
          </div>

          <div className="card relative overflow-hidden p-5">
            <Sharingan level={4} size={120} className="absolute -right-8 -top-8 opacity-30" />
            <h2 className="relative text-lg font-black">Latihan Bebas</h2>
            <p className="relative mt-1 text-sm text-mute">
              Pilih huruf sesukamu, lalu soal acak tanpa henti sampai kamu puas.
            </p>
            <button onClick={onFree} className="btn btn-red relative mt-4 w-full">
              Atur & Mulai
            </button>
          </div>

          <div className="card p-5">
            <h2 className="mb-3 text-sm font-extrabold uppercase tracking-widest">Statistik</h2>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div>
                <p className="text-2xl font-black text-ok">{progress.totalCorrect}</p>
                <p className="text-xs text-mute">Benar</p>
              </div>
              <div>
                <p className="text-2xl font-black text-sharin-glow">{progress.totalWrong}</p>
                <p className="text-xs text-mute">Salah</p>
              </div>
              <div>
                <p className="text-2xl font-black">{accuracy === null ? '–' : `${accuracy}%`}</p>
                <p className="text-xs text-mute">Akurasi</p>
              </div>
            </div>
            {weak.length > 0 && (
              <>
                <h3 className="mb-2 mt-5 text-xs font-bold uppercase tracking-widest text-mute">Perlu diulang</h3>
                <div className="flex flex-wrap gap-2">
                  {weak.map(({ k, rate }) => (
                    <span
                      key={k.id}
                      title={`${k.romaji[0]} · ${Math.round(rate * 100)}% salah`}
                      className="font-jp rounded-lg border border-sharin/40 bg-sharin/10 px-2.5 py-1 text-lg font-bold"
                    >
                      {k.char}
                    </span>
                  ))}
                </div>
              </>
            )}
            <button
              onClick={() => confirm('Hapus semua progres dan statistik?') && onReset()}
              className="mt-5 cursor-pointer text-xs text-mute underline-offset-2 hover:text-sharin-glow hover:underline"
            >
              Reset progres
            </button>
          </div>
        </aside>
      </main>
    </div>
  )
}
