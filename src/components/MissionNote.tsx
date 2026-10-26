import { groupTitle } from '../lib/kana'
import type { PathNode } from '../lib/path'

interface Props {
  node: PathNode
  number: number
  stars: number
  unlocked: boolean
  onAccept: () => void
}

const ROTATIONS = [-1.6, 1.3, -0.8, 1.8, -1.2, 0.9]

const RANK: Record<PathNode['group']['kind'], (i: number) => string> = {
  dasar: (i) => (i < 5 ? 'D' : 'C'),
  dakuten: () => 'B',
  yoon: () => 'A',
}

function Stars({ n }: { n: number }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} bintang`}>
      {[1, 2, 3].map((i) => (
        <svg key={i} viewBox="0 0 24 24" width="17" height="17" className={i <= n ? 'text-[#b8841c]' : 'text-black/15'} fill="currentColor">
          <path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18l-6.5 4 1.7-7.4-5.7-5L9 8.9z" />
        </svg>
      ))}
    </div>
  )
}

export default function MissionNote({ node, number, stars, unlocked, onAccept }: Props) {
  const { group } = node
  const done = stars > 0
  const rank = RANK[group.kind](node.index)

  return (
    <div className="note-wrap">
    <span className="pin" />
    <article
      className={`note p-4 pb-5 pt-6 ${unlocked ? '' : 'note-locked'}`}
      style={{ ['--rot' as string]: `${ROTATIONS[number % ROTATIONS.length]}deg` }}
    >
      {done && <span className="stamp">SELESAI</span>}

      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-[10px] font-extrabold tracking-[0.22em] text-[#7a6a52]">
            MISI {String(number).padStart(2, '0')}
          </p>
          <h3 className="text-lg font-black leading-tight">
            {groupTitle(group)}
          </h3>
        </div>
        <span className="shrink-0 rounded border-2 border-[#1b1410]/70 px-1.5 py-0.5 text-[10px] font-black tracking-widest">
          RANK {rank}
        </span>
      </div>

      <div className="font-jp my-3 flex flex-wrap gap-x-3 gap-y-1 text-2xl font-bold">
        {group.kana.map((k) => (
          <span key={k.id}>{k.char}</span>
        ))}
      </div>

      <dl className="mb-4 space-y-0.5 text-xs text-[#5e503c]">
        <div className="flex justify-between border-b border-dashed border-black/15 pb-0.5">
          <dt>Huruf</dt>
          <dd className="font-bold text-[#1b1410]">{group.kana.length}</dd>
        </div>
        <div className="flex justify-between border-b border-dashed border-black/15 pb-0.5">
          <dt>Soal · nyawa</dt>
          <dd className="font-bold text-[#1b1410]">10 · 5</dd>
        </div>
        <div className="flex justify-between">
          <dt>Hadiah</dt>
          <dd className="font-bold text-[#8f1623]">+20 XP bonus</dd>
        </div>
      </dl>

      <div className="flex items-center justify-between gap-2">
        {done ? <Stars n={stars} /> : <span className="text-[11px] font-semibold text-[#7a6a52]">{unlocked ? 'Belum diambil' : 'Terkunci'}</span>}
        <button
          disabled={!unlocked}
          onClick={onAccept}
          className={`btn btn-sm ${!unlocked ? 'btn-paper-off' : done ? 'btn-ink' : 'btn-red'}`}
        >
          {!unlocked ? 'Terkunci' : done ? 'Ulangi misi' : 'Terima misi'}
        </button>
      </div>
      {!unlocked && <p className="mt-2 text-[11px] text-[#5e503c]">Selesaikan misi {String(number - 1).padStart(2, '0')} dulu.</p>}
    </article>
    </div>
  )
}
