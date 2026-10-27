interface Props {
  checked: boolean
  onChange: (v: boolean) => void
  label: string
}

/** saklar on/off; mengganti checkbox bawaan browser */
export default function Switch({ checked, onChange, label }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`relative h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 transition-colors ${
        checked ? 'border-sharin-dark bg-sharin' : 'border-[#4d3727] bg-[#120c09]'
      }`}
    >
      <span
        aria-hidden
        className={`absolute left-0.5 top-0.5 size-5 rounded-full shadow transition-transform duration-200 ${
          checked ? 'translate-x-5 bg-white' : 'bg-[#8f7f66]'
        }`}
      />
    </button>
  )
}
