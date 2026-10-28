import { useEffect, useRef, useState } from 'react'
import { ConfirmDialog } from '../components/Modal'
import Petals from '../components/Petals'
import Scenery from '../components/Scenery'
import { pickMangekyo } from '../components/Sharingan'
import type { AdviceAction } from '../lib/advice'
import type { QuizConfig, QuizResult } from '../lib/quiz'
import type { SpeedStat } from '../lib/storage'
import { useKeyboard } from '../lib/useKeyboard'
import AnswerBar from './quiz/AnswerBar'
import QuestionPanel from './quiz/QuestionPanel'
import QuizTopBar from './quiz/QuizTopBar'
import { useQuizAdvice } from './quiz/useQuizAdvice'
import { useQuizSession } from './quiz/useQuizSession'

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

export default function Quiz({ config, stats, speed, mute, onFinish, onExit, onSwitchMode, onApplyAdvice }: Props) {
  const kb = useKeyboard()
  // Mangekyō berganti tiap permainan
  const [mangekyo] = useState(pickMangekyo)
  const session = useQuizSession({ config, stats, speed, mute, mangekyo, trackAdvice: !!onApplyAdvice, onFinish })
  const { q, status, answered, answer } = session

  // pelajaran misi harus dituntaskan; sesi lain boleh diakhiri kapan saja setelah menjawab
  const canFinish = config.kind !== 'path' && answered > 0
  const advice = useQuizAdvice({ session, stats, speed, onApplyAdvice, canFinish })

  const [confirm, setConfirm] = useState<'exit' | 'mode' | null>(null)
  const exit = () => (answered > 0 ? setConfirm('exit') : onExit())
  const switchMode = onSwitchMode && (() => (answered > 0 ? setConfirm('mode') : onSwitchMode()))

  const handleKey = (e: KeyboardEvent) => {
    // Enter saat IME (keyboard Jepang) masih menyusun kata hanya mengonfirmasi konversi
    if (e.isComposing || e.keyCode === 229) return
    if (confirm) return
    if (e.key === 'Tab' && switchMode) {
      e.preventDefault()
      switchMode()
      return
    }
    if (e.key === 'Enter') {
      e.preventDefault()
      if (status !== 'idle') session.next()
      else if (q.type !== 'choice' && answer.trim()) session.submit(answer)
    } else if (e.key === 'Backspace' && status === 'idle' && q.type === 'tiles') {
      session.setTilePicks((p) => p.slice(0, -1))
    } else if (status === 'idle' && q.type === 'choice' && /^[1-4]$/.test(e.key)) {
      const opt = q.options[Number(e.key) - 1]
      if (opt) session.pick(opt)
    }
  }
  // listener selalu memakai closure terbaru
  const keyRef = useRef(handleKey)
  useEffect(() => {
    keyRef.current = handleKey
  })
  useEffect(() => {
    const fn = (e: KeyboardEvent) => keyRef.current(e)
    window.addEventListener('keydown', fn)
    return () => window.removeEventListener('keydown', fn)
  }, [])

  const progress = config.total ? Math.min(100, (answered / config.total) * 100) : null
  // keyboard virtual terbuka: padatkan layout agar kartu soal + input muat di area yang terlihat
  const compact = kb.open && q.type === 'type'
  const tiny = compact && kb.height < 420

  return (
    <>
      <Scenery moonLevel={advice.eyeLevel} moonVariant={mangekyo} moonPulse={advice.eyePulse} />
      <Petals count={10} />
      <div
        className={`relative z-10 mx-auto flex w-full max-w-2xl flex-col px-4 ${compact ? 'overflow-hidden pb-24 pt-3' : 'min-h-dvh pb-44 pt-4'}`}
        style={compact ? { height: kb.height } : undefined}
      >
        <QuizTopBar
          config={config}
          progress={progress}
          hearts={session.hearts}
          elapsed={session.elapsed}
          combo={session.combo}
          eye={{ level: advice.eyeLevel, variant: mangekyo, pulse: advice.eyePulse }}
          canFinish={canFinish}
          onExit={exit}
          onFinish={() => session.finish(false)}
          onSwitchMode={switchMode}
        />
        <QuestionPanel config={config} session={session} compact={compact} tiny={tiny} />
        <AnswerBar config={config} session={session} advice={advice} compact={compact} inset={kb.open ? kb.inset : undefined} />
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
