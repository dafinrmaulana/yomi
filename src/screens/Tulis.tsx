import { ChevronDown, Search, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Modal } from '../components/Modal'
import Page from '../components/Page'
import StrokeAnimator, { StepsGrid, StrokeSteps } from '../components/StrokeAnimator'
import { SCRIPT_LABEL, type Script } from '../lib/kana'
import { Link } from '../lib/router'
import { useStrokes, type StrokeData } from '../lib/strokes'
import { allWriteChars, writeSections, type WriteChar, type WriteRow } from '../lib/tulis'

const SCRIPTS: Script[] = ['hiragana', 'katakana']

/** pilihan filter baris, dikelompokkan per bagian (baris sama untuk hiragana dan katakana) */
const ROW_OPTIONS = writeSections('hiragana').map((sec) => ({
  title: sec.title,
  rows: sec.rows.map((r) => ({ id: r.id, title: r.title })),
}))

/** satu huruf = satu baris: identitas di kiri, langkah di tengah, tombol di kanan (padat supaya satu baris konsonan muat di layar) */
function CharCard({ c, data, practiceTo, onSteps, onAnimate }: { c: WriteChar; data?: StrokeData; practiceTo: string; onSteps: (step: number) => void; onAnimate: () => void }) {
  return (
    <article className="rounded-lg border border-[#3a2a20] bg-[#15100c]/90 p-3 md:flex md:items-center md:gap-5">
      <header className="mb-3 flex items-baseline justify-between gap-3 md:mb-0 md:block md:w-28 md:shrink-0">
        <div className="flex items-baseline gap-3 md:block">
          <span className="font-jp block text-5xl font-bold leading-none">{c.char}</span>
          <span className="text-base font-bold text-[#cdb88f] md:mt-1.5 md:block">{c.romaji}</span>
        </div>
        {data && <span className="text-xs text-[#8f7f66] md:block">{data.s.length} goresan</span>}
      </header>

      <div className="min-w-0 flex-1">
        {data ? <StrokeSteps data={data} onPick={onSteps} itemClass="max-w-[88px]" /> : <div className="aspect-[5/1] rounded bg-[#120c09]" />}
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 md:mt-0 md:flex md:shrink-0">
        <button className="pill md:!flex-none md:px-4" onClick={() => onSteps(0)} disabled={!data}>
          Langkah
        </button>
        <button className="pill md:!flex-none md:px-4" onClick={onAnimate} disabled={!data}>
          Animasi
        </button>
        <Link to={practiceTo} className="pill pill-accent md:!flex-none md:px-4">
          Latihan
        </Link>
      </div>
    </article>
  )
}

