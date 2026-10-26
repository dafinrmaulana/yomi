import { useState } from 'react'
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

  const startQuiz = (config: QuizConfig, run = Date.now()) => setView({ name: 'quiz', config, run })

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
    setView({ name: 'summary', result, bonus, run: Date.now() })
  }

  switch (view.name) {
    case 'setup':
      return (
        <Setup
          settings={progress.free}
          onChange={(free) => patch({ free })}
          onStart={startFree}
          onBack={() => setView({ name: 'home' })}
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
          onExit={() => setView({ name: 'home' })}
        />
      )
    case 'summary':
      return (
        <Summary
          key={view.run}
          result={view.result}
          bonusXp={view.bonus}
          onRetry={() => startQuiz(view.result.config)}
          onHome={() => setView({ name: 'home' })}
        />
      )
    default:
      return (
        <Home
          progress={progress}
          streak={liveStreak}
          todayXp={todayXp}
          onLesson={(n: PathNode) => startQuiz(lessonConfig(n))}
          onFree={() => setView({ name: 'setup' })}
          onToggleMute={() => patch({ mute: !progress.mute })}
          onReset={reset}
        />
      )
  }
}
