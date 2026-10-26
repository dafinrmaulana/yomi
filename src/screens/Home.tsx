import { useState } from 'react'
import Petals from '../components/Petals'
import Sharingan from '../components/Sharingan'
import Torii from '../components/Torii'
import { KANA_BY_ID, KIND_LABEL, SCRIPT_LABEL, type Script } from '../lib/kana'
import { isUnlocked, nodesFor, type PathNode } from '../lib/path'
import MissionNote from '../components/MissionNote'
import { ConfirmDialog } from '../components/Modal'
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

const KINDS = ['dasar', 'dakuten', 'yoon'] as const

export default function Home({ progress, streak, todayXp, onLesson, onFree, onToggleMute, onReset }: Props) {
  const [script, setScript] = useState<Script>('hiragana')
  const [askReset, setAskReset] = useState(false)
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
        {/* papan misi */}
        <section className="order-2 lg:order-1">
          <div className="plank relative mb-5 overflow-hidden rounded-xl px-6 py-5">
            <Torii className="absolute -right-3 bottom-0 h-24 text-black/25" />
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sharin-glow">Papan Misi</p>
            <h1 className="mt-1 text-2xl font-black sm:text-3xl">Ambil misi, baca setiap huruf.</h1>
            <p className="mt-1 max-w-md text-sm text-[#cdb88f]">
              Pilih satu kertas misi dari papan. Selesaikan 10 soal dan jaga 5 nyawamu untuk mendapat stempel.
            </p>
          </div>

          <div className="tabs mb-5" role="tablist" aria-label="Pilih papan">
            {(['hiragana', 'katakana'] as Script[]).map((s) => (
              <button key={s} role="tab" aria-selected={script === s} onClick={() => setScript(s)} className="tab">
                Papan {SCRIPT_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="board">
            {KINDS.map((kind) => {
              const group = nodes.filter((n) => n.group.kind === kind)
              return (
                <div key={kind} className="mb-10 last:mb-0">
                  <div className="plank mx-auto mb-9 w-fit rounded-lg px-5 py-1.5 text-center text-xs font-extrabold uppercase tracking-[0.2em]">
                    {KIND_LABEL[kind]}
                  </div>
                  <div className="grid gap-x-6 gap-y-9 sm:grid-cols-2">
                    {group.map((node) => (
                      <MissionNote
                        key={node.id}
                        node={node}
                        number={node.index + 1}
                        stars={progress.completed[node.id] ?? 0}
                        unlocked={isUnlocked(node, progress.completed)}
                        onAccept={() => onLesson(node)}
                      />
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
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
            <button onClick={onFree} className="btn btn-gold relative mt-4 w-full">
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
              onClick={() => setAskReset(true)}
              className="mt-5 cursor-pointer text-xs text-mute underline-offset-2 hover:text-sharin-glow hover:underline"
            >
              Reset progres
            </button>
          </div>
        </aside>
      </main>

      <ConfirmDialog
        open={askReset}
        title="Hapus semua progres?"
        message="XP, streak, bintang misi, dan statistik huruf akan dihapus dari perangkat ini. Tindakan ini tidak bisa dibatalkan."
        confirmLabel="Ya, hapus"
        onCancel={() => setAskReset(false)}
        onConfirm={() => {
          setAskReset(false)
          onReset()
        }}
      />
    </div>
  )
}
