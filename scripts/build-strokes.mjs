// Membuat src/data/strokes.json dari KanjiVG (CC BY-SA 3.0, https://kanjivg.tagaini.net).
// pemakaian: node scripts/build-strokes.mjs <folder-cache-unduhan>
import fs from 'node:fs'
import path from 'node:path'
import { ALL_KANA } from '../src/lib/kana.ts'

const cache = process.argv[2]
if (!cache) throw new Error('isi folder cache unduhan, mis. node scripts/build-strokes.mjs /tmp/kvg')
fs.mkdirSync(cache, { recursive: true })

// semua code point yang dipakai aplikasi (yoon = dua karakter) + tsu kecil
const chars = new Set([...'っッ'])
for (const k of ALL_KANA) for (const c of k.char) chars.add(c)

const file = (c) => c.codePointAt(0).toString(16).padStart(5, '0') + '.svg'
const BASE = 'https://raw.githubusercontent.com/KanjiVG/kanjivg/master/kanji/'

async function fetchOne(c) {
  const f = path.join(cache, file(c))
  if (fs.existsSync(f)) return
  const res = await fetch(BASE + file(c))
  if (!res.ok) throw new Error(`${c} ${res.status}`)
  fs.writeFileSync(f, await res.text())
}

const list = [...chars]
for (let i = 0; i < list.length; i += 8) await Promise.all(list.slice(i, i + 8).map(fetchOne))

const out = {}
for (const c of list.sort()) {
  const svg = fs.readFileSync(path.join(cache, file(c)), 'utf8')
  const strokes = [...svg.matchAll(/<path id="kvg:[0-9a-f]+-s(\d+)"[^>]*?\sd="([^"]+)"/g)]
    .map((m) => ({ n: Number(m[1]), d: m[2] }))
    .sort((a, b) => a.n - b.n)
  const nums = [...svg.matchAll(/<text transform="matrix\(1 0 0 1 ([\d.]+) ([\d.]+)\)">(\d+)<\/text>/g)]
    .map((m) => ({ n: Number(m[3]), x: Number(m[1]), y: Number(m[2]) }))
    .sort((a, b) => a.n - b.n)
  if (!strokes.length || strokes.length !== nums.length) throw new Error(`data ${c} tidak lengkap`)
  out[c] = { s: strokes.map((s) => s.d), n: nums.map((n) => [n.x, n.y]) }
}
fs.writeFileSync('src/data/strokes.json', JSON.stringify(out))
console.log(Object.keys(out).length, 'karakter,', (fs.statSync('src/data/strokes.json').size / 1024).toFixed(1), 'KB')
