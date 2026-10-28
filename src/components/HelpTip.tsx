import { CircleHelp } from 'lucide-react'
import { useEffect, useId, useRef, useState, type ReactNode } from 'react'

/** ikon tanda tanya yang menampilkan keterangan: hover/fokus di desktop, ketuk di layar sentuh */
export default function HelpTip({ children, label = 'Keterangan', className = 'relative', align = 'left' }: { children: ReactNode; label?: string; className?: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const box = useRef<HTMLSpanElement>(null)
  const id = useId()

  useEffect(() => {
    if (!open) return
    const away = (e: Event) => {
      if (!box.current?.contains(e.target as Node)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  return (
    <span
      ref={box}
      className={`inline-flex shrink-0 ${className}`}
      // hover hanya untuk mouse; di layar sentuh yang berlaku hanya ketukan (supaya tidak buka lalu langsung tutup)
      onPointerEnter={(e) => e.pointerType === 'mouse' && setOpen(true)}
      onPointerLeave={(e) => e.pointerType === 'mouse' && setOpen(false)}
    >
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-label={label}
        aria-expanded={open}
        aria-describedby={open ? id : undefined}
        className="grid size-6 cursor-pointer place-items-center rounded-full text-[#b9a782] transition hover:text-[#f3e7cf] focus-visible:text-[#f3e7cf]"
      >
        <CircleHelp size={18} strokeWidth={2.2} aria-hidden />
      </button>
      {open && (
        <span
          id={id}
          role="tooltip"
          className={`absolute ${align === 'right' ? 'right-0' : 'left-0'} top-full z-30 mt-1 w-64 max-w-[calc(100vw-3rem)] rounded-lg border border-[#4d3727] bg-[#1a120d] px-3 py-2 text-left text-sm font-normal normal-case leading-snug tracking-normal text-[#e8d9b4] shadow-xl`}
        >
          {children}
        </span>
      )}
    </span>
  )
}
