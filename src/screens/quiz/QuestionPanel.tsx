import AnswerBoxes from '../../components/AnswerBoxes'
import RomajiInput from '../../components/RomajiInput'
import TileBank from '../../components/TileBank'
import { isChoiceAnswer, type QuizConfig } from '../../lib/quiz'
import { KanaPrompt, RomajiPrompt } from './prompts'
import { promptSize } from './promptSize'
import type { QuizSession } from './useQuizSession'

/** instruksi singkat di atas kartu soal, menurut arah dan jenis jawaban */
function instruction(config: QuizConfig, q: QuizSession['q'], write: boolean) {
  if (config.mode === 'dialog') {
    if (!write) return 'Bacakan kalimat ini'
    return q.type === 'tiles' ? 'Susun kalimat Jepangnya' : 'Ketik kalimat Jepangnya'
  }
  if (write) {
    if (q.type === 'choice') return 'Pilih huruf yang benar'
    if (q.type === 'tiles') return 'Susun huruf Jepangnya'
    return q.seq.length > 1 ? 'Ketik rangkaian huruf Jepangnya' : 'Ketik huruf Jepangnya'
  }
  if (q.type === 'choice') return 'Pilih bacaan yang benar'
  return config.mode === 'combined' ? 'Bacakan rangkaian huruf ini' : 'Ketik bacaan huruf ini'
}

/** penjelasan singkat bila rangkaian memuat っ/ッ atau ー, supaya jelas cara menjawabnya */
function specialHint(q: QuizSession['q'], write: boolean): string | null {
  const sokuon = q.seq.some((k) => k.special === 'sokuon')
  const choon = q.seq.some((k) => k.special === 'choon')
  if (!sokuon && !choon) return null
  if (write) {
    return [sokuon && '“tsu kecil” = っ/ッ', choon && '“panjang” = ー'].filter(Boolean).join(' · ')
  }
  return [
    sokuon && 'っ/ッ: ketik huruf konsonan berikutnya (kitte → ki · t · te)',
    choon && 'ー: ketik vokal yang dipanjangkan (ge · e · mu), atau “-”',
  ]
    .filter(Boolean)
    .join(' · ')
}

interface Props {
  config: QuizConfig
  session: QuizSession
  /** keyboard virtual terbuka: layout dipadatkan */
  compact: boolean
  tiny: boolean
}

/** kartu soal beserta area jawabannya (kotak ketik, kepingan huruf, atau pilihan ganda) */
export default function QuestionPanel({ config, session, compact, tiny }: Props) {
  const { q, qNo, status, write, direction, xpPop } = session
  const idle = status === 'idle'
  return (
    <div className={`flex min-h-0 flex-1 flex-col items-center justify-center ${compact ? 'py-2' : 'py-8'}`}>
      {config.total === null && (
        <p className={`font-semibold text-mute ${tiny ? 'hidden' : compact ? 'mb-2 text-xs' : 'mb-4 text-sm'}`}>Soal ke-{qNo}</p>
      )}
      <p className={`font-bold uppercase tracking-[0.2em] text-mute ${tiny ? 'hidden' : compact ? 'mb-3 text-xs' : 'mb-6 text-sm'}`}>
        {instruction(config, q, write)}
      </p>

      <div
        key={`${qNo}-${status === 'bad'}`}
        className={`card relative grid min-w-56 max-w-full place-items-center ${
          compact ? 'px-4 py-3 sm:px-8 sm:py-4' : write ? 'px-4 py-4 sm:px-8 sm:py-5' : 'px-4 py-5 sm:px-10 sm:py-8'
        } ${status === 'bad' ? 'animate-shake border-sharin' : status === 'ok' ? 'border-ok' : ''}`}
        style={{ boxShadow: '0 0 60px rgba(214, 40, 57, 0.12) inset' }}
      >
        {write ? <RomajiPrompt seq={q.seq} words={q.line ? q.words : undefined} /> : <KanaPrompt seq={q.seq} words={q.words} size={promptSize(q.seq.length, compact)} />}
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

      {q.line && (
        <p className={`mt-3 flex items-center gap-2 text-xs font-bold text-[#b9a782] ${tiny ? 'hidden' : ''}`}>
          <span className="grid size-5 place-items-center rounded-full bg-[#f3e7cf] text-[11px] font-extrabold leading-none text-[#1b1410]">{q.line.speaker}</span>
          {q.line.title} · {q.line.no}/{q.line.of}
        </p>
      )}
      {q.translation && (
        // arah tulis: terjemahan jadi petunjuk soal; arah baca: terjemahan baru muncul setelah dijawab
        <p className={`mt-2 max-w-md px-4 text-center text-sm font-semibold italic text-[#cdb88f] ${tiny ? 'hidden' : write || !idle ? '' : 'invisible'}`}>
          “{q.translation}”
        </p>
      )}

      {specialHint(q, write) && (
        <p className={`mt-3 max-w-md px-4 text-center text-xs text-[#b9a782] ${tiny ? 'hidden' : ''}`}>{specialHint(q, write)}</p>
      )}

      {q.type === 'tiles' ? (
        <TileBank
          answer={q.seq.map((k) => k.char)}
          words={q.words}
          tiles={q.options}
          picks={session.tilePicks}
          onChange={session.setTilePicks}
          disabled={!idle}
        />
      ) : q.type === 'type' && !write ? (
        <RomajiInput
          seq={q.seq}
          value={session.parts[0] ?? ''}
          onChange={(v) => session.setParts([v])}
          disabled={!idle}
          compact={compact}
          words={q.words}
        />
      ) : q.type === 'type' ? (
        <AnswerBoxes seq={q.seq} values={session.parts} onChange={session.setParts} disabled={!idle} compact={compact} write={write} words={q.words} />
      ) : (
        <div className="mt-8 grid w-full max-w-md grid-cols-2 gap-3">
          {q.options.map((opt, i) => {
            const state = idle ? '' : isChoiceAnswer(q, opt, direction) ? 'opt-ok' : session.picked === opt ? 'opt-bad' : 'opt-dim'
            return (
              <button key={opt} onClick={() => session.pick(opt)} disabled={!idle} className={`opt ${state}`}>
                <span className="num">{i + 1}</span>
                {write ? <span className="font-jp text-2xl">{opt}</span> : opt}
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
