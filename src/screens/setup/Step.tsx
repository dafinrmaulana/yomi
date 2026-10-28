import type { ReactNode } from 'react'

/** satu langkah di garis waktu Meja Latihan */
export default function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: ReactNode }) {
  return (
    <li className="relative pb-10 pl-14 last:pb-0">
      <span className="absolute left-0 top-0 z-10 grid size-10 place-items-center rounded-full border-2 border-[#6a4b36] bg-[#2a1c14] text-lg font-extrabold text-[#f3e7cf]">
        {n}
      </span>
      <h2 className="font-display text-xl font-extrabold leading-10">{title}</h2>
      <p className="text-sm text-[#b9a782]">{hint}</p>
      <div className="mt-4">{children}</div>
    </li>
  )
}
