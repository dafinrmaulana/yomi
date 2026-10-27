import { Lightbulb, X } from 'lucide-react'
import type { Advice, AdviceAction } from '../lib/advice'

interface Props {
  advice: Advice
  onApply: (a: AdviceAction) => void
  onDismiss?: () => void
  compact?: boolean
}

/** kartu saran latihan; dipakai di Meja Latihan dan di dalam game */
export default function AdviceCard({ advice, onApply, onDismiss, compact }: Props) {
  return (
    <div className="card animate-rise relative border-gold/40 p-4 text-left" role="status">
      <div className="flex items-start gap-3">
        <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
          <Lightbulb size={16} strokeWidth={2.5} aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-gold">Saran</p>
          <p className="font-display text-base font-extrabold leading-tight">{advice.title}</p>
          {!compact && <p className="mt-1 text-sm text-[#cdb88f]">{advice.body}</p>}
          <div className="mt-3 flex flex-wrap gap-2">
            {advice.actions.map((a) => (
              <button key={a.label} className="btn btn-ghost !px-3 !py-1.5 !text-xs" onClick={() => onApply(a)}>
                {a.label}
              </button>
            ))}
          </div>
        </div>
        {onDismiss && (
          <button
            onClick={onDismiss}
            aria-label="Tutup saran"
            className="grid size-8 shrink-0 cursor-pointer place-items-center rounded-lg text-mute transition hover:bg-panel-2 hover:text-bone"
          >
            <X size={16} strokeWidth={2.5} aria-hidden />
          </button>
        )}
      </div>
    </div>
  )
}
