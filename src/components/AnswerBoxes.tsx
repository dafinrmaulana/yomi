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
export default function AnswerBoxes({ seq, values, onChange, disabled, compact, write }: Props) {
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
    <div className={`flex w-full max-w-md flex-col items-center ${compact ? 'mt-3 gap-2' : 'mt-8 gap-3'}`}>
      {seq.length > 1 && (
        <p
          className={`min-h-9 text-center font-bold tracking-[0.18em] ${compact ? 'text-xl' : 'text-3xl'} ${write ? 'font-jp' : ''} ${joined ? 'text-bone' : 'text-mute/40'}`}
          aria-live="polite"
        >
          {joined || (write ? 'huruf Jepang…' : 'romaji…')}
        </p>
      )}
      <div className="flex flex-wrap justify-center gap-2">
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
              compact ? 'h-12 w-12 text-xl' : 'h-16 w-14 text-2xl'
            }`}
          />
        ))}
      </div>
    </div>
  )
}
