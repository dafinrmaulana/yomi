import { useState } from 'react'
import Petals from '../components/Petals'
import { GROUPS, KIND_LABEL, SCRIPT_LABEL, type Script } from '../lib/kana'
import type { AnswerMode, FreeSettings, QuizMode } from '../lib/storage'

interface Props {
  settings: FreeSettings
  onChange: (s: FreeSettings) => void
  onStart: () => void
  onBack: () => void
}

function Seg<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T
  options: { v: T; label: string; disabled?: boolean }[]
  onChange: (v: T) => void
}) {
  return (
    <div className="grid auto-cols-fr grid-flow-col gap-2">
      {options.map((o) => (
        <button
          key={o.v}
          disabled={o.disabled}
          onClick={() => onChange(o.v)}
          className={`btn px-3 py-3 text-xs ${value === o.v ? 'btn-red' : 'btn-ghost'}`}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export default function Setup({ settings, onChange, onStart, onBack }: Props) {
  const [script, setScript] = useState<Script>('hiragana')
  const selected = new Set(settings.selected)
  const set = (patch: Partial<FreeSettings>) => onChange({ ...settings, ...patch })
  const setIds = (ids: Iterable<string>) => set({ selected: [...ids] })

  const toggle = (id: string) => {
    const next = new Set(selected)
    if (!next.delete(id)) next.add(id)
    setIds(next)
  }
  const toggleMany = (ids: string[]) => {
    const next = new Set(selected)
    const all = ids.every((i) => next.has(i))
    ids.forEach((i) => (all ? next.delete(i) : next.add(i)))
    setIds(next)
  }
  const idsOf = (s: Script, kinds?: string[]) =>
    GROUPS[s].filter((g) => !kinds || kinds.includes(g.kind)).flatMap((g) => g.kana.map((k) => k.id))

  const presets: { label: string; ids: () => string[] }[] = [
    { label: 'Vokal あ', ids: () => GROUPS[script][0].kana.map((k) => k.id) },
    { label: 'Semua dasar', ids: () => idsOf(script, ['dasar']) },
    { label: '+ Dakuten', ids: () => idsOf(script, ['dasar', 'dakuten']) },
    { label: 'Semua', ids: () => idsOf(script) },
  ]

  const combined = settings.mode === 'combined'

  return (
    <div className="bg-seigaiha relative min-h-dvh">
      <Petals count={8} />
      <div className="relative z-10 mx-auto max-w-3xl px-4 pb-32 pt-5">
        <button onClick={onBack} className="mb-4 cursor-pointer text-sm font-bold text-mute transition hover:text-bone">
          ← Kembali
        </button>
        <h1 className="text-3xl font-black">Latihan Bebas</h1>
        <p className="mt-1 text-sm text-mute">Pilih huruf yang mau diuji. Soal akan muncul acak sampai kamu menekan selesai.</p>

        {/* mode */}
        <section className="card mt-6 space-y-5 p-5">
          <div>
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-mute">Bentuk soal</h2>
            <Seg<QuizMode>
              value={settings.mode}
              onChange={(mode) => set({ mode })}
              options={[
                { v: 'single', label: 'Per huruf' },
                { v: 'combined', label: 'Gabungan acak' },
              ]}
            />
          </div>

          {combined && (
            <div>
              <div className="mb-2 flex items-center justify-between">
                <h2 className="text-xs font-extrabold uppercase tracking-widest text-mute">Panjang rangkaian</h2>
                <span className="font-jp text-lg font-bold">{settings.length} huruf</span>
              </div>
              <input
                type="range"
                min={2}
                max={6}
                value={settings.length}
                onChange={(e) => set({ length: Number(e.target.value) })}
                className="w-full accent-sharin"
              />
            </div>
          )}

          <div>
            <h2 className="mb-2 text-xs font-extrabold uppercase tracking-widest text-mute">Cara menjawab</h2>
            <Seg<AnswerMode>
              value={combined ? 'type' : settings.answer}
              onChange={(answer) => set({ answer })}
              options={[
                { v: 'type', label: 'Ketik' },
                { v: 'choice', label: 'Pilihan ganda', disabled: combined },
                { v: 'mix', label: 'Campur', disabled: combined },
              ]}
            />
            {combined && <p className="mt-2 text-xs text-mute">Mode gabungan selalu dijawab dengan mengetik, misalnya “sashisu”.</p>}
          </div>
        </section>

        {/* huruf */}
        <section className="card mt-5 p-5">
          <div className="mb-4 flex gap-2">
            {(['hiragana', 'katakana'] as Script[]).map((s) => {
              const count = GROUPS[s].flatMap((g) => g.kana).filter((k) => selected.has(k.id)).length
              return (
                <button
                  key={s}
                  onClick={() => setScript(s)}
                  className={`btn flex-1 ${script === s ? 'btn-red' : 'btn-ghost'}`}
                >
                  <span className="font-jp text-base normal-case">{SCRIPT_LABEL[s]}</span>
                  {count > 0 && <span className="rounded-md bg-black/30 px-1.5 text-xs">{count}</span>}
                </button>
              )
            })}
          </div>

          <div className="mb-5 flex flex-wrap gap-2">
            {presets.map((p) => (
              <button key={p.label} onClick={() => setIds(new Set([...selected, ...p.ids()]))} className="rounded-full border border-edge bg-panel-2 px-3 py-1.5 text-xs font-bold transition hover:border-sharin">
                {p.label}
              </button>
            ))}
            <button
              onClick={() => setIds([...selected].filter((id) => !id.startsWith(script)))}
              className="rounded-full border border-edge px-3 py-1.5 text-xs font-bold text-mute transition hover:border-sharin hover:text-bone"
            >
              Kosongkan {SCRIPT_LABEL[script]}
            </button>
          </div>

          <div className="space-y-5">
            {(['dasar', 'dakuten', 'yoon'] as const).map((kind) => (
              <div key={kind}>
                <h3 className="mb-2 text-xs font-bold uppercase tracking-widest text-mute">{KIND_LABEL[kind]}</h3>
                <div className="space-y-2">
                  {GROUPS[script]
                    .filter((g) => g.kind === kind)
                    .map((g) => {
                      const ids = g.kana.map((k) => k.id)
                      const all = ids.every((i) => selected.has(i))
                      return (
                        <div key={g.id} className="flex flex-wrap items-center gap-2">
                          <button
                            onClick={() => toggleMany(ids)}
                            className={`w-24 shrink-0 cursor-pointer rounded-lg border px-2 py-2 text-[11px] font-extrabold tracking-wider transition ${
                              all ? 'border-sharin bg-sharin/20 text-sharin-glow' : 'border-edge text-mute hover:text-bone'
                            }`}
                          >
                            {g.label}
                          </button>
                          {g.kana.map((k) => {
                            const on = selected.has(k.id)
                            return (
                              <button
                                key={k.id}
                                onClick={() => toggle(k.id)}
                                className={`flex min-w-14 cursor-pointer flex-col items-center rounded-xl border-2 px-2 py-1.5 transition ${
                                  on ? 'border-sharin bg-sharin/15' : 'border-edge bg-panel-2 opacity-70 hover:opacity-100'
                                }`}
                              >
                                <span className="font-jp text-2xl font-bold leading-tight">{k.char}</span>
                                <span className="text-[10px] font-semibold text-mute">{k.romaji[0]}</span>
                              </button>
                            )
                          })}
                        </div>
                      )
                    })}
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t-2 border-edge bg-night px-4 py-4">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-4">
          <p className="text-sm text-mute">
            <b className="text-bone">{settings.selected.length}</b> huruf dipilih
          </p>
          <button className="btn btn-red" disabled={settings.selected.length === 0} onClick={onStart}>
            Mulai latihan
          </button>
        </div>
      </div>
    </div>
  )
}
