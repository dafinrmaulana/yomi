import AdviceCard from '../../components/AdviceCard'
import type { QuizConfig } from '../../lib/quiz'
import { promptRomaji } from '../../lib/quiz'
import { display, romajiAt } from '../../lib/romaji'
import type { useQuizAdvice } from './useQuizAdvice'
import type { QuizSession } from './useQuizSession'

interface Props {
  config: QuizConfig
  session: QuizSession
  advice: ReturnType<typeof useQuizAdvice>
  compact: boolean
  /** keyboard virtual (iOS): angkat bar tepat di atas keyboard */
  inset?: number
}

/** peringatan "sudah dekat" setelah salah dalam toleransi tes naik level */
function NearNotice() {
  return (
    <div role="status" className="flex items-start gap-3 rounded-xl border-2 border-gold/60 bg-[#2a1d0c]/95 px-4 py-3 shadow-lg">
      <span className="mt-0.5 size-3 shrink-0 animate-pulse rounded-full bg-gold" aria-hidden />
      <div>
        <p className="text-sm font-extrabold text-gold">Kamu sudah dekat!</p>
        <p className="text-sm text-[#e8d9b4]">
          Satu salah tadi masih ditoleransi, jadi kesempatanmu belum hilang. Jawab benar terus sampai saran naik level muncul, tapi satu salah lagi mengulang tesnya dari awal.
        </p>
      </div>
    </div>
  )
}

/** umpan balik jawaban benar/salah */
function Feedback({ session }: { session: QuizSession }) {
  const { q, status, write, praise, lastMs } = session
  const chars = q.seq.map((k) => k.char).join('')
  if (status === 'ok') {
    return (
      <>
        <p className="text-xl font-extrabold text-ok">{praise}</p>
        <p className="truncate text-sm text-ok/80">
          {write ? (
            <>
              {q.seq.map(promptRomaji).join(' ')} = <span className="font-jp">{chars}</span>
            </>
          ) : (
            <>
              {chars} = {display(q.seq)}
            </>
          )}{' '}
          · {(lastMs / 1000).toFixed(1)} dtk
        </p>
      </>
    )
  }
  // bacaan alternatif per huruf (mis. shi/si), dihitung menurut huruf di sekitarnya
  const alt = q.seq.map((_, i) => romajiAt(q.seq, i).filter((r) => r !== '-')).filter((r) => r.length > 1)
  return (
    <>
      <p className="text-xl font-extrabold text-sharin-glow">Belum tepat</p>
      {write ? (
        <p className="truncate text-sm text-bone/80">
          Jawaban: <b className="font-jp text-base">{chars}</b>
        </p>
      ) : (
        <p className="truncate text-sm text-bone/80">
          Jawaban: <b>{display(q.seq)}</b>
          {alt.length > 0 && <span className="text-mute"> ({alt.map((r) => r.join('/')).join(', ')})</span>}
        </p>
      )}
    </>
  )
}

/** bar bawah: Lewati/Periksa saat menjawab, lalu umpan balik + Lanjut; saran melayang di atasnya */
export default function AnswerBar({ config, session, advice, compact, inset }: Props) {
  const { q, status, answer, hearts } = session
  const idle = status === 'idle'
  const strike = advice.eyePulse && status === 'bad'
  const showStack = (advice.shown || strike) && !compact && !idle
  const lastHeart = config.hearts && hearts <= 0

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-20 border-t-2 px-4 ${compact ? 'py-3' : 'py-5'} ${
        idle
          ? 'border-[#3a2a20] bg-[#0f0a07]/95'
          : status === 'ok'
            ? 'animate-rise border-ok-dark bg-[#0f2a1b]'
            : 'animate-rise border-sharin-dark bg-[#2b0f14]'
      }`}
      style={inset ? { bottom: inset } : undefined}
    >
      {/* saran muncul bersama umpan balik jawaban (setelah Periksa/Lewati), melayang di atas bar */}
      {showStack && (
        <div className="absolute inset-x-4 bottom-full mb-3">
          <div className="mx-auto flex max-w-2xl flex-col gap-2">
            {strike && <NearNotice />}
            {advice.shown && (
              <AdviceCard
                advice={advice.shown}
                applied={advice.applied}
                hint={`Aturan baru siap. Tekan ${lastHeart ? 'Selesai' : 'Lanjut'} untuk memulai soal berikutnya dengan pengaturan ini.`}
                onApply={advice.apply}
                onDismiss={advice.dismiss}
              />
            )}
          </div>
        </div>
      )}
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-4">
        {idle ? (
          <>
            <button className="btn btn-ghost" onClick={session.skip}>
              Lewati
            </button>
            {q.type !== 'choice' ? (
              <button className="btn btn-red" disabled={!answer.trim()} onClick={() => session.submit(answer)}>
                Periksa
              </button>
            ) : (
              <span className="text-xs text-mute">tekan 1–4 atau klik</span>
            )}
          </>
        ) : (
          <>
            <div className="min-w-0">
              <Feedback session={session} />
            </div>
            <button className={`btn ${status === 'ok' ? 'btn-green' : 'btn-red'}`} onClick={session.next}>
              {lastHeart ? 'Selesai' : 'Lanjut'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}
