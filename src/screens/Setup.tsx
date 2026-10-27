import { ArrowLeft, ChevronDown } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import AdviceCard from '../components/AdviceCard'
import Petals from '../components/Petals'
import Switch from '../components/Switch'
import { adviceFor, applyAction } from '../lib/advice'
import { GROUPS, KIND_LABEL, SCRIPT_LABEL, groupTitle, type Kana, type Script } from '../lib/kana'
import type { AnswerMode, Direction, FreeSettings, SpeedStat } from '../lib/storage'

interface Props {
  settings: FreeSettings
  stats: Record<string, { r: number; w: number }>
  speed: Record<string, SpeedStat>
  onChange: (s: FreeSettings) => void
  onStart: () => void
  onBack: () => void
}

function Step({ n, title, hint, children }: { n: number; title: string; hint: string; children: ReactNode }) {
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

function Choice({
  selected,
  disabled,
  title,
  desc,
  onClick,
}: {
  selected: boolean
  disabled?: boolean
  title: string
  desc: string
  onClick: () => void
}) {
  return (
    <button
      role="radio"
      aria-checked={selected}
      disabled={disabled}
      onClick={onClick}
      className={`flex min-w-0 flex-col gap-1 rounded-lg border-2 p-4 text-left transition ${
        selected ? 'border-sharin bg-sharin/10' : 'border-[#3a2a20] bg-[#120c09]/80 hover:border-[#6a4b36]'
      } ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}
    >
      <span className="flex items-center gap-2 text-base font-bold">
        <span
          className={`grid size-5 shrink-0 place-items-center rounded-full border-2 ${
            selected ? 'border-sharin bg-sharin' : 'border-[#6a4b36]'
          }`}
        >
          {selected && (
            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="#fff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M5 12.5l4.5 4.5L19 7.5" />
            </svg>
          )}
        </span>
        {title}
      </span>
      <span className="text-sm leading-snug text-[#b9a782]">{desc}</span>
    </button>
  )
}

const quiet =
  'cursor-pointer rounded border border-[#4d3727] px-3 py-1.5 text-sm font-semibold text-[#b9a782] transition hover:border-[#8a6a4a] hover:bg-[#2a1c14] hover:text-[#ead9b6]'

// jalan pintas: lebih menonjol dari tombol sekunder, tapi tetap di bawah tombol utama
const preset =
  'inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#a8834f] bg-[#e9b44c]/10 px-3.5 py-2 text-sm font-bold text-[#f3dca6] transition hover:bg-[#e9b44c]/20 hover:border-[#d6a85f] active:translate-y-px'

interface Card {
  key: string
  title: string
  kana: Kana[]
}

/** satu kartu per baris; huruf gabungan dipecah per tiga (kya kyu kyo) supaya sama besar dengan kartu lain */
function cardsFor(script: Script, kind: 'dasar' | 'dakuten' | 'yoon'): Card[] {
  return GROUPS[script]
    .filter((g) => g.kind === kind)
    .flatMap((g): Card[] => {
      if (kind !== 'yoon') return [{ key: g.id, title: groupTitle(g), kana: g.kana }]
      const out: Card[] = []
      for (let i = 0; i < g.kana.length; i += 3) {
        const kana = g.kana.slice(i, i + 3)
        out.push({ key: `${g.id}-${i}`, title: kana.map((k) => k.romaji[0].toUpperCase()).join(' · '), kana })
      }
      return out
    })
}

export default function Setup({ settings, stats, speed, onChange, onStart, onBack }: Props) {
  const [script, setScript] = useState<Script>('hiragana')
  const [wordsInfo, setWordsInfo] = useState(false)
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
    { label: 'Vokal (A I U E O)', ids: () => GROUPS[script][0].kana.map((k) => k.id) },
    { label: 'Semua dasar', ids: () => idsOf(script, ['dasar']) },
    { label: 'Dasar + Dakuten', ids: () => idsOf(script, ['dasar', 'dakuten']) },
    { label: 'Semua huruf', ids: () => idsOf(script) },
  ]

  const combined = settings.mode === 'combined'
  const write = (settings.direction ?? 'read') === 'write'
  const answers: { v: AnswerMode; title: string; desc: string }[] = write
    ? [
        { v: 'type', title: 'Ketik', desc: 'Ketik huruf Jepangnya dengan keyboard Jepang, misalnya “し”.' },
        { v: 'choice', title: 'Pilihan ganda', desc: 'Pilih satu dari empat huruf Jepang.' },
        { v: 'mix', title: 'Campur', desc: 'Selang-seling ketik dan pilihan.' },
      ]
    : [
        { v: 'type', title: 'Ketik', desc: 'Tulis romaji, misalnya “shi”.' },
        { v: 'choice', title: 'Pilihan ganda', desc: 'Pilih satu dari empat bacaan.' },
        { v: 'mix', title: 'Campur', desc: 'Selang-seling ketik dan pilihan.' },
      ]
  const count = settings.selected.length
  const advice = adviceFor(settings, stats, speed)[0]

  return (
    <div className="desk relative min-h-dvh">
      <Petals count={8} />
      <div className="relative z-10 mx-auto max-w-4xl px-4 pb-32 pt-5">
        <button onClick={onBack} className="btn btn-ghost btn-sm mb-5">
          <ArrowLeft size={16} strokeWidth={2.5} className="shrink-0" aria-hidden />
          <span>Kembali</span>
        </button>

        <div className="plank mb-8 rounded-xl px-6 py-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.28em] text-sharin-glow">Latihan Bebas</p>
          <h1 className="font-display mt-1 text-3xl font-extrabold">Meja Latihan</h1>
          <p className="mt-1 text-sm text-[#cdb88f]">Ikuti empat langkah di bawah, lalu soal muncul acak sampai kamu puas.</p>
        </div>

        {advice && (
          <div className="mb-8">
            <AdviceCard advice={advice} onApply={(a) => onChange(applyAction(settings, a))} />
          </div>
        )}

        <div className="relative">
          {/* garis timeline */}
          <div className="absolute bottom-5 left-5 top-5 w-0.5 -translate-x-1/2 bg-[#4d3727]" aria-hidden />

          <ol className="relative">
            <Step n={1} title="Pilih arah soal" hint="Mau membaca huruf Jepang, atau menulisnya dari romaji?">
              <div role="radiogroup" aria-label="Arah soal" className="grid gap-3 sm:grid-cols-2">
                {(
                  [
                    { v: 'read', title: 'Baca', desc: 'Lihat huruf Jepang, jawab bacaannya dalam romaji. Contoh: し → shi.' },
                    { v: 'write', title: 'Tulis', desc: 'Lihat romaji, jawab dengan huruf Jepangnya. Contoh: shi → し.' },
                  ] as { v: Direction; title: string; desc: string }[]
                ).map((o) => (
                  <Choice
                    key={o.v}
                    selected={(settings.direction ?? 'read') === o.v}
                    onClick={() => set({ direction: o.v })}
                    title={o.title}
                    desc={o.desc}
                  />
                ))}
              </div>
            </Step>

            <Step n={2} title="Pilih bentuk soal" hint="Mau berlatih satu huruf, atau rangkaian huruf acak?">
              <div role="radiogroup" aria-label="Bentuk soal" className="grid gap-3 sm:grid-cols-2">
                <Choice
                  selected={!combined}
                  onClick={() => set({ mode: 'single' })}
                  title="Per huruf"
                  desc="Satu huruf acak di setiap soal."
                />
                <Choice
                  selected={combined}
                  onClick={() => set({ mode: 'combined' })}
                  title="Gabungan acak"
                  desc="Beberapa huruf acak berurutan, dijawab sekaligus."
                />
              </div>

              {combined && (
                <div className="mt-3 rounded-lg border border-[#3a2a20] bg-[#120c09]/80 p-4">
                  <div className="mb-2 flex items-baseline justify-between gap-3">
                    <label htmlFor="len" className="text-sm font-semibold">
                      Panjang rangkaian
                    </label>
                    <b className="text-xl tabular-nums">{settings.length} huruf</b>
                  </div>
                  <input
                    id="len"
                    type="range"
                    min={2}
                    max={20}
                    value={settings.length}
                    onChange={(e) => set({ length: Number(e.target.value) })}
                    className="w-full accent-sharin"
                  />
                  <div className="mt-4 border-t border-[#3a2a20] pt-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">Susun dari kata nyata</p>
                        <button
                          type="button"
                          onClick={() => setWordsInfo((v) => !v)}
                          aria-expanded={wordsInfo}
                          className="mt-0.5 inline-flex cursor-pointer items-center gap-1 text-xs font-semibold text-[#b9a782] transition hover:text-bone"
                        >
                          Apa ini?
                          <ChevronDown size={14} aria-hidden className={`transition-transform ${wordsInfo ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      <Switch checked={!!settings.words} onChange={(words) => set({ words })} label="Susun dari kata nyata" />
                    </div>
                    {wordsInfo && (
                      <p className="mt-2 text-sm text-[#b9a782]">
                        Rangkaian berupa kata sungguhan (misalnya ねこ = kucing). Arti tiap kata muncul di bawah kata itu begitu selesai diketik dengan benar. Kalau lebih panjang
                        dari satu kata, beberapa kata dirangkai. Kalau huruf yang dipilih belum cukup untuk membentuk kata, soal tetap diacak.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </Step>

            <Step
              n={3}
              title="Pilih cara menjawab"
              hint={
                combined
                  ? 'Mode gabungan selalu dijawab dengan mengetik.'
                  : write
                    ? 'Ketik huruf Jepangnya, atau pilih dari empat pilihan.'
                    : 'Ketik bacaannya, atau pilih dari empat pilihan.'
              }
            >
              <div role="radiogroup" aria-label="Cara menjawab" className="grid gap-3 sm:grid-cols-3">
                {answers.map((o) => (
                  <Choice
                    key={o.v}
                    selected={(combined ? 'type' : settings.answer) === o.v}
                    disabled={combined && o.v !== 'type'}
                    onClick={() => set({ answer: o.v })}
                    title={o.title}
                    desc={o.desc}
                  />
                ))}
              </div>
            </Step>

            <Step n={4} title="Pilih huruf yang diuji" hint="Ketuk kepingan untuk memilih. Bisa campur hiragana dan katakana.">
              <div className="tabs max-w-md" role="tablist" aria-label="Pilih skrip">
                {(['hiragana', 'katakana'] as Script[]).map((s) => {
                  const n = GROUPS[s].flatMap((g) => g.kana).filter((k) => selected.has(k.id)).length
                  return (
                    <button key={s} role="tab" aria-selected={script === s} onClick={() => setScript(s)} className="tab">
                      {SCRIPT_LABEL[s]}
                      {n > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-[#f3e7cf] px-1.5 text-xs font-extrabold leading-none text-[#1b1410] tabular-nums">{n}</span>}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {presets.map((p) => (
                  <button key={p.label} onClick={() => setIds(new Set([...selected, ...p.ids()]))} className={preset}>
                    <svg viewBox="0 0 24 24" width="13" height="13" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden>
                      <path d="M12 5v14M5 12h14" />
                    </svg>
                    {p.label}
                  </button>
                ))}
                <button
                  onClick={() => setIds([...selected].filter((id) => !id.startsWith(script)))}
                  className={`${quiet} !border-dashed`}
                >
                  Kosongkan {SCRIPT_LABEL[script]}
                </button>
              </div>

              <div className="mt-6 space-y-8">
                {(['dasar', 'dakuten', 'yoon'] as const).map((kind) => (
                  <section key={kind}>
                    <h3 className="font-display mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#cdb88f]">
                      {KIND_LABEL[kind]}
                    </h3>
                    <div className="grid gap-4 md:grid-cols-2">
                      {cardsFor(script, kind).map((g) => {
                          const ids = g.kana.map((k) => k.id)
                          const all = ids.every((i) => selected.has(i))
                          return (
                            <div key={g.key} className="rounded-lg border border-[#3a2a20] bg-[#120c09]/80 p-3">
                              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                                <h4 className="min-w-0 text-sm font-bold leading-tight">{g.title}</h4>
                                <button
                                  onClick={() => toggleMany(ids)}
                                  aria-pressed={all}
                                  className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 whitespace-nowrap rounded border px-2.5 py-1 text-xs font-semibold transition ${
                                    all
                                      ? 'border-sharin/50 bg-sharin/15 text-sharin-glow hover:bg-sharin/25'
                                      : 'border-[#4d3727] text-[#b9a782] hover:border-[#8a6a4a] hover:bg-[#2a1c14] hover:text-[#ead9b6]'
                                  }`}
                                >
                                  <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                    {all ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <path d="M12 5v14M5 12h14" />}
                                  </svg>
                                  {all ? 'Lepas semua' : 'Pilih semua'}
                                </button>
                              </div>
                              <div className="grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                                {g.kana.map((k) => {
                                  const on = selected.has(k.id)
                                  return (
                                    <div key={k.id} className="koma-wrap">
                                      <button
                                        onClick={() => toggle(k.id)}
                                        aria-pressed={on}
                                        aria-label={`${k.char} ${k.romaji[0]}`}
                                        className={`koma ${on ? 'on' : ''}`}
                                      >
                                        <span className={`kana-char font-jp font-bold leading-none ${k.char.length > 1 ? 'kana-wide' : ''}`}>{k.char}</span>
                                        <span className="rom mt-1.5">{k.romaji[0]}</span>
                                      </button>
                                    </div>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                    </div>
                  </section>
                ))}
              </div>
            </Step>
          </ol>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#3a2a20] bg-[#0f0a07] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-sm text-[#cdb88f]">
            <b className="text-lg text-bone">{count}</b> huruf dipilih
          </p>
          <button className="btn btn-red" disabled={count === 0} onClick={onStart}>
            Mulai latihan
          </button>
        </div>
      </div>
    </div>
  )
}
