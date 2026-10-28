import { useEffect, useState } from 'react'
import { applyAction, type AdviceAction } from './lib/advice'
import { AppContext } from './lib/app-context'
import { freeConfig, withMode } from './lib/free'
import { lessonConfig, type PathNode } from './lib/path'
import type { QuizConfig, QuizResult } from './lib/quiz'
import { RouterProvider, useRouter } from './lib/router'
import { useProgress } from './lib/storage'
import Home from './screens/Home'
import Hub from './screens/Hub'
import Quiz from './screens/Quiz'
import Setup from './screens/Setup'
import Statistik from './screens/Statistik'
import Summary from './screens/Summary'
import Tulis from './screens/Tulis'
import TulisDetail from './screens/TulisDetail'
import Ulang from './screens/Ulang'

const LESSON_BONUS = 20
const KNOWN = ['/', '/missions', '/practice', '/quiz', '/result', '/write', '/review', '/stats']

const returnPath = (c?: QuizConfig) => (c?.kind === 'free' ? '/practice' : c?.kind === 'review' ? '/review' : '/missions')

function Routes() {
  const app = useProgress()
  const { progress, patch, record, reset, todayXp } = app
  const { path, navigate, back } = useRouter()
  const [quiz, setQuiz] = useState<{ config: QuizConfig; run: number } | null>(null)
  const [summary, setSummary] = useState<{ result: QuizResult; bonus: number } | null>(null)

  const isWrite = path.startsWith('/write/')
  const missing = (path === '/quiz' && !quiz) || (path === '/result' && !summary) || (!KNOWN.includes(path) && !isWrite)
  useEffect(() => {
    if (missing) navigate('/', { replace: true })
  }, [missing, navigate])

  const startQuiz = (config: QuizConfig, replace = false) => {
    setQuiz({ config, run: Date.now() })
    setSummary(null)
    navigate('/quiz', { replace })
  }

  // ganti per huruf ↔ gabungan di Latihan Bebas: simpan pilihan dan mulai sesi baru
  const switchMode = (config: QuizConfig) => {
    const mode = config.mode === 'single' ? 'combined' : 'single'
    patch({ free: { ...progress.free, mode } })
    startQuiz(withMode(progress.free, mode), true)
  }

  const startFree = () => startQuiz(freeConfig(progress.free))

  // saran dari dalam game: ubah pengaturan dan lanjutkan sesi yang sama (skor tidak direset)
  const applyAdvice = (action: AdviceAction) => {
    const next = applyAction(progress.free, action)
    patch({ free: next })
    setQuiz((q) => (q && q.config.kind === 'free' ? { ...q, config: freeConfig(next) } : q))
  }

  const finish = (result: QuizResult) => {
    const done = result.config.kind === 'path' && !result.failed
    const bonus = done ? LESSON_BONUS : 0
    record({
      kind: result.config.kind,
      maxCombo: result.maxCombo,
      xp: result.xp + bonus,
      correct: result.correct,
      wrong: result.wrong,
      stats: result.stats,
      speed: result.speed,
      completedNode: done && result.config.nodeId ? { id: result.config.nodeId, stars: result.stars } : undefined,
    })
    setSummary({ result, bonus })
    // ringkasan menimpa entri kuis, jadi Back dari ringkasan kembali ke halaman asal
    navigate('/result', { replace: true })
  }

  let screen
  if (missing) screen = null
  else if (path === '/quiz' && quiz)
    screen = (
      <Quiz
        key={quiz.run}
        config={quiz.config}
        stats={progress.stats}
        speed={progress.speed}
        mute={progress.mute}
        onFinish={finish}
        onExit={() => back(returnPath(quiz.config))}
        onSwitchMode={quiz.config.kind === 'free' ? () => switchMode(quiz.config) : undefined}
        onApplyAdvice={quiz.config.kind === 'free' ? applyAdvice : undefined}
      />
    )
  else if (path === '/result' && summary)
    screen = (
      <Summary
        result={summary.result}
        bonusXp={summary.bonus}
        onRetry={() => startQuiz(summary.result.config, true)}
        onBack={() => back(returnPath(summary.result.config))}
      />
    )
  else if (path === '/missions')
    screen = (
      <Home
        progress={progress}
        todayXp={todayXp}
        onLesson={(n: PathNode) => startQuiz(lessonConfig(n))}
        onFree={() => navigate('/practice')}
        onReset={reset}
      />
    )
  else if (path === '/practice')
    screen = <Setup settings={progress.free} onChange={(free) => patch({ free })} onStart={startFree} onBack={() => back('/missions')} />
  else if (path === '/write') screen = <Tulis />
  else if (isWrite) screen = <TulisDetail hex={path.slice('/write/'.length)} />
  else if (path === '/review') screen = <Ulang onStart={(c) => startQuiz(c)} />
  else if (path === '/stats') screen = <Statistik />
  else screen = <Hub />

  return <AppContext.Provider value={app}>{screen}</AppContext.Provider>
}

export default function App() {
  return (
    <RouterProvider>
      <Routes />
    </RouterProvider>
  )
}
