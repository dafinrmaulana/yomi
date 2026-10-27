import { useEffect, useRef } from 'react'
import type { Kana } from '../lib/kana'

interface Props {
  seq: Kana[]
  values: string[]
  onChange: (values: string[]) => void
  disabled: boolean
  compact?: boolean
  /** arah tulis: tiap kotak diisi huruf Jepang lewat IME */
  write?: boolean
  /** mode kata nyata: pembagian kata; arti tiap kata muncul di bawah preview setelah katanya lengkap */
  words?: { meaning?: string; len: number }[]
}

/** pindah otomatis bila isi kotak sudah pasti utuh (tidak ada romaji lain yang lebih panjang) */
const complete = (k: Kana, v: string) =>
  k.romaji.includes(v) && !k.romaji.some((r) => r !== v && r.startsWith(v))

/** kursor selalu di ujung kanan isi kotak (setelah klik/fokus browser menaruhnya di tempat lain) */
const toEnd = (el: HTMLInputElement) =>
  requestAnimationFrame(() => el.setSelectionRange(el.value.length, el.value.length))

/** panah hanya pindah kotak bila kursor sudah di ujung isinya (dan tidak ada teks yang terblok) */
const atEdge = (el: HTMLInputElement, edge: 'start' | 'end') =>
  el.selectionStart === el.selectionEnd && el.selectionStart === (edge === 'start' ? 0 : el.value.length)

/** satu kotak per huruf (seperti kode OTP), dengan pratinjau gabungan jawaban di atasnya */
export default function AnswerBoxes({ seq, values, onChange, disabled, compact, write, words }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([])
  const composing = useRef(false)
  const key = seq.map((k) => k.id).join()

  useEffect(() => {
    if (!disabled) refs.current[0]?.focus({ preventScroll: true })
  }, [disabled, key])

  const focus = (i: number) => refs.current[Math.max(0, Math.min(seq.length - 1, i))]?.focus({ preventScroll: true })

  const set = (i: number, raw: string, final = true) => {
    const k = seq[i]
    const v = write ? raw.slice(0, k.char.length + 1) : raw.toLowerCase().replace(/[^a-z]/g, '').slice(0, 4)
    onChange(seq.map((_, j) => (j === i ? v : (values[j] ?? ''))))
    if (!final || !v) return
    const done = write ? v === k.char : complete(k, v) || v.length >= Math.max(...k.romaji.map((r) => r.length))
    if (done) focus(i + 1)
  }

  const onKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return
    if (e.key === 'Backspace' && !values[i]) {
      e.preventDefault()
      focus(i - 1)
    } else if (e.key === 'ArrowLeft' && atEdge(e.currentTarget, 'start')) {
      e.preventDefault()
      focus(i - 1)
    } else if (e.key === 'ArrowRight' && atEdge(e.currentTarget, 'end')) {
      e.preventDefault()
      focus(i + 1)
    } else if (!write && e.key === ' ') {
      e.preventDefault()
      focus(i + 1)
    }
  }

  const joined = seq.map((_, i) => values[i] ?? '').join('')

  return (
    <div className={`flex w-fit max-w-[min(100%,28rem)] flex-col items-start ${compact ? 'mt-3 gap-2' : 'mt-8 gap-3'}`}>
      {words ? (
        <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-2 self-center" aria-live="polite">
          {words.map((w, wi) => {
            const from = words.slice(0, wi).reduce((a, x) => a + x.len, 0)
            const text = seq.slice(from, from + w.len).map((_, i) => values[from + i] ?? '').join('')
            const complete = !!w.meaning && seq.slice(from, from + w.len).every((k, i) => {
              const v = (values[from + i] ?? '').toLowerCase()
              return write ? v === k.char : k.romaji.includes(v)
            })
            return (
              <div key={wi} className="flex flex-col items-center">
                <span
                  className={`rounded-[3px] px-1 font-bold tracking-[0.12em] transition-colors ${compact ? 'min-h-7 text-xl' : 'min-h-9 text-3xl'} ${write ? 'font-jp' : ''} ${
                    text ? 'text-bone' : 'text-mute/40'
                  }`}
                  // sorot ala stabilo di separuh bawah kata, hanya setelah kata itu benar
                  style={
                    complete
                      ? { background: 'linear-gradient(transparent 45%, rgba(233, 180, 76, 0.5) 45%, rgba(233, 180, 76, 0.5) 92%, transparent 92%)' }
                      : undefined
                  }
                >
                  {text || '…'}
                </span>
                <span className={`px-1 text-xs font-semibold text-[#cdb88f] transition-opacity duration-300 ${complete ? 'opacity-100' : 'opacity-0'}`}>
                  {w.meaning}
                </span>
              </div>
            )
          })}
        </div>
      ) : (
        seq.length > 1 && (
          <p
            className={`min-h-9 break-all self-center text-center font-bold tracking-[0.18em] ${compact ? 'text-xl' : 'text-3xl'} ${write ? 'font-jp' : ''} ${joined ? 'text-bone' : 'text-mute/40'}`}
            aria-live="polite"
          >
            {joined || (write ? 'huruf Jepang…' : 'romaji…')}
          </p>
        )
      )}
      <div className={`flex flex-wrap justify-start sm:justify-center ${seq.length > 10 ? 'gap-1.5' : 'gap-2'}`}>
        {seq.map((_, i) => (
          <input
            key={`${key}-${i}`}
            ref={(el) => {
              refs.current[i] = el
            }}
            value={values[i] ?? ''}
            onChange={(e) => set(i, e.target.value, !composing.current)}
            onCompositionStart={() => (composing.current = true)}
            onCompositionEnd={(e) => {
              composing.current = false
              set(i, e.currentTarget.value)
            }}
            onKeyDown={(e) => onKey(i, e)}
            onFocus={(e) => toEnd(e.currentTarget)}
            onClick={(e) => toEnd(e.currentTarget)}
            disabled={disabled}
            aria-label={`Huruf ke-${i + 1}`}
            autoComplete="off"
            autoCapitalize="off"
            autoCorrect="off"
            spellCheck={false}
            lang={write ? 'ja' : undefined}
            className={`rounded-[3px] border-2 border-[#4d3727] bg-[#120c09]/90 text-center font-bold text-bone outline-none transition focus:border-sharin disabled:opacity-60 ${write ? 'font-jp' : ''} ${
              seq.length > 10 ? 'h-11 w-10 text-base' : compact ? 'h-12 w-12 text-xl' : 'h-16 w-14 text-2xl'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
