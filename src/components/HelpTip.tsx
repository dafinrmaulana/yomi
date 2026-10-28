import { CircleHelp } from 'lucide-react'
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'

const GAP = 4
const EDGE = 12

/** ikon tanda tanya yang menampilkan keterangan: hover/fokus di desktop, ketuk di layar sentuh */
export default function HelpTip({ children, label = 'Keterangan', className = 'relative', align = 'left' }: { children: ReactNode; label?: string; className?: string; align?: 'left' | 'right' }) {
  const [open, setOpen] = useState(false)
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null)
  const box = useRef<HTMLSpanElement>(null)
  const tip = useRef<HTMLSpanElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)
  const id = useId()

  // tooltip dirender lewat portal ke body (posisi fixed) supaya tidak tertimpa kartu lain:
  // pembungkus ber-transform/relative membuat stacking context sendiri sehingga z-index lokal kalah
  useLayoutEffect(() => {
    if (!open) return
    const place = () => {
      const anchor = box.current?.getBoundingClientRect()
      const width = tip.current?.offsetWidth ?? 0
      if (!anchor) return
      const raw = align === 'right' ? anchor.right - width : anchor.left
      const left = Math.max(EDGE, Math.min(raw, window.innerWidth - width - EDGE))
      setPos({ top: anchor.bottom + GAP, left })
    }
    place()
    window.addEventListener('scroll', place, true)
    window.addEventListener('resize', place)
    return () => {
      window.removeEventListener('scroll', place, true)
      window.removeEventListener('resize', place)
    }
  }, [open, align])

  useEffect(() => {
    if (!open) {
      setPos(null)
      return
    }
    const away = (e: Event) => {
      const t = e.target as Node
      if (!box.current?.contains(t) && !tip.current?.contains(t)) setOpen(false)
    }
    const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', away)
    document.addEventListener('keydown', esc)
    return () => {
      document.removeEventListener('pointerdown', away)
      document.removeEventListener('keydown', esc)
    }
  }, [open])

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  // hover hanya untuk mouse; jeda singkat saat keluar supaya kursor bisa pindah ke tooltip tanpa menutupnya
  const enter = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const leave = (e: React.PointerEvent) => {
    if (e.pointerType !== 'mouse') return
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 120)
  }

  return (
    <span ref={box} className={`inline-flex shrink-0 ${className}`} onPointerEnter={enter} onPointerLeave={leave}>
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
      {open &&
        createPortal(
          <span
            ref={tip}
            id={id}
            role="tooltip"
            onPointerEnter={enter}
            onPointerLeave={leave}
            style={{ top: pos?.top ?? 0, left: pos?.left ?? 0, visibility: pos ? 'visible' : 'hidden' }}
            className="fixed z-[60] w-64 max-w-[calc(100vw-1.5rem)] rounded-lg border border-[#4d3727] bg-[#1a120d] px-3 py-2 text-left text-sm font-normal normal-case leading-snug tracking-normal text-[#e8d9b4] shadow-xl"
          >
            {children}
          </span>,
          document.body,
        )}
    </span>
  )
}
