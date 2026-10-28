import { useState } from 'react'
import HelpTip from '../../components/HelpTip'
import { GROUPS, KIND_LABEL, SCRIPT_LABEL, SPECIAL_KANA, groupTitle, type Kana, type Script } from '../../lib/kana'

const quiet =
  'cursor-pointer rounded border border-[#4d3727] px-3 py-1.5 text-sm font-semibold text-[#b9a782] transition hover:border-[#8a6a4a] hover:bg-[#2a1c14] hover:text-[#ead9b6]'

// jalan pintas: lebih menonjol dari tombol sekunder, tapi tetap di bawah tombol utama
const preset =
  'inline-flex cursor-pointer items-center gap-1.5 rounded border border-[#a8834f] bg-[#e9b44c]/10 px-3.5 py-2 text-sm font-bold text-[#f3dca6] transition hover:bg-[#e9b44c]/20 hover:border-[#d6a85f] active:translate-y-px'

interface Card {
  key: string
  title: string
  kana: Kana[]
  /** penjelasan singkat di tooltip */
  help?: string
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

/** huruf khusus: bacaannya mengikuti huruf lain, jadi hanya muncul di dalam kata nyata */
function specialCards(script: Script): Card[] {
  const of = (special: 'sokuon' | 'choon') => SPECIAL_KANA.filter((k) => k.script === script && k.special === special)
  return [
    {
      key: `${script}-sokuon`,
      title: 'Konsonan rangkap',
      kana: of('sokuon'),
      help: 'っ/ッ kecil menggandakan konsonan huruf sesudahnya: きって = kitte, ざっし = zasshi. Soalnya muncul di dalam kata nyata, dan kamu mengetik konsonan berikutnya (ki · t · te).',
    },
    {
      key: `${script}-choon`,
      title: 'Vokal panjang',
      kana: of('choon'),
      help: 'ー memanjangkan vokal huruf sebelumnya, terutama di katakana: ゲーム = geemu. Soalnya muncul di dalam kata nyata, dan kamu mengetik vokalnya (ge · e · mu) atau tanda “-”.',
    },
  ]
}

interface CardProps {
  card: Card
  selected: Set<string>
  onToggle: (id: string) => void
  onToggleAll: (ids: string[]) => void
}

/** satu kartu huruf dengan tombol "Pilih semua" dan kepingan tiap huruf */
function LetterCard({ card, selected, onToggle, onToggleAll }: CardProps) {
  const ids = card.kana.map((k) => k.id)
  const all = ids.every((i) => selected.has(i))
  return (
    <div className="rounded-lg border border-[#3a2a20] bg-[#120c09]/80 p-3">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h4 className="flex min-w-0 items-center gap-1 text-sm font-bold leading-tight">
          {card.title}
          {card.help && <HelpTip label={`Tentang ${card.title}`}>{card.help}</HelpTip>}
        </h4>
        <button
          onClick={() => onToggleAll(ids)}
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
        {card.kana.map((k) => {
          const on = selected.has(k.id)
          return (
            <div key={k.id} className="koma-wrap">
              <button
                onClick={() => onToggle(k.id)}
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
}

interface Props {
  selected: string[]
  onChange: (ids: string[]) => void
}

/** pemilih huruf: tab skrip, jalan pintas, lalu kartu per baris huruf, ditutup huruf khusus */
export default function LetterPicker({ selected: selectedIds, onChange }: Props) {
  const [script, setScript] = useState<Script>('hiragana')
  const selected = new Set(selectedIds)
  const setIds = (ids: Iterable<string>) => onChange([...ids])

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

  return (
    <>
      <div className="tabs max-w-md" role="tablist" aria-label="Pilih skrip">
        {(['hiragana', 'katakana'] as Script[]).map((s) => {
          const n = [...GROUPS[s].flatMap((g) => g.kana), ...SPECIAL_KANA.filter((k) => k.script === s)].filter((k) => selected.has(k.id)).length
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
        <button onClick={() => setIds([...selected].filter((id) => !id.startsWith(script)))} className={`${quiet} !border-dashed`}>
          Kosongkan {SCRIPT_LABEL[script]}
        </button>
      </div>

      <div className="mt-6 space-y-8">
        {(['dasar', 'dakuten', 'yoon'] as const).map((kind) => (
          <section key={kind}>
            <h3 className="font-display mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#cdb88f]">{KIND_LABEL[kind]}</h3>
            <div className="grid gap-4 md:grid-cols-2">
              {cardsFor(script, kind).map((card) => (
                <LetterCard key={card.key} card={card} selected={selected} onToggle={toggle} onToggleAll={toggleMany} />
              ))}
            </div>
          </section>
        ))}
        <section>
          <h3 className="font-display mb-3 text-sm font-extrabold uppercase tracking-[0.18em] text-[#cdb88f]">Huruf khusus</h3>
          <div className="grid gap-4 md:grid-cols-2">
            {specialCards(script).map((card) => (
              <LetterCard key={card.key} card={card} selected={selected} onToggle={toggle} onToggleAll={toggleMany} />
            ))}
          </div>
        </section>
      </div>
    </>
  )
}
