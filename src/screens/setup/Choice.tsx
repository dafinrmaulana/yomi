import HelpTip from '../../components/HelpTip'

/** satu pilihan radio berupa kartu, dengan keterangan di tooltip */
export default function Choice({
  selected,
  disabled,
  title,
  desc,
  onClick,
}: {
  selected: boolean
  disabled?: boolean
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <div className="relative">
      <button
        role="radio"
        aria-checked={selected}
        disabled={disabled}
        onClick={onClick}
        className={`flex w-full min-w-0 items-center gap-2 rounded-lg border-2 p-4 pr-11 text-left text-base font-bold transition ${
          selected ? 'border-sharin bg-sharin/10' : `border-[#3a2a20] bg-[#120c09]/80 ${disabled ? '' : 'hover:border-[#6a4b36]'}`
        } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
      >
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
            selected ? 'border-sharin bg-sharin' : 'border-[#6a4b36]'
          }`}
        >
          {selected && (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
        {title}
      </button>
      {/* tombol bantuan di luar tombol pilihan (tombol tidak boleh bersarang) */}
      <HelpTip align="right" className="absolute right-3 top-1/2 -translate-y-1/2" label={`Tentang ${title}`}>
        {desc}
      </HelpTip>
    </div>
  )
}
