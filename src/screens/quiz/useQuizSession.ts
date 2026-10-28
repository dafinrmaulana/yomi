import { useEffect, useRef, useState } from 'react'
import { QuestionGenerator } from '../../lib/generator'
import { KANA_BY_ID } from '../../lib/kana'
import {
  checkKana,
  isChoiceAnswer,
  pickPraise,
  questionXp,
  slowMs,
  starsFor,
  type Question,
  type QuizConfig,
  type QuizResult,
} from '../../lib/quiz'
import { longestPrefix, matchesSequence } from '../../lib/romaji'
import { scopeOf, SessionTracker, type AdviceSettings } from '../../lib/session'
import { sfx } from '../../lib/sound'
import type { SpeedStat } from '../../lib/storage'
import type { Mangekyo } from '../../components/Sharingan'

export type Status = 'idle' | 'ok' | 'bad'

interface Options {
  config: QuizConfig
  /** statistik dan waktu seluruh waktu sebelum sesi ini */
  stats: Record<string, { r: number; w: number }>
  speed: Record<string, SpeedStat>
  mute: boolean
  mangekyo: Mangekyo
  /** hanya Latihan Bebas: lacak seberapa dekat tes naik level */
  trackAdvice: boolean
  onFinish: (r: QuizResult) => void
}

function avgSeconds(speed: Record<string, SpeedStat>) {
  const all = Object.values(speed)
  const n = all.reduce((a, s) => a + s.n, 0)
  return n ? all.reduce((a, s) => a + s.ms, 0) / n / 1000 : null
}

/** pengaturan yang dipakai menilai saran, diambil dari konfigurasi kuis */
export const adviceSettings = (c: QuizConfig): AdviceSettings => ({
  mode: c.mode,
  length: c.length,
  selected: c.pool.map((k) => k.id),
  direction: c.direction,
})

/** seluruh keadaan permainan satu sesi kuis: soal berjalan, jawaban, skor, nyawa, waktu, dan pencatat sesi */
export function useQuizSession({ config, stats, speed: pastSpeed, mute, mangekyo, trackAdvice, onFinish }: Options) {
  const direction = config.direction ?? 'read'
  const write = direction === 'write'
  const settings = adviceSettings(config)

  const startedAt = useRef(0)
  const shownAt = useRef(0)
  const [tracker] = useState(() => new SessionTracker())
  const [gen] = useState(() => new QuestionGenerator())

  const [q, setQ] = useState<Question>(() => gen.next(config, stats, undefined, pastSpeed))
  const [qNo, setQNo] = useState(1)
  const [parts, setParts] = useState<string[]>([])
  // arah tulis tanpa keyboard: indeks kepingan yang sudah dipasang
  const [tilePicks, setTilePicks] = useState<number[]>([])
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
  // pengaturan tempat peringatan "dekat lalu salah" terjadi; berlaku selama pengaturan itu belum berganti
  const [warnedIn, setWarnedIn] = useState<string | null>(null)

  const answer = q.type === 'tiles' ? tilePicks.map((i) => q.options[i]).join('') : parts.join('')
  const answered = correct + wrong
  const warned = warnedIn === scopeOf(settings)
  const play = (fn: () => void) => {
    if (!mute) fn()
  }

  useEffect(() => {
    startedAt.current = shownAt.current = Date.now()
  }, [])

  // stopwatch per soal: jalan sampai dijawab, lalu berhenti di waktu jawabnya
  useEffect(() => {
    if (status !== 'idle') return
    const tick = () => setElapsed(Date.now() - shownAt.current)
    tick()
    const id = setInterval(tick, 100)
    return () => clearInterval(id)
  }, [status, qNo])

  const finish = (failed: boolean) => {
    const weak = Object.entries(tracker.stats)
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
      stats: tracker.stats,
      speed: tracker.speed,
      avgSeconds: avgSeconds(tracker.speed),
      weak,
      failed,
      stars: failed ? 0 : starsFor(correct, wrong),
      mangekyo,
    })
  }

  /** nilai soal: prefix = jumlah huruf benar sebelum huruf yang salah */
  const grade = (ok: boolean, prefix: number) => {
    if (status !== 'idle') return
    const ms = Date.now() - shownAt.current
    const upShown = tracker.advice(settings, stats, pastSpeed, [])?.kind === 'up'
    const wasNear = trackAdvice && !upShown && tracker.isNear(settings, stats, pastSpeed)
    const { each, outcome } = tracker.record({ seq: q.seq, prefix, ok, ms, settings, wasNear })
    // sudah dekat lalu salah (masih dalam toleransi): Mangekyō menyala sebagai peringatan terakhir
    if (outcome === 'reset') setWarnedIn(null)
    else if (outcome === 'warn') setWarnedIn(scopeOf(settings))

    if (ok) {
      const slow = each > slowMs(config.direction)
      if (slow) for (const k of q.seq) gen.requeue(config, k)
      // rangkaian lambat dijawab diulang beberapa soal lagi; yang sudah benar dan cepat tidak diulang
      if (slow) gen.scheduleRetry(config, q)
      else gen.clearRetry(config, q)
      const gain = questionXp(q.seq.length)
      setStatus('ok')
      setLastMs(ms)
      setPraise(pickPraise())
      setCorrect((c) => c + 1)
      setXp((x) => x + gain)
      setCombo((c) => c + 1)
      setMaxCombo((m) => Math.max(m, combo + 1))
      setXpPop({ n: gain, key: Date.now() })
      play(() => sfx.correct(combo))
    } else {
      setStatus('bad')
      gen.scheduleRetry(config, q)
      setWrong((w) => w + 1)
      setCombo(0)
      if (config.hearts) setHearts((h) => h - 1)
      play(sfx.wrong)
    }
  }

  const submit = (given: string) => {
    if (status !== 'idle') return
    if (q.type === 'choice' && write) {
      const ok = isChoiceAnswer(q, given, direction)
      return grade(ok, ok ? 1 : 0)
    }
    if (write) {
      const r = checkKana(given, q.seq)
      return grade(r.ok, r.prefix)
    }
    const ok = matchesSequence(given, q.seq)
    grade(ok, ok ? q.seq.length : longestPrefix(given, q.seq))
  }

  const skip = () => submit(q.type === 'choice' ? '-' : answer || '-')

  const pick = (opt: string) => {
    if (status !== 'idle') return
    setPicked(opt)
    submit(opt)
  }

  const next = () => {
    if (status === 'idle') return
    if (config.hearts && hearts <= 0) return finish(true)
    if (config.total !== null && answered >= config.total) return finish(false)
    const key = q.seq.map((k) => k.id).join()
    setQ(gen.next(config, tracker.mergedStats(stats), key, tracker.mergedSpeed(pastSpeed)))
    setQNo((n) => n + 1)
    setParts([])
    setTilePicks([])
    setPicked(null)
    setStatus('idle')
    setXpPop(null)
    shownAt.current = Date.now()
  }

  return {
    tracker,
    settings,
    direction,
    write,
    q,
    qNo,
    status,
    parts,
    setParts,
    tilePicks,
    setTilePicks,
    picked,
    answer,
    praise,
    lastMs,
    elapsed,
    correct,
    wrong,
    xp,
    combo,
    hearts,
    xpPop,
    answered,
    warned,
    submit,
    skip,
    pick,
    next,
    finish,
  }
}

export type QuizSession = ReturnType<typeof useQuizSession>
