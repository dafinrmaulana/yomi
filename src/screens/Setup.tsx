import { ArrowLeft } from 'lucide-react'
import Petals from '../components/Petals'
import { eligibleDialogs } from '../lib/dialogs'
import { specialIds } from '../lib/free'
import type { AnswerMode, Direction, FreeSettings, WriteInput } from '../lib/storage'
import Choice from './setup/Choice'
import LetterPicker from './setup/LetterPicker'
import Step from './setup/Step'

interface Props {
  settings: FreeSettings
  onChange: (s: FreeSettings) => void
  onStart: () => void
  onBack: () => void
}

export default function Setup({ settings, onChange, onStart, onBack }: Props) {
  const set = (patch: Partial<FreeSettings>) => onChange({ ...settings, ...patch })
  const combined = settings.mode === 'combined'
  const dialog = settings.mode === 'dialog'
  // gabungan dan dialog dijawab dengan mengetik; hanya per huruf yang punya pilihan ganda
  const sentence = settings.mode !== 'single'
  const write = (settings.direction ?? 'read') === 'write'
  const answers: { v: AnswerMode; title: string; desc: string }[] = [
    { v: 'type', title: 'Ketik', desc: 'Tulis romaji, misalnya “shi”.' },
    { v: 'choice', title: 'Pilihan ganda', desc: 'Pilih satu dari empat bacaan.' },
    { v: 'mix', title: 'Campur', desc: 'Selang-seling ketik dan pilihan.' },
  ]
  const inputs: { v: WriteInput; title: string; desc: string }[] = [
    { v: 'tiles', title: 'Pilih huruf', desc: 'Susun jawaban dari kepingan huruf Jepang, tanpa keyboard Jepang. Cocok untuk HP.' },
    { v: 'keyboard', title: 'Keyboard', desc: 'Ketik huruf Jepangnya langsung, misalnya “し”. Butuh keyboard Jepang (IME).' },
  ]
  // huruf khusus tidak bisa jadi soal sendiri, jadi tidak dihitung sebagai bahan latihan
  const extra = specialIds(settings.selected).length
  const count = settings.selected.length - extra
  const dialogCount = eligibleDialogs(settings.selected).length

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

            <Step n={2} title="Pilih bentuk soal" hint="Mau berlatih satu huruf, rangkaian huruf acak, atau percakapan pendek?">
              <div role="radiogroup" aria-label="Bentuk soal" className="grid gap-3 sm:grid-cols-3">
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
                <Choice
                  selected={dialog}
                  disabled={dialogCount === 0 && !dialog}
                  onClick={() => set({ mode: 'dialog' })}
                  title="Dialog"
                  desc={
                    dialogCount > 0
                      ? `Percakapan pendek, dijawab baris demi baris. ${dialogCount} dialog cocok dengan hurufmu.`
                      : 'Percakapan pendek, dijawab baris demi baris. Belum ada yang cocok dengan hurufmu: pilih lebih banyak huruf di langkah 4, misalnya semua huruf hiragana.'
                  }
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
                </div>
              )}
            </Step>

            <Step
              n={3}
              title="Pilih cara menjawab"
              hint={
                write
                  ? 'Susun dari kepingan huruf, atau ketik dengan keyboard Jepang.'
                  : sentence
                    ? `Mode ${dialog ? 'dialog' : 'gabungan'} selalu dijawab dengan mengetik.`
                    : 'Ketik bacaannya, atau pilih dari empat pilihan.'
              }
            >
              {write ? (
                <div role="radiogroup" aria-label="Cara menjawab" className="grid gap-3 sm:grid-cols-2">
                  {inputs.map((o) => (
                    <Choice
                      key={o.v}
                      selected={(settings.input ?? 'tiles') === o.v}
                      onClick={() => set({ input: o.v })}
                      title={o.title}
                      desc={o.desc}
                    />
                  ))}
                </div>
              ) : (
                <div role="radiogroup" aria-label="Cara menjawab" className="grid gap-3 sm:grid-cols-3">
                  {answers.map((o) => (
                    <Choice
                      key={o.v}
                      selected={(sentence ? 'type' : settings.answer) === o.v}
                      disabled={sentence && o.v !== 'type'}
                      onClick={() => set({ answer: o.v })}
                      title={o.title}
                      desc={o.desc}
                    />
                  ))}
                </div>
              )}
            </Step>

            <Step n={4} title="Pilih huruf yang diuji" hint="Ketuk kepingan untuk memilih. Bisa campur hiragana dan katakana.">
              <LetterPicker selected={settings.selected} onChange={(selected) => set({ selected })} />
            </Step>
          </ol>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-[#3a2a20] bg-[#0f0a07] px-4 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4">
          <p className="text-sm text-[#cdb88f]">
            <b className="text-lg text-bone">{count}</b> huruf dipilih{extra > 0 && ` + ${extra} huruf khusus`}
            {dialog && ` · ${dialogCount} dialog`}
          </p>
          <button className="btn btn-red" disabled={count === 0 || (dialog && dialogCount === 0)} onClick={onStart}>
            Mulai latihan
          </button>
        </div>
      </div>
    </div>
  )
}
