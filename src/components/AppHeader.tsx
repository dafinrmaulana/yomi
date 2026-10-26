import { Flame, Volume2, VolumeX } from 'lucide-react'
import { useApp } from '../lib/app-context'
import { rankFor } from '../lib/rank'
import { Link } from '../lib/router'
import Sharingan from './Sharingan'

export default function AppHeader() {
  const { progress, patch, liveStreak } = useApp()
  const { rank } = rankFor(progress.xp)
  return (
    <header className="sticky top-0 z-30 border-b border-edge bg-ink/85 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Menu utama">
          <Sharingan level={3} size={34} />
          <span className="text-xl font-black tracking-wide">Yomi</span>
          <span className="font-jp hidden text-sm text-mute min-[360px]:inline">読み</span>
        </Link>
        <div className="flex items-center gap-1.5 text-sm font-extrabold sm:gap-2">
          <span className="flex items-center gap-1.5 rounded-xl bg-panel px-3 py-1.5" title="Streak harian">
            <Flame size={16} className={liveStreak ? 'fill-gold/30 text-gold' : 'text-mute'} aria-hidden />
            <span className={liveStreak ? 'text-gold' : 'text-mute'}>{liveStreak}</span>
          </span>
          <Link to="/stats" className="whitespace-nowrap rounded-xl bg-panel px-3 py-1.5 text-sharin-glow" title={`Pangkat ${rank.name}`}>
            {progress.xp} <span className="text-xs text-mute">XP</span>
            <span className="ml-2 hidden text-xs font-bold text-[#cdb88f] sm:inline">{rank.name}</span>
          </Link>
          <button
            onClick={() => patch({ mute: !progress.mute })}
            className="grid size-9 cursor-pointer place-items-center rounded-xl bg-panel text-mute transition hover:text-bone"
            title={progress.mute ? 'Suara mati' : 'Suara menyala'}
            aria-label="Suara"
          >
            {progress.mute ? <VolumeX size={18} aria-hidden /> : <Volume2 size={18} aria-hidden />}
          </button>
        </div>
      </div>
    </header>
  )
}
