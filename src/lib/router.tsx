import { createContext, useCallback, useContext, useEffect, useRef, useState, type AnchorHTMLAttributes, type ReactNode } from 'react'

interface Router {
  path: string
  navigate: (to: string, opts?: { replace?: boolean }) => void
  /** kembali ke layar sebelumnya di dalam aplikasi; jika tidak ada, ke `fallback` */
  back: (fallback?: string) => void
}

const Ctx = createContext<Router>(null as unknown as Router)

const clean = (p: string) => (p.length > 1 ? p.replace(/\/+$/, '') : p)
const pathOf = (to: string) => clean(to.split(/[?#]/)[0])

export function RouterProvider({ children }: { children: ReactNode }) {
  const [path, setPath] = useState(() => clean(location.pathname))
  const idx = useRef((history.state as { idx?: number } | null)?.idx ?? 0)

  useEffect(() => {
    history.replaceState({ idx: idx.current }, '')
    const onPop = (e: PopStateEvent) => {
      idx.current = (e.state as { idx?: number } | null)?.idx ?? 0
      setPath(clean(location.pathname))
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  const navigate = useCallback((to: string, opts?: { replace?: boolean }) => {
    if (to === location.pathname + location.search) return
    if (opts?.replace) history.replaceState({ idx: idx.current }, '', to)
    else history.pushState({ idx: ++idx.current }, '', to)
    setPath(pathOf(to))
    window.scrollTo(0, 0)
  }, [])

  const back = useCallback(
    (fallback = '/') => {
      if (idx.current > 0) history.back()
      else navigate(fallback, { replace: true })
    },
    [navigate],
  )

  return <Ctx.Provider value={{ path, navigate, back }}>{children}</Ctx.Provider>
}

export const useRouter = () => useContext(Ctx)

/** tautan biasa yang tidak memuat ulang halaman (Ctrl/Cmd-klik tetap membuka tab baru) */
export function Link({ to, onClick, ...rest }: { to: string } & AnchorHTMLAttributes<HTMLAnchorElement>) {
  const { navigate } = useRouter()
  return (
    <a
      {...rest}
      href={to}
      onClick={(e) => {
        onClick?.(e)
        if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
        e.preventDefault()
        navigate(to)
      }}
    />
  )
}
