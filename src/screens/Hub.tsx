import AppHeader from '../components/AppHeader'
import Petals from '../components/Petals'
import Torii from '../components/Torii'
import { useApp } from '../lib/app-context'
import { rankFor } from '../lib/rank'
import { Link } from '../lib/router'
import { dayKey } from '../lib/storage'

interface Item {
  to?: string
  title: string
  desc: string
  glyph: string
  note?: string
  rot: number
  /** fitur utama: kertas diberi aksen merah */
  featured?: boolean
}

export default function Hub() {
  const { progress, todayXp } = useApp()
  const { rank, next, pct } = rankFor(progress.xp)
  const today = dayKey()
  const due = Object.values(progress.srs).filter((c) => c.due <= today).length

  // urutan: fitur yang paling sering dipakai di depan, papan misi setelah tulis
  const items: Item[] = [
    {
      to: '/practice',
      title: 'Latihan Bebas',
      desc: 'Pilih sendiri hurufnya, per huruf atau gabungan acak, lalu berlatih tanpa henti sampai puas.',
      glyph: '練',
      note: 'Tanpa batas',
      rot: -1.2,
      featured: true,
    },
    {
      to: '/write',
      title: 'Tulis',
      desc: 'Semua huruf dengan urutan goresan langkah demi langkah, plus latihan menulis yang diperiksa.',
      glyph: '書',
      note: 'Hiragana & katakana',
      rot: 1.2,
      featured: true,
    },
    { to: '/missions', title: 'Papan Misi', desc: 'Misi bertahap dengan nyawa dan bintang. Hafalkan hiragana dan katakana dari awal.', glyph: '読', rot: -1.4 },
    {
      to: '/review',
      title: 'Ulangan Harian',
      desc: 'Ulangi huruf yang hampir terlupa dengan jarak waktu yang pas.',
      glyph: '習',
      note: due ? `${due} huruf menunggu` : 'Tidak ada yang menunggu',
      rot: 1,
    },
    { to: '/stats', title: 'Statistik', desc: 'Kalender latihan, peta penguasaan huruf, pangkat, dan lencana.', glyph: '記', rot: -1.1 },
    { title: 'Kosakata', desc: 'Belajar kata-kata sehari-hari dengan huruf yang sudah kamu kuasai.', glyph: '語', rot: 1.3 },
    { title: 'Kanji Dasar', desc: 'Kanji level pemula lengkap dengan urutan goresannya.', glyph: '漢', rot: -0.9 },
  ]

  return (
    <div className="bg-seigaiha relative min-h-dvh">
      <Petals />
      <AppHeader />
      <main className="relative z-10 mx-auto max-w-5xl px-4 pb-24 pt-6">
        <div className="plank relative mb-8 overflow-hidden rounded-xl px-6 py-6">
          <Torii className="absolute -right-3 bottom-0 h-28 text-black/25" />
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sharin-glow">Dojo Yomi</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold sm:text-4xl">Mau belajar apa hari ini?</h1>

          <Link to="/stats" className="mt-4 block max-w-md">
            <div className="flex items-baseline justify-between text-sm">
              <span className="font-bold text-bone">{rank.name}</span>
              <span className="text-[#cdb88f]">{next ? `${progress.xp}/${next.min} XP ke ${next.name}` : 'Pangkat tertinggi'}</span>
            </div>
            <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-black/40">
              <div className="h-full rounded-full bg-gold transition-all duration-700" style={{ width: `${pct}%` }} />
            </div>
          </Link>
          <p className="mt-2 text-xs text-[#b9a782]">Hari ini: {todayXp} XP</p>
        </div>

        <div className="board">
          <div className="grid gap-x-7 gap-y-10 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((it) => {
              const body = (
                <>
                  <span className="font-jp pointer-events-none absolute -right-1 -top-2 select-none text-[6.5rem] font-black leading-none text-black/[0.07]">
                    {it.glyph}
                  </span>
                  <h2 className="font-display relative text-2xl font-extrabold">{it.title}</h2>
                  <p className="relative mt-1.5 min-h-12 text-sm leading-snug text-[#5e503c]">{it.desc}</p>
                  <div className="relative mt-4 flex items-center justify-between text-sm font-extrabold">
                    {it.to ? (
                      <>
                        <span className="text-[#8f1623]">{it.featured ? 'Mulai berlatih →' : 'Buka →'}</span>
                        {it.note && <span className="text-xs font-semibold text-[#5e503c]">{it.note}</span>}
                      </>
                    ) : (
                      <span className="text-xs font-semibold text-[#6b5c45]">Belum tersedia</span>
                    )}
                  </div>
                  {!it.to && <span className="stamp !top-3 !text-base">SEGERA</span>}
                </>
              )
              const cls = `note relative block overflow-hidden p-5 pt-7 ${it.to ? '' : 'note-locked'} ${it.featured ? 'outline outline-2 outline-offset-0 outline-[#b3202f]/80' : ''}`
              const style = { ['--rot' as string]: `${it.rot}deg` }
              return (
                <div key={it.title} className="note-wrap">
                  <span className="pin" />
                  {it.to ? (
                    <Link to={it.to} className={cls} style={style}>
                      {body}
                    </Link>
                  ) : (
                    <div className={cls} style={style} aria-disabled>
                      {body}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
