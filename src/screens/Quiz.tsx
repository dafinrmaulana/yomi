import { useCallback, useEffect, useRef, useState } from 'react'
import AdviceCard from '../components/AdviceCard'
import AnswerBoxes from '../components/AnswerBoxes'
import Hearts from '../components/Hearts'
import { ConfirmDialog } from '../components/Modal'
import Petals from '../components/Petals'
import Scenery from '../components/Scenery'
import Sharingan, { sharinganLevel } from '../components/Sharingan'
import TileBank from '../components/TileBank'
import { adviceFor, TEST_MISSES, testMisses, type Advice, type AdviceAction, type SessionLog } from '../lib/advice'
import { KANA_BY_ID, SCRIPT_LABEL } from '../lib/kana'
import {
  checkKana,
  isChoiceAnswer,
  clearRetry,
  makeQuestion,
  requeue,
  scheduleRetry,
  slowMs,
  pickPraise,
  promptRomaji,
  questionXp,
  starsFor,
  type Question,
  type QuizConfig,
  type QuizResult,
} from '../lib/quiz'
import { display, longestPrefix, matchesSequence } from '../lib/romaji'
import { sfx } from '../lib/sound'
import { SPEED_WINDOW, type SpeedStat } from '../lib/storage'
import { useKeyboard } from '../lib/useKeyboard'

interface Props {
  config: QuizConfig
  stats: Record<string, { r: number; w: number }>
  speed: Record<string, SpeedStat>
  mute: boolean
  onFinish: (r: QuizResult) => void
  onExit: () => void
  /** hanya ada di Latihan Bebas: ganti per huruf ↔ gabungan dan mulai ulang sesi */
  onSwitchMode?: () => void
  /** hanya Latihan Bebas: terapkan saran tanpa mereset sesi */
  onApplyAdvice?: (a: AdviceAction) => void
}

type Status = 'idle' | 'ok' | 'bad'

/** saran naik level hanya muncul bila jawaban beruntun sebanyak ini benar semua, dihitung sejak pengaturan terakhir berubah */
const STREAK_FOR_UP = 10

/** tiap kelipatan ini, sesi diajak selesai atau istirahat */
const MILESTONE = 50

function avgSeconds(speed: Record<string, SpeedStat>) {
  const all = Object.values(speed)
  const n = all.reduce((a, s) => a + s.n, 0)
  return n ? all.reduce((a, s) => a + s.ms, 0) / n / 1000 : null
}

