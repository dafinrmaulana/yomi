import { useEffect, useRef, type ReactNode } from 'react'

interface ModalProps {
  open: boolean
  title: string
  onClose: () => void
  children: ReactNode
  footer?: ReactNode
}

/** dialog di desktop, bottom sheet di mobile */
export function Modal({ open, title, onClose, children, footer }: ModalProps) {
  const panel = useRef<HTMLDivElement>(null)

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

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4" role="presentation">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-[2px]" style={{ animation: 'fade 0.2s ease-out' }} onClick={onClose} />
      <div
        ref={panel}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="animate-rise relative w-full rounded-t-2xl border border-[#4d3727] bg-[#17100c] px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-3 shadow-[0_-12px_40px_rgba(0,0,0,0.6)] outline-none sm:max-w-md sm:animate-pop sm:rounded-lg sm:pb-6 sm:pt-6"
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
