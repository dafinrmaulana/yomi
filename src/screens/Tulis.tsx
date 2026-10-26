import { Search, X } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { Modal } from '../components/Modal'
import Page from '../components/Page'
import StrokeAnimator, { StepsGrid, StrokeSteps } from '../components/StrokeAnimator'
import { SCRIPT_LABEL, type Script } from '../lib/kana'
import { Link } from '../lib/router'
import { useStrokes, type StrokeData } from '../lib/strokes'
import { writeSections, type WriteChar } from '../lib/tulis'

const SCRIPTS: Script[] = ['hiragana', 'katakana']

function CharCard({ c, data, onSteps, onAnimate }: { c: WriteChar; data?: StrokeData; onSteps: (step: number) => void; onAnimate: () => void }) {
  return (
    <article className="rounded-lg border border-[#3a2a20] bg-[#15100c]/90 p-3">
      <header className="mb-2.5 flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-2.5">
          <span className="font-jp text-3xl font-bold leading-none">{c.char}</span>
          <span className="text-sm font-semibold text-[#cdb88f]">{c.romaji}</span>
        </div>
        {data && <span className="text-xs text-[#8f7f66]">{data.s.length} goresan</span>}
      </header>
      {data ? <StrokeSteps data={data} onPick={onSteps} /> : <div className="aspect-[5/1] rounded bg-[#120c09]" />}
      <div className="mt-3 flex gap-2">
        <button className="pill" onClick={() => onSteps(0)} disabled={!data}>
          Langkah
        </button>
        <button className="pill" onClick={onAnimate} disabled={!data}>
          Animasi
        </button>
        <Link to={`/write/${c.code}`} className="pill pill-accent">
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
  const match = (c: WriteChar) => !q || c.romaji.includes(q) || c.char.includes(query.trim())
  const shown = SCRIPTS.map((script) => ({
    script,
    sections: writeSections(script)
      .map((sec) => ({ ...sec, chars: sec.rows.flatMap((r) => r.chars).filter(match) }))
      .filter((sec) => sec.chars.length > 0),
  }))
  const has = (s: Script) => shown.find((x) => x.script === s)!.sections.length > 0
  const total = shown.reduce((n, x) => n + x.sections.reduce((m, sec) => m + sec.chars.length, 0), 0)

  // tab aktif mengikuti bagian yang terlihat. Saat tab diklik langsung aktif, dan scrollspy dikunci
  // sampai scroll halusnya benar-benar berhenti (tidak ada event scroll selama 150 md), supaya tidak berkedip.
  const [active, setActive] = useState<Script>('hiragana')
  const locked = useRef(false)
  const timer = useRef(0)
  const raf = useRef(0)

  const spy = useCallback(() => {
    raf.current = 0
    if (locked.current) return
    const h = document.getElementById('hiragana')
    const k = document.getElementById('katakana')
    setActive(!h ? 'katakana' : k && k.getBoundingClientRect().top <= 170 ? 'katakana' : 'hiragana')
  }, [])

  const unlockSoon = useCallback(
    (ms: number) => {
      clearTimeout(timer.current)
      timer.current = window.setTimeout(() => {
        locked.current = false
        spy()
      }, ms)
    },
    [spy],
  )

  useEffect(() => {
    const onScroll = () => {
      if (locked.current) unlockSoon(150)
      else if (!raf.current) raf.current = requestAnimationFrame(spy)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf.current)
      clearTimeout(timer.current)
    }
  }, [spy, unlockSoon])

  // jika hasil pencarian berubah, hitung ulang tab aktif
  useEffect(() => {
    spy()
  }, [q, spy])

  const jump = (s: Script) => {
    setActive(s)
    locked.current = true
    unlockSoon(400)
    document.getElementById(s)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
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
                aria-selected={active === s}
                disabled={!has(s)}
                className="tab !py-0 disabled:cursor-not-allowed disabled:opacity-40"
                onClick={() => jump(s)}
              >
                {SCRIPT_LABEL[s]}
              </button>
            ))}
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

      {q && total === 0 && (
        <p className="rounded-lg border border-[#3a2a20] bg-[#120c09]/70 p-6 text-center text-[#cdb88f]">
          Tidak ada huruf yang cocok dengan “{query.trim()}”.
        </p>
      )}

      {shown
        .filter((x) => x.sections.length > 0)
        .map(({ script, sections }, idx, arr) => (
          <section key={script} id={script} className="scroll-mt-36">
            <h2 className="font-display mb-6 text-3xl font-extrabold">{SCRIPT_LABEL[script]}</h2>
            <div className="space-y-10">
              {sections.map((sec) => (
                <div key={sec.kind}>
                  <h3 className="font-display mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#cdb88f]">{sec.title}</h3>
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {sec.chars.map((c) => (
                      <CharCard
                        key={c.code}
                        c={c}
                        data={strokes?.[c.char]}
                        onSteps={(step) => setView({ c, mode: 'steps', step })}
                        onAnimate={() => setView({ c, mode: 'anim', step: 0 })}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {idx < arr.length - 1 && <div className="my-14 h-px bg-[#3a2a20]" />}
          </section>
        ))}

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
