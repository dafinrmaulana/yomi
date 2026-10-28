interface Props {
  /** jumlah huruf yang harus disusun */
  slots: number
  /** semua kepingan yang tersedia */
  tiles: string[]
  /** indeks kepingan yang sudah dipilih, berurutan */
  picks: number[]
  onChange: (picks: number[]) => void
  disabled: boolean
  compact?: boolean
}

/** susun jawaban dari kepingan huruf Jepang, ala Duolingo: ketuk kepingan untuk memasang, ketuk lagi untuk melepas */
export default function TileBank({ slots, tiles, picks, onChange, disabled, compact }: Props) {
  const add = (i: number) => {
    if (disabled || picks.includes(i) || picks.length >= slots) return
    onChange([...picks, i])
  }
  const remove = (pos: number) => {
    if (disabled) return
    onChange(picks.filter((_, p) => p !== pos))
  }
  const size = compact ? 'h-12 min-w-12 text-xl' : 'h-14 min-w-14 text-2xl'

  return (
    <div className={`flex w-full max-w-md flex-col items-stretch ${compact ? 'mt-3 gap-3' : 'mt-8 gap-5'}`}>
      <div
        className="flex min-h-16 flex-wrap items-center justify-start gap-2 border-b-2 border-[#3a2a20] pb-2 sm:justify-center"
        aria-label="Jawabanmu"
        aria-live="polite"
      >
        {Array.from({ length: slots }, (_, pos) => {
          const i = picks[pos]
          return i === undefined ? (
            <span key={pos} className={`${size} rounded-lg border-2 border-dashed border-[#3a2a20] bg-[#120c09]/60 px-3`} aria-hidden />
          ) : (
            <button
              key={pos}
              onClick={() => remove(pos)}
              disabled={disabled}
              className={`font-jp ${size} cursor-pointer rounded-lg border-2 border-[#6b4a32] bg-[#2a1d14] px-3 font-bold text-bone transition hover:border-sharin disabled:cursor-default`}
              aria-label={`Lepas ${tiles[i]}`}
            >
              {tiles[i]}
            </button>
          )
        })}
      </div>

      <div className="flex flex-wrap justify-center gap-2">
        {tiles.map((t, i) => {
          const used = picks.includes(i)
          return (
            <button
              key={i}
              onClick={() => add(i)}
              disabled={disabled || used}
              className={`font-jp ${size} cursor-pointer rounded-lg border-2 px-3 font-bold transition ${
                used
                  ? 'border-transparent bg-[#120c09]/70 text-transparent'
                  : 'border-[#4d3727] bg-[#1d140e] text-bone shadow-[0_3px_0_#0b0705] hover:border-sharin active:translate-y-0.5 active:shadow-none'
              }`}
            >
              {t}
            </button>
          )
        })}
      </div>
    </div>
  )
}