export default function Tulis() {
  const strokes = useStrokes()
  const [view, setView] = useState<{ c: WriteChar; mode: 'steps' | 'anim'; step: number } | null>(null)

  // bilah tab berubah gaya hanya saat sudah menempel di bawah header
  const sentinel = useRef<HTMLDivElement>(null)
  const [stuck, setStuck] = useState(false)
  useEffect(() => {
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setStuck(!e.isIntersecting), { rootMargin: '-62px 0px 0px 0px' })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  // cari: cocokkan bacaan (ka, shi) atau hurufnya langsung (か)
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const [rowFilter, setRowFilter] = useState('')
  const match = (c: WriteChar) => !q || c.romaji.includes(q) || c.char.includes(query.trim())
  const shown = SCRIPTS.map((script) => ({
    script,
    sections: writeSections(script)
      .map((sec) => ({
        ...sec,
        rows: sec.rows
          .filter((r) => !rowFilter || r.id === rowFilter)
          .map((r) => ({ ...r, chars: r.chars.filter(match) }))
          .filter((r) => r.chars.length > 0),
      }))
      .filter((sec) => sec.rows.length > 0),
  }))
  const has = (s: Script) => shown.find((x) => x.script === s)!.sections.length > 0
  const total = shown.reduce((n, x) => n + x.sections.reduce((m, sec) => m + sec.rows.reduce((k, r) => k + r.chars.length, 0), 0), 0)
  const rowSet = (script: Script, row: WriteRow) => `?set=row-${script}-${row.id}`

  // tab mengganti skrip yang ditampilkan (bukan menggulir); skrip tanpa hasil pencarian dilewati
  const [active, setActive] = useState<Script>('hiragana')
  const current: Script = has(active) ? active : has(SCRIPTS.find((s) => s !== active)!) ? SCRIPTS.find((s) => s !== active)! : active

  const jump = (s: Script) => {
    setActive(s)
    window.scrollTo({ top: 0 })
  }

  return (
    <Page eyebrow="Tulis" title="Tulis" bare>
      <div ref={sentinel} aria-hidden className="h-px" />
      <nav className="sticky top-[60px] z-20 -mx-4 mb-6" aria-label="Navigasi huruf">
        {/* latar selebar layar, sama dengan navbar di atasnya; isi tetap sejajar dengan isi navbar */}
        <div
          aria-hidden
          className={`absolute inset-y-0 left-1/2 -z-10 w-screen -translate-x-1/2 border-b transition-colors duration-300 ${
            stuck ? 'border-edge bg-ink/85 backdrop-blur' : 'border-transparent bg-transparent'
          }`}
        />
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5">
          <div className="tabs h-11 w-52 grow sm:grow-0" role="tablist" aria-label="Loncat ke skrip">
            {SCRIPTS.map((s) => (
              <button
                key={s}
                role="tab"
                aria-selected={current === s}
                disabled={!has(s)}
                className="tab !py-0 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => jump(s)}
              >
                {SCRIPT_LABEL[s]}
              </button>
            ))}
          </div>

          <div className="relative min-w-[140px] flex-1 sm:max-w-[200px] sm:flex-none">
            <select
              value={rowFilter}
              onChange={(e) => setRowFilter(e.target.value)}
              aria-label="Filter baris"
              className="h-11 w-full cursor-pointer appearance-none rounded-md border border-[#3a2a20] bg-[#120c09]/80 py-0 pl-3 pr-8 text-sm text-bone outline-none transition focus:border-sharin"
            >
              <option value="">Semua baris</option>
              {ROW_OPTIONS.map((sec) => (
                <optgroup key={sec.title} label={sec.title}>
                  {sec.rows.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.title}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown size={16} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8f7f66]" aria-hidden />
          </div>

          <div className="relative ml-auto min-w-[140px] flex-1 sm:max-w-[280px]">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#8f7f66]" aria-hidden />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Cari huruf…"
              aria-label="Cari huruf"
              autoComplete="off"
              spellCheck={false}
              className="h-11 w-full rounded-md border border-[#3a2a20] bg-[#120c09]/80 py-0 pl-9 pr-8 text-sm text-bone outline-none transition placeholder:text-[#8f7f66] focus:border-sharin [&::-webkit-search-cancel-button]:hidden"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Hapus pencarian"
                className="absolute right-2 top-1/2 grid size-5 -translate-y-1/2 cursor-pointer place-items-center rounded text-[#8f7f66] hover:text-bone"
              >
                <X size={14} aria-hidden />
              </button>
            )}
          </div>
        </div>
      </nav>

      {(q || rowFilter) && total === 0 && (
        <p className="rounded-lg border border-[#3a2a20] bg-[#120c09]/70 p-6 text-center text-[#cdb88f]">
          Tidak ada huruf yang cocok{q ? ` dengan “${query.trim()}”` : ''}{rowFilter ? ' di baris ini' : ''}.
        </p>
      )}

      {shown
        .filter((x) => x.script === current && x.sections.length > 0)
        .map(({ script, sections }) => {
          const all = allWriteChars(script)
          return (
            <section key={script} id={script} className="scroll-mt-36">
              <h2 className="font-display mb-2 text-4xl font-extrabold">{SCRIPT_LABEL[script]}</h2>
              <p className="mb-8 max-w-xl text-sm text-[#b9a782]">Titik merah menandai awal tiap goresan. Ketuk Langkah untuk melihatnya lebih besar.</p>

              {sections.map((sec) =>
                sec.rows.map((row, ri) => (
                  <section
                    key={`${sec.kind}-${row.id}`}
                    className="mb-8 flex flex-col justify-center border-t border-[#3a2a20] pb-2 pt-6 md:min-h-[calc(100dvh-190px)]"
                  >
                    <header className="mb-4">
                      {ri === 0 && <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-sharin-glow">{sec.title}</p>}
                      <h3 className="font-display mt-1 text-3xl font-extrabold">{row.title}</h3>
                      <p className="mt-0.5 text-sm text-[#b9a782]">{row.chars.map((c) => c.romaji).join(' · ')}</p>
                    </header>

                    <div className="space-y-3">
                      {row.chars.map((c) => (
                        <CharCard
                          key={c.code}
                          c={c}
                          data={strokes?.[c.char]}
                          practiceTo={`/write/${c.code}${rowSet(script, row)}`}
                          onSteps={(step) => setView({ c, mode: 'steps', step })}
                          onAnimate={() => setView({ c, mode: 'anim', step: 0 })}
                        />
                      ))}
                    </div>

                    <footer className="mt-4 flex md:justify-end">
                      <Link
                        to={`/write/${row.chars[0].code}${rowSet(script, row)}`}
                        className="btn btn-ghost w-full md:w-auto"
                      >
                        Latihan baris ini · {row.chars.length} huruf
                      </Link>
                    </footer>
                  </section>
                )),
              )}

              {!q && !rowFilter && (
                <div className="mb-16 mt-6 rounded-xl border border-[#4d3727] bg-[#15100c]/80 p-6 text-center">
                  <p className="font-display text-xl font-extrabold">Sudah hafal semua?</p>
                  <p className="mx-auto mt-1 max-w-sm text-sm text-[#b9a782]">Tulis semua {SCRIPT_LABEL[script]} berurutan, satu per satu.</p>
                  <Link to={`/write/${all[0].code}?set=all-${script}`} className="btn btn-red mt-4">
                    Latihan semua {SCRIPT_LABEL[script]} · {all.length} huruf
                  </Link>
                </div>
              )}
            </section>
          )
        })}

      <p className="mt-14 text-xs leading-relaxed text-[#8f7f66]">
        Data urutan goresan berasal dari{' '}
        <a className="underline hover:text-bone" href="https://kanjivg.tagaini.net" target="_blank" rel="noreferrer">
          KanjiVG
        </a>{' '}
        © Ulrich Apel, berlisensi{' '}
        <a className="underline hover:text-bone" href="https://creativecommons.org/licenses/by-sa/3.0/" target="_blank" rel="noreferrer">
          CC BY-SA 3.0
        </a>
        .
      </p>

      <Modal
        open={view !== null}
        wide={view?.mode === 'steps'}
        title={view ? `${view.c.char} · ${view.c.romaji}` : ''}
        onClose={() => setView(null)}
        footer={
          <button className="btn btn-ghost" onClick={() => setView(null)}>
            Tutup
          </button>
        }
      >
        {view && strokes?.[view.c.char] && (
          <div className="mt-3">
            {view.mode === 'steps' ? (
              <StepsGrid data={strokes[view.c.char]} />
            ) : (
              <StrokeAnimator key={view.c.code} data={strokes[view.c.char]} />
            )}
          </div>
        )}
      </Modal>
    </Page>
  )
}
