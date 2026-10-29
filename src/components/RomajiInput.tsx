import { useEffect, useRef } from 'react'
import type { Kana } from '../lib/kana'
import { readChunks } from '../lib/romaji'

interface Props {
  seq: Kana[]
  value: string
  onChange: (value: string) => void
  disabled: boolean
  compact?: boolean
  /** mode kata nyata: pembagian kata; arti tiap kata muncul di bawah ketikan setelah katanya benar */
  words?: { meaning?: string; len: number }[]
}

/** satu kolom ketik biasa untuk romaji; kata yang sudah benar disorot dan diberi arti di bawahnya */
export default function RomajiInput({ seq, value, onChange, disabled, compact, words }: Props) {
  const ref = useRef<HTMLInputElement>(null)
  const key = seq.map((k) => k.id).join()

  useEffect(() => {
    if (!disabled) ref.current?.focus({ preventScroll: true })
  }, [disabled, key])

  const { chunks, rest } = readChunks(value, seq)

  return (
    <div className={`flex w-full max-w-md flex-col items-center ${compact ? 'mt-3 gap-2' : 'mt-8 gap-3'}`}>
      {words && value && (
        <div className="flex flex-wrap items-start justify-center gap-x-4 gap-y-2" aria-live="polite">
          {words.map((w, wi) => {
            const from = words.slice(0, wi).reduce((a, x) => a + x.len, 0)
            const done = chunks.length >= from + w.len
            const last = chunks.length >= from && chunks.length < from + w.len
            const text = chunks.slice(from, from + w.len).join('') + (last ? rest : '')
            return (
              <div key={wi} className="flex flex-col items-center">
                <span
                  className={`rounded-[3px] px-1 font-bold tracking-[0.12em] transition-colors ${compact ? 'min-h-7 text-xl' : 'min-h-9 text-3xl'} ${
                    text ? 'text-bone' : 'text-mute/40'
                  }`}
                  // sorot ala stabilo di separuh bawah kata, hanya setelah kata itu benar
                  style={
                    done && w.meaning
                      ? { background: 'linear-gradient(transparent 45%, rgba(233, 180, 76, 0.5) 45%, rgba(233, 180, 76, 0.5) 92%, transparent 92%)' }
                      : undefined
                  }
                >
                  {text || '…'}
                </span>
                <span className={`px-1 text-xs font-semibold text-[#cdb88f] transition-opacity duration-300 ${done && w.meaning ? 'opacity-100' : 'opacity-0'}`}>
                  {w.meaning}
                </span>
              </div>
            )
          })}
        </div>
      )}
      <input
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value.toLowerCase().replace(/[^a-z\- ]/g, ''))}
        disabled={disabled}
        aria-label="Jawaban romaji"
        placeholder="romaji…"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        className={`w-full rounded-[3px] border-2 border-[#4d3727] bg-[#120c09]/90 text-center font-bold tracking-[0.12em] text-bone outline-none transition placeholder:text-mute/40 focus:border-sharin disabled:opacity-60 ${
          compact ? 'h-12 text-xl' : 'h-16 text-2xl'
        }`}
      />
    </div>
  )
}
