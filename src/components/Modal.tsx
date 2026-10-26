import { useEffect, useRef, useState, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
  /** lebar dialog di desktop */
  wide?: boolean
}

/** dialog di desktop, bottom sheet di mobile */
/** lama animasi keluar (ms); harus sama dengan durasi di index.css */
const EXIT_MS = 220

export function Modal(props: ModalProps) {
  const { open, onClose } = props
  const panel = useRef<HTMLDivElement>(null)
  const [mounted, setMounted] = useState(open)
  const [closing, setClosing] = useState(false)
  // isi terakhir disimpan supaya panel tidak kosong saat meluncur keluar
  const last = useRef(props)
  if (open) last.current = props
  const { title, children, footer, wide = false } = open ? props : last.current

  // tetap terpasang selama animasi keluar, lalu dilepas
  useEffect(() => {
    if (open) {
      setMounted(true)
      setClosing(false)
      return
    }
    setClosing(true)
    const t = window.setTimeout(() => {
      setMounted(false)
      setClosing(false)
    }, EXIT_MS)
    return () => clearTimeout(t)
  }, [open])

  useEffect(() => {
    if (!open) return
    const prev = document.activeElement as HTMLElement | null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    panel.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        onClose()
      }
    }
    window.addEventListener('keydown', onKey, true)
    return () => {
      window.removeEventListener('keydown', onKey, true)
      document.body.style.overflow = overflow
      prev?.focus()
    }
  }, [open, onClose])

  if (!mounted) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4 ${closing ? 'pointer-events-none' : ''}`}
      role="presentation"
    >
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
        style={{ animation: `${closing ? 'fade-out' : 'fade'} ${closing ? EXIT_MS : 200}ms ease-out forwards` }}
        onClick={onClose}
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className={`relative w-full rounded-t-2xl border border-[#4d3727] bg-[#17100c] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] outline-none sm:rounded-lg sm:pb-6 sm:pt-6 ${
          closing ? 'animate-sink sm:animate-pop-out' : 'animate-rise sm:animate-pop'
        } ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
      >
        <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-[#4d3727] sm:hidden" aria-hidden />
        <h2 className="font-display text-xl font-extrabold">{title}</h2>
        <div className="mt-2 text-sm leading-relaxed text-[#cdb88f]">{children}</div>
        {footer && <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

interface ConfirmProps {
  open: boolean
  title: string
  message: string
  confirmLabel: string
  cancelLabel?: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ open, title, message, confirmLabel, cancelLabel = 'Batal', onConfirm, onCancel }: ConfirmProps) {
  return (
    <Modal
      open={open}
      title={title}
      onClose={onCancel}
      footer={
        <>
          <button className="btn btn-ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="btn btn-red" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </>
      }
    >
      {message}
    </Modal>
  )
}
