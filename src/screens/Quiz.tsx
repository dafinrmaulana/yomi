import { useCallback, useEffect, useRef, useState } from 'react'
import Hearts from '../components/Hearts'
import Sharingan, { sharinganLevel } from '../components/Sharingan'
import { KANA_BY_ID } from '../lib/kana'
import {
  makeQuestion,
  pickPraise,
  questionXp,
  starsFor,
  type Question,
  type QuizConfig,
  type QuizResult,
} from '../lib/quiz'
import { display, longestPrefix, matchesSequence } from '../lib/romaji'
import { sfx } from '../lib/sound'

interface Props {
  config: QuizConfig
  stats: Record<string, { r: number; w: number }>
  mute: boolean
  onFinish: (r: QuizResult) => void
  onExit: () => void
}

type Status = 'idle' | 'ok' | 'bad'

export default function Quiz({ config, stats, mute, onFinish, onExit }: Props) {
  const session = useRef<Record<string, { r: number; w: number }>>({})
  const startedAt = useRef(Date.now())
  const inputRef = useRef<HTMLInputElement>(null)

  const merged = useCallback(() => {
    const out = { ...stats }
    for (const [id, s] of Object.entries(session.current)) {
      const o = out[id] ?? { r: 0, w: 0 }
      out[id] = { r: o.r + s.r, w: o.w + s.w }
    }
    return out
  }, [stats])

  const [q, setQ] = useState<Question>(() => makeQuestion(config, stats))
  const [qNo, setQNo] = useState(1)
  const [input, setInput] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [praise, setPraise] = useState('')
  const [correct, setCorrect] = useState(0)
  const [wrong, setWrong] = useState(0)
  const [xp, setXp] = useState(0)
  const [combo, setCombo] = useState(0)
  const [maxCombo, setMaxCombo] = useState(0)
  const [hearts, setHearts] = useState(5)
  const [xpPop, setXpPop] = useState<{ n: number; key: number } | null>(null)

  const answered = correct + wrong
  const level = sharinganLevel(combo)
  const play = (fn: () => void) => {
    if (!mute) fn()
  }

  const finish = (failed: boolean) => {
    const weak = Object.entries(session.current)
      .filter(([, s]) => s.w > 0)
      .sort((a, b) => b[1].w - a[1].w)
      .map(([id]) => KANA_BY_ID[id])
      .filter(Boolean)
      .slice(0, 8)
    play(failed ? sfx.fail : sfx.finish)
    onFinish({
      config,
      correct,
      wrong,
      xp,
      maxCombo,
      seconds: Math.round((Date.now() - startedAt.current) / 1000),
      stats: session.current,
      weak,
      failed,
      stars: failed ? 0 : starsFor(correct, wrong),
    })
  }

  const submit = (answer: string) => {
    if (status !== 'idle') return
    const ok = matchesSequence(answer, q.seq)
    const prefix = ok ? q.seq.length : longestPrefix(answer, q.seq)
    q.seq.forEach((k, i) => {
      if (i > prefix) return
      const s = (session.current[k.id] ??= { r: 0, w: 0 })
      if (i < prefix) s.r++
      else s.w++
    })

    if (ok) {
      const gain = questionXp(q.seq.length)
      setStatus('ok')
      setPraise(pickPraise())
      setCorrect((c) => c + 1)
      setXp((x) => x + gain)
      setCombo((c) => c + 1)
      setMaxCombo((m) => Math.max(m, combo + 1))
      setXpPop({ n: gain, key: Date.now() })
      play(() => sfx.correct(combo))
    } else {
      setStatus('bad')
      setWrong((w) => w + 1)
      setCombo(0)
      if (config.hearts) setHearts((h) => h - 1)
      play(sfx.wrong)
    }
  }

  const next = () => {
    if (status === 'idle') return
    if (config.hearts && hearts <= 0) return finish(true)
    if (config.total !== null && answered >= config.total) return finish(false)
    const key = q.seq.map((k) => k.id).join()
    setQ(makeQuestion(config, merged(), key))
    setQNo((n) => n + 1)
    setInput('')
    setPicked(null)
    setStatus('idle')
    setXpPop(null)
  }

  const handleKey = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status !== 'idle') next()
      else if (q.type === 'type' && input.trim()) submit(input)
    } else if (status === 'idle' && q.type === 'choice' && /^[1-4]$/.test(e.key)) {
      const opt = q.options[Number(e.key) - 1]
      if (opt) pick(opt)
    }
  }
  // listener selalu memakai closure terbaru
  const keyRef = useRef(handleKey)
  keyRef.current = handleKey
  useEffect(() => {
    const fn = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  useEffect(() => {
    if (status === 'idle' && q.type === 'type') inputRef.current?.focus()
  }, [status, q])

  const pick = (opt: string) => {
    if (status !== 'idle') return
    setPicked(opt)
    submit(opt)
  }

  const progress = config.total ? Math.min(100, (answered / config.total) * 100) : null
  const long = q.seq.length > 3

  return (
    <div className="relative z-10 mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-4 pb-44 pt-4">
      {/* bar atas */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => (config.total === null && answered > 0 ? finish(false) : onExit())}
          className="grid size-10 shrink-0 cursor-pointer place-items-center rounded-xl text-mute transition hover:bg-panel-2 hover:text-bone"
          aria-label={config.total === null ? 'Selesai' : 'Keluar'}
          title={config.total === null ? 'Selesai' : 'Keluar'}
        >
          <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>

        {progress !== null ? (
          <div className="h-3.5 flex-1 overflow-hidden rounded-full bg-panel-2">
            <div
              className="h-full rounded-full bg-sharin transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <div className="flex-1 text-sm font-semibold text-mute">
            Soal #{qNo} · <span className="text-ok">{correct} benar</span> ·{' '}
            <span className="text-sharin-glow">{wrong} salah</span>
          </div>
        )}

        {config.hearts && <Hearts left={hearts} />}
        <div className="flex items-center gap-1.5" title={`Combo ${combo}`}>
          <Sharingan level={level} size={30} spin={level > 0} />
          <span className="min-w-5 text-sm font-extrabold tabular-nums">{combo}</span>
        </div>
      </div>

      {/* soal */}
      <div className="flex flex-1 flex-col items-center justify-center py-8">
        <p className="mb-6 text-sm font-bold uppercase tracking-[0.2em] text-mute">
          {q.type === 'choice'
            ? 'Pilih bacaan yang benar'
            : config.mode === 'combined'
              ? 'Bacakan rangkaian huruf ini'
              : 'Ketik bacaan huruf ini'}
        </p>

        <div
          key={`${qNo}-${status === 'bad'}`}
          className={`card relative grid min-w-56 place-items-center px-10 py-8 ${
            status === 'bad' ? 'animate-shake border-sharin' : status === 'ok' ? 'border-ok' : ''
          }`}
          style={{ boxShadow: '0 0 60px rgba(214, 40, 57, 0.12) inset' }}
        >
          <span
            className={`font-jp font-black leading-none text-glow ${
              long ? 'text-6xl sm:text-7xl' : q.seq.length > 1 ? 'text-7xl sm:text-8xl' : 'text-9xl'
            }`}
            style={{ letterSpacing: q.seq.length > 1 ? '0.12em' : undefined }}
          >
            {q.seq.map((k) => k.char).join('')}
          </span>
          {xpPop && (
            <span
              key={xpPop.key}
              className="pointer-events-none absolute -top-2 right-4 text-lg font-extrabold text-gold"
              style={{ animation: 'xp-float 0.9s ease-out forwards' }}
            >
              +{xpPop.n} XP
            </span>
          )}
        </div>

        {q.type === 'type' ? (
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={status !== 'idle'}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            placeholder={config.mode === 'combined' ? 'contoh: sashisu' : 'ketik romaji…'}
            className="mt-8 w-full max-w-sm rounded-2xl border-2 border-edge bg-panel px-5 py-4 text-center text-2xl font-bold tracking-wider text-bone outline-none transition placeholder:text-mute/50 focus:border-sharin disabled:opacity-60"
          />
        ) : (
          <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isAnswer = q.seq[0].romaji.includes(opt)
              const state =
                status === 'idle'
                  ? 'border-edge hover:border-sharin'
                  : isAnswer
                    ? 'border-ok bg-ok/15'
                    : picked === opt
                      ? 'border-sharin bg-sharin/15'
                      : 'border-edge opacity-50'
              return (
                <button
                  key={opt}
                  onClick={() => pick(opt)}
                  disabled={status !== 'idle'}
                  className={`flex cursor-pointer items-center gap-3 rounded-2xl border-2 bg-panel px-4 py-4 text-left text-xl font-bold transition ${state}`}
                >
                  <span className="grid size-7 place-items-center rounded-lg border border-edge text-xs text-mute">
                    {i + 1}
                  </span>
                  {opt}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* aksi / banner jawaban */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t-2 px-4 py-5 ${
          status === 'idle'
            ? 'border-edge bg-night'
            : status === 'ok'
              ? 'animate-rise border-ok-dark bg-[#0f2a1b]'
              : 'animate-rise border-sharin-dark bg-[#2b0f14]'
        }`}
      >
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          {status === 'idle' ? (
            <>
              <button className="btn btn-ghost" onClick={() => submit(q.type === 'type' ? input || '-' : '-')}>
                Lewati
              </button>
              {q.type === 'type' ? (
                <button className="btn btn-red" disabled={!input.trim()} onClick={() => submit(input)}>
                  Periksa
                </button>
              ) : (
                <span className="text-xs text-mute">tekan 1–4 atau klik</span>
              )}
            </>
          ) : (
            <>
              <div className="min-w-0">
                {status === 'ok' ? (
                  <>
                    <p className="text-xl font-extrabold text-ok">{praise}</p>
                    <p className="truncate text-sm text-ok/80">
                      {q.seq.map((k) => k.char).join('')} = {display(q.seq)}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-extrabold text-sharin-glow">Belum tepat</p>
                    <p className="truncate text-sm text-bone/80">
                      Jawaban: <b>{display(q.seq)}</b>
                      {q.seq.some((k) => k.romaji.length > 1) && (
                        <span className="text-mute">
                          {' '}
                          ({q.seq.filter((k) => k.romaji.length > 1).map((k) => k.romaji.join('/')).join(', ')})
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>
              <button className={`btn ${status === 'ok' ? 'btn-green' : 'btn-red'}`} onClick={next}>
                {config.hearts && hearts <= 0 ? 'Selesai' : 'Lanjut'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
