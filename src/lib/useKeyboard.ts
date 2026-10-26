import { useEffect, useState } from 'react'

export interface KeyboardState {
  /** keyboard virtual sedang terbuka */
  open: boolean
  /** tinggi area yang benar-benar terlihat (px) */
  height: number
  /** bagian bawah layout viewport yang tertutup keyboard (px); di iOS layout tidak ikut mengecil */
  inset: number
}

/** ambang agar address bar yang mengecil/membesar tidak dianggap keyboard */
const THRESHOLD = 150

/**
 * Pantau keyboard virtual lewat VisualViewport API.
 * - Android (interactive-widget=resizes-content): innerHeight ikut mengecil, inset ≈ 0
 * - iOS: hanya visualViewport yang mengecil, inset = tinggi keyboard
 */
export function useKeyboard(): KeyboardState {
  const [state, setState] = useState<KeyboardState>(() => ({
    open: false,
    height: typeof window === 'undefined' ? 0 : window.innerHeight,
    inset: 0,
  }))

  useEffect(() => {
    const vv = window.visualViewport
    if (!vv) return

    // tinggi terbesar yang pernah terlihat = tinggi tanpa keyboard
    let base = Math.max(window.innerHeight, vv.height)
    let width = window.innerWidth
    let frame = 0

    const update = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        if (window.innerWidth !== width) {
          // rotasi layar: ukur ulang dasar
          width = window.innerWidth
          base = vv.height
        }
        base = Math.max(base, window.innerHeight, vv.height)
        const height = Math.round(vv.height)
        const inset = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
        const open = base - vv.height > THRESHOLD
        setState((p) => (p.open === open && p.height === height && p.inset === inset ? p : { open, height, inset }))
        // iOS menggulir halaman saat input fokus; layout sudah dipadatkan, jadi kunci ke atas
        if (open && (window.scrollY !== 0 || vv.offsetTop !== 0)) window.scrollTo(0, 0)
      })
    }

    vv.addEventListener('resize', update)
    vv.addEventListener('scroll', update)
    update()
    return () => {
      cancelAnimationFrame(frame)
      vv.removeEventListener('resize', update)
      vv.removeEventListener('scroll', update)
    }
  }, [])

  return state
}
