import { useState } from 'react'
import type { Advice, AdviceAction } from '../../lib/advice'
import { sharinganLevel } from '../../lib/eye'
import { MILESTONE } from '../../lib/tuning'
import type { SpeedStat } from '../../lib/storage'
import type { QuizSession } from './useQuizSession'


interface Options {
  session: QuizSession
  stats: Record<string, { r: number; w: number }>
  speed: Record<string, SpeedStat>
  /** hanya Latihan Bebas: saran bisa diterapkan tanpa mereset sesi */
  onApplyAdvice?: (a: AdviceAction) => void
  /** pelajaran misi harus dituntaskan; sesi lain boleh diakhiri kapan saja setelah menjawab */
  canFinish: boolean
}

/**
 * Saran di dalam game (naik level, fokus, milestone) dan mata latar yang mengikutinya:
 * ikut combo; mendekati saran naik level jadi Rinnegan, saat saran muncul Rinnegan bertomoe, dan bila sudah
 * dekat tapi satu kesempatan salah terpakai, Mangekyō menyala berdenyut sebagai peringatan.
 */
export function useQuizAdvice({ session, stats, speed, onApplyAdvice, canFinish }: Options) {
  const { tracker, settings, answered, combo, qNo, warned } = session
  const [dismissed, setDismissed] = useState<string[]>([])
  // saran yang sudah diterapkan tetap tampil (sebagai chip) sampai pemain menekan Lanjut (pindah soal)
  const [pinnedState, setPinned] = useState<{ advice: Advice; applied: string[]; qNo: number } | null>(null)
  const pinned = pinnedState && pinnedState.qNo === qNo ? pinnedState : null

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

  const enabled = !!onApplyAdvice
  const settingsAdvice = enabled ? tracker.advice(settings, stats, speed, dismissed) : undefined
  const advice = milestone ?? settingsAdvice
  const shown = pinned?.advice ?? advice

  const upReady = settingsAdvice?.kind === 'up'
  const near = enabled && !upReady && tracker.isNear(settings, stats, speed)
  const eyePulse = warned && !upReady
  const eyeLevel = upReady ? 6 : eyePulse ? 4 : near ? 5 : sharinganLevel(combo)

  const apply = (a: AdviceAction) => {
    if (a.kind === 'finish') return session.finish(false)
    onApplyAdvice?.(a)
    setPinned((p) => (shown ? { advice: p?.advice ?? shown, applied: [...(p?.applied ?? []), a.label], qNo } : p))
  }

  const dismiss = () => {
    if (pinned) setPinned(null)
    else if (advice) setDismissed((d) => [...d, advice.key])
  }

  return { shown, applied: pinned?.applied, eyeLevel, eyePulse, apply, dismiss }
}
