import { describe, expect, it } from 'vitest'
import { DIALOGS, eligibleDialogs } from './dialogs'
import { freeConfig } from './free'
import { QuestionGenerator } from './generator'
import { GROUPS, SPECIAL_KANA } from './kana'
import { matchesSequence } from './romaji'
import type { FreeSettings } from './storage'

const hiragana = GROUPS.hiragana.flatMap((g) => g.kana).map((k) => k.id)
const specials = SPECIAL_KANA.map((k) => k.id)
const base: FreeSettings = { selected: [...hiragana, ...specials], mode: 'dialog', length: 4, answer: 'type' }

describe('bank dialog', () => {
  it('semua kalimat bisa diurai dan punya arti', () => {
    expect(DIALOGS.length).toBeGreaterThan(20)
    for (const d of DIALOGS) for (const l of d.lines) expect(l.meaning.length).toBeGreaterThan(0)
  })

  it('partikel dibaca wa/o/e, bacaan tulisannya tetap diterima', () => {
    const line = DIALOGS.find((d) => d.id === 'kenalan')!.lines[1]
    expect(matchesSequence('watashi wa sakura desu', line.seq)).toBe(true)
    expect(matchesSequence('watashiwasakuradesu', line.seq)).toBe(true)
    expect(matchesSequence('watashi ha sakura desu', line.seq)).toBe(true)
    const wo = DIALOGS.find((d) => d.id === 'minum')!.lines[1]
    expect(matchesSequence('ocha o kudasai', wo.seq)).toBe(true)
  })

  it('kata terakhir こんにちは dibaca konnichiwa', () => {
    const line = DIALOGS.find((d) => d.id === 'siang')!.lines[0]
    expect(matchesSequence('konnichiwa', line.seq)).toBe(true)
  })
})

describe('eligibleDialogs', () => {
  it('hanya dialog yang semua hurufnya dipilih', () => {
    expect(eligibleDialogs(['hiragana:あ'])).toEqual([])
    const all = eligibleDialogs(hiragana)
    expect(all.length).toBeGreaterThan(0)
    // dialog berhuruf khusus (っ) tidak ikut bila tidak dipilih
    expect(all.find((d) => d.id === 'sekolah')).toBeUndefined()
    expect(eligibleDialogs([...hiragana, 'hiragana:っ']).find((d) => d.id === 'sekolah')).toBeDefined()
  })
})

describe('mode dialog di generator', () => {
  it('memainkan satu dialog baris demi baris, lalu pindah ke dialog lain', () => {
    const cfg = freeConfig(base)
    const gen = new QuestionGenerator()
    const first = gen.next(cfg, {})
    expect(first.line?.no).toBe(1)
    expect(first.translation).toBeTruthy()
    const seen = [first]
    for (let i = 1; i < first.line!.of; i++) seen.push(gen.next(cfg, {}))
    expect(seen.map((q) => q.line!.no)).toEqual(seen.map((_, i) => i + 1))
    expect(new Set(seen.map((q) => q.line!.title)).size).toBe(1)
    const after = gen.next(cfg, {})
    expect(after.line?.no).toBe(1)
    expect(after.line?.title).not.toBe(first.line?.title)
  })

  it('arah tulis memakai kepingan, arah baca diketik', () => {
    expect(new QuestionGenerator().next(freeConfig(base), {}).type).toBe('type')
    expect(new QuestionGenerator().next(freeConfig({ ...base, direction: 'write' }), {}).type).toBe('tiles')
  })

  it('tanpa dialog yang cocok tetap menghasilkan soal biasa', () => {
    const q = new QuestionGenerator().next(freeConfig({ ...base, selected: hiragana.slice(0, 5), length: 3 }), {})
    expect(q.line).toBeUndefined()
    expect(q.seq.length).toBeGreaterThan(0)
  })
})
