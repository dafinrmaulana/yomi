import type { ReactNode } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from '../lib/router'
import AppHeader from './AppHeader'
import Petals from './Petals'

interface Props {
  eyebrow: string
  title: string
  lead?: string
  back?: { to: string; label: string }
  /** lebar konten */
  size?: 'md' | 'lg'
  /** tanpa papan judul: isi langsung tampil */
  bare?: boolean
  children: ReactNode
}

/** kerangka halaman dalam: header, latar, judul di papan kayu */
export default function Page({ eyebrow, title, lead, back = { to: '/', label: 'Menu utama' }, size = 'lg', bare = false, children }: Props) {
  return (
    <div className="bg-seigaiha relative min-h-dvh">
      <Petals count={10} />
      <AppHeader />
      <main className={`relative z-10 mx-auto px-4 pb-24 pt-6 ${size === 'md' ? 'max-w-3xl' : 'max-w-5xl'}`}>
        <Link to={back.to} className="mb-4 inline-flex items-center gap-1.5 text-sm font-semibold text-[#b9a782] transition hover:text-bone">
          <ArrowLeft size={16} strokeWidth={2.5} className="shrink-0" aria-hidden />
          <span>{back.label}</span>
        </Link>
        {!bare && (
          <div className="plank mb-8 rounded-xl px-6 py-5">
            <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sharin-glow">{eyebrow}</p>
            <h1 className="font-display mt-1 text-3xl font-extrabold">{title}</h1>
            {lead && <p className="mt-1 max-w-xl text-sm text-[#cdb88f]">{lead}</p>}
          </div>
        )}
        {children}
      </main>
    </div>
  )
}
