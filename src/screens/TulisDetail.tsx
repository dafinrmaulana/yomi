import { useState } from 'react'
import DrawPad from '../components/DrawPad'
import { Modal } from '../components/Modal'
import Page from '../components/Page'
import StrokeAnimator, { StepsGrid, StrokeSteps } from '../components/StrokeAnimator'
import { useApp } from '../lib/app-context'
import { SCRIPT_LABEL } from '../lib/kana'
import { Link } from '../lib/router'
import { WRITE_XP } from '../lib/storage'
import { useStrokes } from '../lib/strokes'
import { findWriteChar, NOTES, resolveSet, SMALL_NOTE } from '../lib/tulis'

/** halaman latihan menulis satu huruf */
export default function TulisDetail({ hex }: { hex: string }) {
  const { progress, markWritten } = useApp()
  const strokes = useStrokes()
  const [view, setView] = useState<{ mode: 'steps' | 'anim'; step: number } | null>(null)
  const ch = findWriteChar(hex)
  const data = ch && strokes ? strokes[ch.char] : null

  if (!ch) {
    return (
      <Page eyebrow="Latihan Menulis" title="Huruf tidak ditemukan" back={{ to: '/write', label: 'Daftar huruf' }} size="md">
        <p className="text-[#cdb88f]">Huruf yang kamu cari tidak ada. Kembali ke daftar untuk memilih huruf lain.</p>
      </Page>
    )
  }

  // latihan berurutan: seluruh skrip, atau hanya satu baris, sesuai ?set=
  const set = new URLSearchParams(location.search).get('set')
  const { label: setLabel, chars: list } = resolveSet(ch, set)
  const i = list.findIndex((c) => c.code === ch.code)
  const prev = list[i - 1]
  const next = list[i + 1]
  const qs = set ? `?set=${set}` : ''
  const note = NOTES[ch.char] ?? (ch.romaji.includes('kecil') ? SMALL_NOTE : null)
  const done = progress.written.includes(ch.code)

  return (
    <Page
      eyebrow={`Latihan Menulis · ${SCRIPT_LABEL[ch.script]}`}
      title={`${ch.char}  ·  ${ch.romaji}`}
      lead={done ? 'Sudah kamu tulis dengan benar. Boleh diulang kapan saja.' : data ? `${data.s.length} goresan.` : 'Memuat data goresan…'}
      back={{ to: '/write', label: 'Daftar huruf' }}
      size="md"
    >
      {!data ? (
        <p className="text-[#b9a782]">Memuat…</p>
      ) : (
        <div className="space-y-10">
          <section>
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <h2 className="font-display text-xl font-extrabold">Contoh urutan</h2>
              <div className="grid grid-cols-2 gap-2 sm:flex">
                <button className="pill whitespace-nowrap sm:!flex-none" onClick={() => setView({ mode: 'steps', step: 0 })}>
                  Semua langkah
                </button>
                <button className="pill whitespace-nowrap sm:!flex-none" onClick={() => setView({ mode: 'anim', step: 0 })}>
                  Animasi
                </button>
              </div>
            </div>
            <StrokeSteps data={data} onPick={(step) => setView({ mode: 'steps', step })} />
            {note && <p className="mt-4 rounded-lg border border-[#3a2a20] bg-[#120c09]/70 p-3 text-sm leading-relaxed text-[#d8cdb6]">{note}</p>}
          </section>

          <section>
            <h2 className="font-display mb-4 text-xl font-extrabold">Tulis sendiri</h2>
            <DrawPad key={ch.code} data={data} onPass={() => markWritten(ch.code)} done={done} xp={WRITE_XP} />
          </section>
        </div>
      )}

      <nav className="mt-12 border-t border-[#3a2a20] pt-6">
        <p className="mb-3 text-center text-sm text-[#b9a782]">
          {setLabel} · huruf {i + 1} dari {list.length}
        </p>
        <div className="flex items-center justify-between gap-3">
          {prev ? (
            <Link to={`/write/${prev.code}${qs}`} className="btn btn-ghost btn-sm">
              ‹ {prev.char} {prev.romaji}
            </Link>
          ) : (
            <span />
          )}
          {next ? (
            <Link to={`/write/${next.code}${qs}`} className="btn btn-ghost btn-sm">
              {next.char} {next.romaji} ›
            </Link>
          ) : (
            <Link to="/write" className="btn btn-red btn-sm">
              Selesai
            </Link>
          )}
        </div>
      </nav>

      <Modal
        open={view !== null}
        wide={view?.mode === 'steps'}
        title={`${ch.char} · ${ch.romaji}`}
        onClose={() => setView(null)}
        footer={
          <button className="btn btn-ghost" onClick={() => setView(null)}>
            Tutup
          </button>
        }
      >
        {data && view && (
          <div className="mt-3">
            {view.mode === 'steps' ? (
              <StepsGrid data={data} />
            ) : (
              <StrokeAnimator key={ch.code} data={data} />
            )}
          </div>
        )}
      </Modal>
    </Page>
  )
}
