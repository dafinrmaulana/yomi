import { GROUPS, type Script } from './kana'
import type { Progress } from './storage'

export interface Rank {
  id: string
  name: string
  min: number
  desc: string
}

export const RANKS: Rank[] = [
  { id: 'akademi', name: 'Murid Akademi', min: 0, desc: 'Baru belajar mengenali huruf.' },
  { id: 'genin', name: 'Genin', min: 150, desc: 'Sudah hafal beberapa baris.' },
  { id: 'chunin', name: 'Chunin', min: 500, desc: 'Membaca mulai lancar.' },
  { id: 'jonin', name: 'Jonin', min: 1200, desc: 'Jarang salah membaca kana.' },
  { id: 'anbu', name: 'ANBU', min: 2500, desc: 'Cepat dan akurat.' },
  { id: 'hokage', name: 'Hokage', min: 5000, desc: 'Puncak dojo. Matamu terbuka sepenuhnya.' },
]

export function rankFor(xp: number) {
  let i = 0
  RANKS.forEach((r, n) => xp >= r.min && (i = n))
  const rank = RANKS[i]
  const next = RANKS[i + 1] ?? null
  const pct = next ? ((xp - rank.min) / (next.min - rank.min)) * 100 : 100
  return { rank, next, pct: Math.min(100, Math.max(0, pct)), index: i }
}

export interface Badge {
  id: string
  name: string
  desc: string
  /** isi segel (singkat) */
  mark: string
  earned: (p: Progress) => boolean
}

const completed = (p: Progress, s: Script) => GROUPS[s].filter((g) => (p.completed[`${s}:${g.id}`] ?? 0) > 0).length
const allDone = (p: Progress, s: Script) => completed(p, s) === GROUPS[s].length

export const BADGES: Badge[] = [
  { id: 'first', name: 'Misi Pertama', desc: 'Selesaikan satu misi di papan.', mark: '1', earned: (p) => Object.values(p.completed).some((v) => v > 0) },
  { id: 'perfect', name: 'Sempurna', desc: 'Raih 3 bintang di satu misi.', mark: '★', earned: (p) => Object.values(p.completed).some((v) => v >= 3) },
  { id: 'hira', name: 'Penguasa Hiragana', desc: 'Selesaikan semua misi hiragana.', mark: 'H', earned: (p) => allDone(p, 'hiragana') },
  { id: 'kata', name: 'Penguasa Katakana', desc: 'Selesaikan semua misi katakana.', mark: 'K', earned: (p) => allDone(p, 'katakana') },
  { id: 's3', name: 'Api Kecil', desc: 'Berlatih 3 hari berturut-turut.', mark: '3', earned: (p) => p.bestStreak >= 3 || p.dayStreak >= 3 },
  { id: 's7', name: 'Api Membara', desc: 'Berlatih 7 hari berturut-turut.', mark: '7', earned: (p) => p.bestStreak >= 7 || p.dayStreak >= 7 },
  { id: 's30', name: 'Api Abadi', desc: 'Berlatih 30 hari berturut-turut.', mark: '30', earned: (p) => p.bestStreak >= 30 || p.dayStreak >= 30 },
  { id: 'c100', name: 'Seratus Benar', desc: 'Total 100 jawaban benar.', mark: '100', earned: (p) => p.totalCorrect >= 100 },
  { id: 'c1000', name: 'Seribu Benar', desc: 'Total 1.000 jawaban benar.', mark: '1K', earned: (p) => p.totalCorrect >= 1000 },
  { id: 'mk', name: 'Mangekyō', desc: 'Capai combo 10 jawaban benar beruntun.', mark: '10', earned: (p) => p.bestCombo >= 10 },
  { id: 'mk2', name: 'Mata Tak Berkedip', desc: 'Capai combo 25 jawaban benar beruntun.', mark: '25', earned: (p) => p.bestCombo >= 25 },
  { id: 'review', name: 'Rajin Mengulang', desc: 'Selesaikan 5 sesi Ulangan Harian.', mark: '5', earned: (p) => p.reviewSessions >= 5 },
  { id: 'write10', name: 'Pelukis Aksara', desc: 'Tulis 10 huruf dengan benar di Latihan Menulis.', mark: '10', earned: (p) => p.written.length >= 10 },
  { id: 'write50', name: 'Kaligrafer', desc: 'Tulis 50 huruf dengan benar di Latihan Menulis.', mark: '50', earned: (p) => p.written.length >= 50 },
]
