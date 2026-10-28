import Hearts from '../../components/Hearts'
import Sharingan from '../../components/Sharingan'
import type { Mangekyo } from '../../lib/eye'
import type { QuizConfig } from '../../lib/quiz'

interface Props {
  config: QuizConfig
  /** 0–100, null bila sesi tanpa batas soal */
  progress: number | null
  hearts: number
  elapsed: number
  combo: number
  eye: { level: number; variant: Mangekyo; pulse: boolean }
  canFinish: boolean
  onExit: () => void
  onFinish: () => void
  /** hanya Latihan Bebas */
  onSwitchMode?: () => void
}

/** bar atas kuis: keluar, kemajuan, ganti mode, selesai, nyawa, waktu soal, dan combo */
export default function QuizTopBar({ config, progress, hearts, elapsed, combo, eye, canFinish, onExit, onFinish, onSwitchMode }: Props) {
  return (
    <div className="flex items-center gap-2 sm:gap-3">
      <button
        onClick={onExit}
        className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-mute transition hover:bg-panel-2 hover:text-bone"
        aria-label="Keluar tanpa menyimpan"
        title="Keluar tanpa menyimpan"
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
          <path d="M6 6l12 12M18 6L6 18" />
        </svg>
      </button>

      {progress !== null ? (
        <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-panel-2">
          <div className="h-full rounded-full bg-sharin transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      ) : (
        <div className="flex-1" />
      )}

      {onSwitchMode && (
        <button
          onClick={onSwitchMode}
          title="Ganti mode (Tab)"
          className="cursor-pointer shrink-0 rounded-lg border border-[#4d3727] px-2.5 py-1.5 text-xs font-bold text-mute transition hover:border-sharin hover:text-bone"
        >
          <span className="hidden sm:inline">{config.mode === 'single' ? 'Per huruf' : 'Gabungan'} </span>⇄
          <span className="hidden sm:inline"> {config.mode === 'single' ? 'Gabungan' : 'Per huruf'} · Tab</span>
        </button>
      )}
      {canFinish && (
        <button onClick={onFinish} className="btn btn-ghost shrink-0 !px-3 !py-1.5 !text-xs" title="Akhiri sesi dan lihat hasil">
          Selesai
        </button>
      )}
      {config.hearts && <Hearts left={hearts} />}
      <div
        className="min-w-12 shrink-0 rounded-lg border border-[#4d3727] px-1.5 py-1 text-center text-sm font-extrabold tabular-nums text-bone"
        title="Waktu soal ini"
      >
        {(elapsed / 1000).toFixed(1)}s
      </div>
      <div className="flex shrink-0 items-center gap-1.5" title={`Combo ${combo}`}>
        <Sharingan level={eye.level} variant={eye.variant} pulse={eye.pulse} size={30} />
        <span className="min-w-5 text-sm font-extrabold tabular-nums">{combo}</span>
        <span className="hidden text-[10px] font-bold uppercase tracking-widest text-mute sm:inline">Combo</span>
      </div>
    </div>
  )
}
