import { useCallback, useEffect, useRef, useState } from 'react'
import { GROUPS } from './lib/kana'
import { lessonConfig, type PathNode } from './lib/path'
import type { QuizConfig, QuizResult } from './lib/quiz'
import { useProgress } from './lib/storage'
import Home from './screens/Home'
import Quiz from './screens/Quiz'
import Setup from './screens/Setup'
import Summary from './screens/Summary'

const LESSON_BONUS = 20

type View =
  | { name: 'home' }
  | { name: 'setup' }
  | { name: 'quiz'; config: QuizConfig; run: number }
  | { name: 'summary'; result: QuizResult; bonus: number; run: number }

export default function App() {
  const { progress, patch, record, reset, liveStreak, todayXp } = useProgress()
  const [view, setView] = useState<View>({ name: 'home' })

  // riwayat browser: tombol Back (fisik/browser) kembali ke layar sebelumnya, bukan menutup web
  const screens = useRef(new Map<number, View>([[0, { name: 'home' }]]))
  const counter = useRef(0)

  useEffect(() => {
    history.replaceState({ id: 0 }, '')
    const onPop = (e: PopStateEvent) => {
      const id = (e.state as { id?: number } | null)?.id
      setView(screens.current.get(id ?? 0) ?? { name: 'home' })
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const go = useCallback((next: View, mode: 'push' | 'replace' = 'push') => {
    const id = ++counter.current
    // kuis & ringkasan tidak dipulihkan lewat Forward; cukup beranda dan meja latihan
    if (next.name === 'home' || next.name === 'setup') screens.current.set(id, next)
    history[mode === 'push' ? 'pushState' : 'replaceState']({ id }, '')
    setView(next)
  }, [])

  const back = useCallback(() => {
    if (history.state && (history.state as { id?: number }).id) history.back()
    else go({ name: 'home' }, 'replace')
  }, [go])

  const startQuiz = (config: QuizConfig, mode: 'push' | 'replace' = 'push') =>
    go({ name: 'quiz', config, run: Date.now() }, mode)

  const startFree = () => {
    const s = progress.free
    const ids = new Set(s.selected)
    const pool = Object.values(GROUPS)
      .flatMap((gs) => gs.flatMap((g) => g.kana))
      .filter((k) => ids.has(k.id))
    startQuiz({
      kind: 'free',
      title: 'Latihan Bebas',
      pool,
      review: [],
      mode: s.mode,
      length: s.length,
      answer: s.mode === 'combined' ? 'type' : s.answer,
      total: null,
      hearts: false,
    })
  }

  const finish = (result: QuizResult) => {
    const done = result.config.kind === 'path' && !result.failed
    const bonus = done ? LESSON_BONUS : 0
    record({
      xp: result.xp + bonus,
      correct: result.correct,
      wrong: result.wrong,
      stats: result.stats,
      completedNode:
        done && result.config.nodeId ? { id: result.config.nodeId, stars: result.stars } : undefined,
    })
    go({ name: 'summary', result, bonus, run: Date.now() }, 'replace')
  }

  switch (view.name) {
    case 'setup':
      return (
        <Setup
          settings={progress.free}
          onChange={(free) => patch({ free })}
          onStart={startFree}
          onBack={back}
        />
      )
    case 'quiz':
      return (
        <Quiz
          key={view.run}
          config={view.config}
          stats={progress.stats}
          mute={progress.mute}
          onFinish={finish}
          onExit={back}
        />
      )
    case 'summary':
      return (
        <Summary
          key={view.run}
          result={view.result}
          bonusXp={view.bonus}
          onRetry={() => startQuiz(view.result.config, 'replace')}
          // ringkasan menimpa entri kuis: path = [home, ringkasan], bebas = [home, meja, ringkasan]
          onHome={() => history.go(view.result.config.kind === 'free' ? -2 : -1)}
        />
      )
    default:
      return (
        <Home
          progress={progress}
          streak={liveStreak}
          todayXp={todayXp}
          onLesson={(n: PathNode) => startQuiz(lessonConfig(n))}
          onFree={() => go({ name: 'setup' })}
          onToggleMute={() => patch({ mute: !progress.mute })}
          onReset={reset}
        />
      )
  }
}