export default function Quiz({ config, stats, speed: pastSpeed, mute, onFinish, onExit, onSwitchMode, onApplyAdvice }: Props) {
  const session = useRef<Record<string, { r: number; w: number }>>({})
  const startedAt = useRef(Date.now())
  const shownAt = useRef(Date.now())
  // catatan per huruf untuk penilaian saran; dikosongkan tiap pengaturan berubah
  const log = useRef<SessionLog>({})
  // jawaban benar beruntun sejak pengaturan terakhir berubah; saran naik level harus dibuktikan di level yang baru
  const run = useRef(0)
  // masa tes naik level: dimulai ulang dari kosong setiap ada jawaban salah atau pengaturan berubah
  const test = useRef<SessionLog>({})
  const speed = useRef<Record<string, SpeedStat>>({})
  const kb = useKeyboard()
  const direction = config.direction ?? 'read'
  const write = direction === 'write'

  const merged = useCallback(() => {
    const out = { ...stats }
    for (const [id, s] of Object.entries(session.current)) {
      const o = out[id] ?? { r: 0, w: 0 }
      out[id] = { r: o.r + s.r, w: o.w + s.w }
    }
    return out
  }, [stats])

  const mergedSpeed = useCallback(() => {
    const out = { ...pastSpeed }
    for (const [id, s] of Object.entries(speed.current)) {
      const o = out[id] ?? { n: 0, ms: 0 }
      out[id] = { n: o.n + s.n, ms: o.ms + s.ms, recent: [...(o.recent ?? []), ...(s.recent ?? [])].slice(-SPEED_WINDOW) }
    }
    return out
  }, [pastSpeed])

  const [q, setQ] = useState<Question>(() => makeQuestion(config, stats, undefined, pastSpeed))
  const [qNo, setQNo] = useState(1)
  const [parts, setParts] = useState<string[]>([])
  // arah tulis tanpa keyboard: indeks kepingan yang sudah dipasang
  const [tilePicks, setTilePicks] = useState<number[]>([])
  const answer = q.type === 'tiles' ? tilePicks.map((i) => q.options[i]).join('') : parts.join('')
  const [picked, setPicked] = useState<string | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [praise, setPraise] = useState('')
  const [lastMs, setLastMs] = useState(0)
  const [elapsed, setElapsed] = useState(0)
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
      speed: speed.current,
      avgSeconds: avgSeconds(speed.current),
      weak,
      failed,
      stars: failed ? 0 : starsFor(correct, wrong),
    })
  }

  /** nilai soal: prefix = jumlah huruf benar sebelum huruf yang salah */
  const grade = (ok: boolean, prefix: number) => {
    if (status !== 'idle') return
    q.seq.forEach((k, i) => {
      if (i > prefix) return
      const s = (session.current[k.id] ??= { r: 0, w: 0 })
      if (i < prefix) s.r++
      else s.w++
    })

    const each = (Date.now() - shownAt.current) / q.seq.length
    q.seq.forEach((k, i) => {
      if (i > prefix) return
      for (const book of [log.current, test.current]) {
        const l = (book[k.id] ??= { r: 0, w: 0, fast: 0 })
        if (i < prefix) {
          l.r++
          if (each <= slowMs(config.direction)) l.fast++
        } else l.w++
      }
    })
    // satu salah ditoleransi per tes; salah berikutnya mengulang tes dan hitungan benar beruntun dari awal
    if (ok) run.current++
    else if (testMisses(test.current) > TEST_MISSES) {
      test.current = {}
      run.current = 0
    }

    if (ok) {
      // waktu berpikir dibagi rata ke tiap huruf, tanpa batas atas
      const each = (Date.now() - shownAt.current) / q.seq.length
      for (const k of q.seq) {
        const s = (speed.current[k.id] ??= { n: 0, ms: 0, recent: [] })
        s.n++
        s.ms += each
        s.recent = [...(s.recent ?? []), each].slice(-SPEED_WINDOW)
        if (each > slowMs(config.direction)) requeue(config, k)
      }
      // rangkaian lambat dijawab diulang beberapa soal lagi; yang sudah benar dan cepat tidak diulang
      if (each > slowMs(config.direction)) scheduleRetry(config, q)
      else clearRetry(config, q)
      const gain = questionXp(q.seq.length)
      setStatus('ok')
      setLastMs(Date.now() - shownAt.current)
      setPraise(pickPraise())
      setCorrect((c) => c + 1)
      setXp((x) => x + gain)
      setCombo((c) => c + 1)
      setMaxCombo((m) => Math.max(m, combo + 1))
      setXpPop({ n: gain, key: Date.now() })
      play(() => sfx.correct(combo))
    } else {
      setStatus('bad')
      scheduleRetry(config, q)
      setWrong((w) => w + 1)
      setCombo(0)
      if (config.hearts) setHearts((h) => h - 1)
      play(sfx.wrong)
    }
  }

  const submit = (answer: string) => {
    if (status !== 'idle') return
    if (q.type === 'choice' && write) {
      const ok = isChoiceAnswer(q, answer, direction)
      return grade(ok, ok ? 1 : 0)
    }
    if (write) {
      const r = checkKana(answer, q.seq)
      return grade(r.ok, r.prefix)
    }
    const ok = matchesSequence(answer, q.seq)
    grade(ok, ok ? q.seq.length : longestPrefix(answer, q.seq))
  }

  const skip = () => {
    submit(q.type === 'choice' ? '-' : answer || '-')
  }

  const next = () => {
    if (status === 'idle') return
    if (config.hearts && hearts <= 0) return finish(true)
    if (config.total !== null && answered >= config.total) return finish(false)
    const key = q.seq.map((k) => k.id).join()
    setQ(makeQuestion(config, merged(), key, mergedSpeed()))
    setQNo((n) => n + 1)
    setParts([])
    setTilePicks([])
    setPicked(null)
    setStatus('idle')
    setXpPop(null)
    setPinned(null)
    shownAt.current = Date.now()
  }

  const [confirm, setConfirm] = useState<'exit' | 'mode' | null>(null)
  const [dismissed, setDismissed] = useState<string[]>([])
  // saran yang sudah diterapkan tetap tampil (sebagai chip) sampai pemain menekan Lanjut
  const [pinned, setPinned] = useState<{ advice: Advice; applied: string[] } | null>(null)

  const exit = () => {
    if (answered > 0) setConfirm('exit')
    else onExit()
  }

  // pelajaran misi harus dituntaskan; sesi lain boleh diakhiri kapan saja setelah menjawab
  const canFinish = config.kind !== 'path' && answered > 0

  const switchMode = () => {
    if (!onSwitchMode) return
    if (answered > 0) setConfirm('mode')
    else onSwitchMode()
  }

  // pengaturan berubah (mis. setelah menerima saran): penilaian dimulai dari awal
  useEffect(() => {
    log.current = {}
    test.current = {}
    run.current = 0
  }, [config.mode, config.length, config.pool.length])

  // tiap kelipatan MILESTONE soal: ajak selesai/istirahat untuk melihat statistik (hanya sesi yang boleh diakhiri)
  const milestone: Advice | undefined =
    canFinish && answered >= MILESTONE && answered % MILESTONE === 0 && !dismissed.includes(`milestone|${answered}`)
      ? {
          kind: 'milestone',
          key: `milestone|${answered}`,
          title: `${answered} soal selesai!`,
          body: 'Waktunya selesai atau istirahat sebentar. Simpan hasilnya dan lihat statistikmu, atau lanjut kalau masih segar.',
          actions: [{ kind: 'finish', label: 'Selesai & lihat hasil' }],
        }
      : undefined

  // saran dinilai dari huruf-huruf terlemah di pengaturan ini, dihitung ulang tiap pindah soal
  const settingsAdvice = onApplyAdvice
    ? adviceFor(
        { mode: config.mode, length: config.length, selected: config.pool.map((k) => k.id), direction: config.direction },
        merged(),
        mergedSpeed(),
        log.current,
        test.current,
      ).find((a) => !dismissed.includes(a.key) && (a.kind !== 'up' || run.current >= STREAK_FOR_UP))
    : undefined
  const advice = milestone ?? settingsAdvice

  const handleKey = (e: KeyboardEvent) => {
    // Enter saat IME (keyboard Jepang) masih menyusun kata hanya mengonfirmasi konversi
    if (e.isComposing || e.keyCode === 229) return
    if (confirm) return
    if (e.key === 'Tab' && onSwitchMode) {
      e.preventDefault()
      switchMode()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status !== 'idle') next()
      else if (q.type !== 'choice' && answer.trim()) submit(answer)
    } else if (e.key === 'Backspace' && status === 'idle' && q.type === 'tiles') {
      setTilePicks((p) => p.slice(0, -1))
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

  // stopwatch per soal: jalan sampai dijawab, lalu berhenti di waktu jawabnya
  useEffect(() => {
    if (status !== 'idle') return
    const tick = () => setElapsed(Date.now() - shownAt.current)
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [status, qNo])

  const pick = (opt: string) => {
    if (status !== 'idle') return
    setPicked(opt)
    submit(opt)
  }

  const progress = config.total ? Math.min(100, (answered / config.total) * 100) : null
  // keyboard virtual terbuka: padatkan layout agar kartu soal + input muat di area yang terlihat
  const compact = kb.open && q.type === 'type'
  const tiny = compact && kb.height < 420

  return (
    <>
    <Scenery moonLevel={level} />
    <Petals count={10} />
    <div
      className={`relative z-10 mx-auto flex w-full max-w-2xl flex-col px-4 ${
        compact ? 'overflow-hidden pb-24 pt-3' : 'min-h-dvh pb-44 pt-4'
      }`}
      style={compact ? { height: kb.height } : undefined}
    >
      {/* bar atas */}
      <div className="flex items-center gap-2 sm:gap-3">
        <button
          onClick={exit}
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
            <div
              className="h-full rounded-full bg-sharin transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        ) : (
          <div className="flex-1" />
        )}

        {onSwitchMode && (
          <button
            onClick={switchMode}
            title="Ganti mode (Tab)"
            className="cursor-pointer shrink-0 rounded-lg border border-[#4d3727] px-2.5 py-1.5 text-xs font-bold text-mute transition hover:border-sharin hover:text-bone"
          >
            <span className="hidden sm:inline">{config.mode === 'single' ? 'Per huruf' : 'Gabungan'} </span>⇄
            <span className="hidden sm:inline"> {config.mode === 'single' ? 'Gabungan' : 'Per huruf'} · Tab</span>
          </button>
        )}
        {canFinish && (
          <button onClick={() => finish(false)} className="btn btn-ghost shrink-0 !px-3 !py-1.5 !text-xs" title="Akhiri sesi dan lihat hasil">
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
          <Sharingan level={level} size={30} />
          <span className="min-w-5 text-sm font-extrabold tabular-nums">{combo}</span>
          <span className="hidden text-[10px] font-bold uppercase tracking-widest text-mute sm:inline">Combo</span>
        </div>
      </div>

      {/* soal */}
      <div className={`flex min-h-0 flex-1 flex-col items-center justify-center ${compact ? 'py-2' : 'py-8'}`}>
        {config.total === null && (
          <p className={`font-semibold text-mute ${tiny ? 'hidden' : compact ? 'mb-2 text-xs' : 'mb-4 text-sm'}`}>Soal ke-{qNo}</p>
        )}
        <p
          className={`font-bold uppercase tracking-[0.2em] text-mute ${
            tiny ? 'hidden' : compact ? 'mb-3 text-xs' : 'mb-6 text-sm'
          }`}
        >
          {write
            ? q.type === 'choice'
              ? 'Pilih huruf yang benar'
              : q.type === 'tiles'
                ? 'Susun huruf Jepangnya'
                : q.seq.length > 1
                ? 'Ketik rangkaian huruf Jepangnya'
                : 'Ketik huruf Jepangnya'
            : q.type === 'choice'
              ? 'Pilih bacaan yang benar'
              : config.mode === 'combined'
                ? 'Bacakan rangkaian huruf ini'
                : 'Ketik bacaan huruf ini'}
        </p>

        <div
          key={`${qNo}-${status === 'bad'}`}
          className={`card relative grid min-w-56 max-w-full place-items-center ${compact ? 'px-4 py-3 sm:px-8 sm:py-4' : write ? 'px-4 py-4 sm:px-8 sm:py-5' : 'px-4 py-5 sm:px-10 sm:py-8'} ${
            status === 'bad' ? 'animate-shake border-sharin' : status === 'ok' ? 'border-ok' : ''
          }`}
          style={{ boxShadow: '0 0 60px rgba(214, 40, 57, 0.12) inset' }}
        >
          {write ? (
            <RomajiPrompt seq={q.seq} />
          ) : (
          <KanaPrompt seq={q.seq} words={q.words} size={promptSize(q.seq.length, compact)} />
          )}
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

        {q.type === 'tiles' ? (
          <TileBank answer={q.seq.map((k) => k.char)} words={q.words} tiles={q.options} picks={tilePicks} onChange={setTilePicks} disabled={status !== 'idle'} />
        ) : q.type === 'type' ? (
          <AnswerBoxes seq={q.seq} values={parts} onChange={setParts} disabled={status !== 'idle'} compact={compact} write={write} words={q.words} />
        ) : (
          <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3">
            {q.options.map((opt, i) => {
              const isAnswer = isChoiceAnswer(q, opt, direction)
              const state =
                status === 'idle'
                  ? ''
                  : isAnswer
                    ? 'opt-ok'
                    : picked === opt
                      ? 'opt-bad'
                      : 'opt-dim'
              return (
                <button key={opt} onClick={() => pick(opt)} disabled={status !== 'idle'} className={`opt ${state}`}>
                  <span className="num">{i + 1}</span>
                  {write ? <span className="font-jp text-2xl">{opt}</span> : opt}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* aksi / banner jawaban */}
      <div
        className={`fixed inset-x-0 bottom-0 z-20 border-t-2 px-4 ${compact ? 'py-3' : 'py-5'} ${
          status === 'idle'
            ? 'border-[#3a2a20] bg-[#0f0a07]/95'
            : status === 'ok'
              ? 'animate-rise border-ok-dark bg-[#0f2a1b]'
              : 'animate-rise border-sharin-dark bg-[#2b0f14]'
        }`}
        // iOS: layout viewport tidak mengecil, jadi angkat bar tepat di atas keyboard
        style={kb.open && kb.inset ? { bottom: kb.inset } : undefined}
      >
        {/* saran muncul bersama umpan balik jawaban (setelah Periksa/Lewati), melayang di atas bar */}
        {(pinned?.advice ?? advice) && !compact && status !== 'idle' && (
          <div className="absolute inset-x-4 bottom-full mb-3">
            <div className="mx-auto max-w-2xl">
              <AdviceCard
                advice={(pinned?.advice ?? advice)!}
                applied={pinned?.applied}
                hint={`Aturan baru siap. Tekan ${config.hearts && hearts <= 0 ? 'Selesai' : 'Lanjut'} untuk memulai soal berikutnya dengan pengaturan ini.`}
                onApply={(a) => {
                  if (a.kind === 'finish') return finish(false)
                  onApplyAdvice?.(a)
                  setPinned((p) => ({ advice: (p?.advice ?? advice)!, applied: [...(p?.applied ?? []), a.label] }))
                }}
                onDismiss={() => {
                  if (pinned) setPinned(null)
                  else if (advice) setDismissed((d) => [...d, advice.key])
                }}
              />
            </div>
          </div>
        )}
        <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
          {status === 'idle' ? (
            <>
              <button className="btn btn-ghost" onClick={skip}>
                Lewati
              </button>
              {q.type !== 'choice' ? (
                <button className="btn btn-red" disabled={!answer.trim()} onClick={() => submit(answer)}>
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
                      {write ? (
                        <>
                          {q.seq.map(promptRomaji).join(' ')} = <span className="font-jp">{q.seq.map((k) => k.char).join('')}</span>
                        </>
                      ) : (
                        <>
                          {q.seq.map((k) => k.char).join('')} = {display(q.seq)}
                        </>
                      )}
                      {' '}· {(lastMs / 1000).toFixed(1)} dtk
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-xl font-extrabold text-sharin-glow">Belum tepat</p>
                    {write ? (
                      <p className="truncate text-sm text-bone/80">
                        Jawaban: <b className="font-jp text-base">{q.seq.map((k) => k.char).join('')}</b>
                      </p>
                    ) : (
                    <p className="truncate text-sm text-bone/80">
                      Jawaban: <b>{display(q.seq)}</b>
                      {q.seq.some((k) => k.romaji.length > 1) && (
                        <span className="text-mute">
                          {' '}
                          ({q.seq.filter((k) => k.romaji.length > 1).map((k) => k.romaji.join('/')).join(', ')})
                        </span>
                      )}
                    </p>
                    )}
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
    <ConfirmDialog
      open={confirm === 'exit'}
      title="Keluar tanpa menyimpan?"
      message={`Progres sesi ini akan hilang.${canFinish ? ' Pakai tombol Selesai kalau ingin menyimpannya.' : ''}`}
      confirmLabel="Keluar"
      cancelLabel="Lanjut main"
      onCancel={() => setConfirm(null)}
      onConfirm={() => {
        setConfirm(null)
        onExit()
      }}
    />
    <ConfirmDialog
      open={confirm === 'mode'}
      title="Ganti mode?"
      message="Sesi ini akan dimulai ulang dari nol dan progres yang belum selesai tidak disimpan."
      confirmLabel="Ganti mode"
      cancelLabel="Batal"
      onCancel={() => setConfirm(null)}
      onConfirm={() => {
        setConfirm(null)
        onSwitchMode?.()
      }}
    />
    </>
  )
}

const MOBILE_ROW = 6

/**
 * Soal arah baca. Kata nyata ditata per kata (baris hanya putus di antara kata). Rangkaian acak yang panjang
 * dipotong per enam huruf di layar kecil dengan nomor baris, supaya urutan bacanya jelas: kiri ke kanan, atas ke bawah.
 */
function KanaPrompt({ seq, words, size }: { seq: Question['seq']; words?: Question['words']; size: string }) {
  const base = `font-jp font-black leading-tight text-glow ${size}`
  const spacing = { letterSpacing: seq.length > 1 ? '0.12em' : undefined }
  const chars = seq.map((k) => k.char)

  if (words) {
    let from = 0
    return (
      <div className={`flex flex-wrap justify-start gap-x-5 gap-y-1 text-left sm:justify-center ${base}`} style={spacing}>
        {words.map((w, i) => {
          const t = chars.slice(from, from + w.len).join('')
          from += w.len
          return (
            <span key={i} className="whitespace-nowrap">
              {t}
            </span>
          )
        })}
      </div>
    )
  }

  if (seq.length <= MOBILE_ROW) {
    return (
      <span className={`text-left ${base}`} style={spacing}>
        {chars.join('')}
      </span>
    )
  }
  const rows = Array.from({ length: Math.ceil(chars.length / MOBILE_ROW) }, (_, i) => chars.slice(i * MOBILE_ROW, (i + 1) * MOBILE_ROW).join(''))
  return (
    <>
      <div className="flex flex-col gap-1 sm:hidden">
        {rows.map((r, i) => (
          <div key={i} className="flex items-center gap-3">
            <span className="w-4 shrink-0 text-center text-[11px] font-bold tabular-nums text-mute" aria-hidden>
              {i + 1}
            </span>
            <span className={`text-left ${base}`} style={spacing}>
              {r}
            </span>
          </div>
        ))}
      </div>
      <span className={`hidden text-left sm:inline ${base}`} style={spacing}>
        {chars.join('')}
      </span>
    </>
  )
}

/** ukuran huruf soal arah baca menurut panjang rangkaian (makin panjang makin kecil agar tetap muat) */
function promptSize(n: number, compact: boolean): string {
  // ukuran dasar untuk layar kecil (enam huruf per baris harus muat di ~320px), lalu lebih besar di sm ke atas
  if (compact) return n > 6 ? 'text-3xl' : n > 3 ? 'text-4xl' : n > 1 ? 'text-5xl' : 'text-7xl'
  if (n > 12) return 'text-3xl sm:text-4xl'
  if (n > 6) return 'text-4xl sm:text-5xl'
  if (n > 4) return 'text-4xl sm:text-7xl'
  if (n > 3) return 'text-5xl sm:text-7xl'
  if (n > 1) return 'text-6xl sm:text-8xl'
  return 'text-8xl sm:text-9xl'
}

/** soal arah tulis: romaji tiap huruf, plus label skrip supaya jelas hiragana atau katakana */
function RomajiPrompt({ seq }: { seq: Question['seq'] }) {
  const scripts = new Set(seq.map((k) => k.script))
  const mixed = scripts.size > 1
  const size =
    seq.length > 12 ? 'text-xl sm:text-2xl' : seq.length > 8 ? 'text-2xl sm:text-3xl' : seq.length > 3 ? 'text-3xl sm:text-4xl' : seq.length > 1 ? 'text-4xl sm:text-5xl' : 'text-6xl sm:text-7xl'
  return (
    <div className="flex flex-col items-center gap-2">
      {!mixed && (
        <span className="rounded bg-black/30 px-2 py-0.5 text-[11px] font-bold uppercase tracking-[0.2em] text-[#cdb88f]">
          {SCRIPT_LABEL[seq[0].script]}
        </span>
      )}
      <div className="flex flex-wrap items-end justify-center gap-x-4 gap-y-2">
        {seq.map((k, i) => (
          <span key={i} className="flex flex-col items-center">
            <span className={`font-black leading-none tracking-wide text-glow ${size}`}>{promptRomaji(k)}</span>
            {mixed && <span className="mt-1 text-[10px] font-bold uppercase tracking-widest text-mute">{SCRIPT_LABEL[k.script]}</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
