// Pencocokan goresan secara geometri di browser (bukan AI, tanpa server):
// goresan pengguna dinormalkan ke kotak huruf contoh, lalu dibandingkan titik demi titik.

export type Pt = [number, number]

const SAMPLES = 32
/** toleransi bentuk (jarak chamfer), sebagai pecahan dari ukuran huruf */
const TOLERANCE = 0.14
/** panjang goresan pengguna terhadap contoh harus dalam rentang ini */
const LENGTH_RATIO: [number, number] = [0.55, 1.8]
const MIN_STROKE = 2

const nums = (s: string) => (s.match(/-?\d*\.?\d+(?:e-?\d+)?/gi) ?? []).map(Number)

/** polyline dari path KanjiVG (hanya perintah M dan c yang dipakai datanya) */
export function samplePath(d: string, perCurve = 14): Pt[] {
  const pts: Pt[] = []
  let x = 0
  let y = 0
  for (const m of d.matchAll(/([Mc])([^Mc]*)/g)) {
    const v = nums(m[2])
    if (m[1] === 'M') {
      x = v[0]
      y = v[1]
      pts.push([x, y])
    } else {
      for (let i = 0; i + 5 < v.length; i += 6) {
        const p1: Pt = [x + v[i], y + v[i + 1]]
        const p2: Pt = [x + v[i + 2], y + v[i + 3]]
        const p3: Pt = [x + v[i + 4], y + v[i + 5]]
        for (let k = 1; k <= perCurve; k++) {
          const t = k / perCurve
          const u = 1 - t
          pts.push([
            u * u * u * x + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
            u * u * u * y + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
          ])
        }
        x = p3[0]
        y = p3[1]
      }
    }
  }
  return pts
}

export const length = (pts: Pt[]) => {
  let l = 0
  for (let i = 1; i < pts.length; i++) l += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])
  return l
}

/** n titik berjarak sama di sepanjang garis */
export function resample(pts: Pt[], n = SAMPLES): Pt[] {
  const total = length(pts)
  if (pts.length === 0) return []
  if (total === 0) return Array.from({ length: n }, () => pts[0])
  const out: Pt[] = [pts[0]]
  let acc = 0
  let seg = 1
  let prev = pts[0]
  const step = total / (n - 1)
  let target = step
  while (out.length < n - 1 && seg < pts.length) {
    const cur = pts[seg]
    const d = Math.hypot(cur[0] - prev[0], cur[1] - prev[1])
    if (acc + d >= target && d > 0) {
      const t = (target - acc) / d
      const p: Pt = [prev[0] + (cur[0] - prev[0]) * t, prev[1] + (cur[1] - prev[1]) * t]
      out.push(p)
      prev = p
      acc = target
      target += step
    } else {
      acc += d
      prev = cur
      seg++
    }
  }
  while (out.length < n) out.push(pts[pts.length - 1])
  return out
}

const bbox = (strokes: Pt[][]) => {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const s of strokes)
    for (const [x, y] of s) {
      x0 = Math.min(x0, x)
      y0 = Math.min(y0, y)
      x1 = Math.max(x1, x)
      y1 = Math.max(y1, y)
    }
  return { x0, y0, x1, y1, size: Math.max(x1 - x0, y1 - y0, 1), cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }
}

const dist = (a: Pt, b: Pt) => Math.hypot(a[0] - b[0], a[1] - b[1])

/** rata-rata jarak terdekat dua arah; tidak bergantung pada kecepatan menggambar */
const chamfer = (a: Pt[], b: Pt[]) => {
  const one = (x: Pt[], y: Pt[]) => x.reduce((s, p) => s + Math.min(...y.map((q) => dist(p, q))), 0) / x.length
  return (one(a, b) + one(b, a)) / 2
}

/** buang goresan yang terlalu pendek (ketukan tak sengaja) */
export const cleanStrokes = (user: Pt[][]) => user.filter((s) => length(s) >= MIN_STROKE)

export type StrokeStatus = 'ok' | 'reversed' | 'order' | 'shape' | 'extra'

export interface StrokeVerdict {
  status: StrokeStatus
  /** untuk status 'order': goresan keberapa (mulai 1) yang cocok */
  matches?: number
}

export interface CheckResult {
  ok: boolean
  drawn: number
  expected: number
  strokes: StrokeVerdict[]
  /** satu kalimat ringkas untuk pengguna */
  summary: string
}

export function checkStrokes(userRaw: Pt[][], refPaths: string[]): CheckResult {
  const refRaw = refPaths.map((d) => samplePath(d))
  const refs = refRaw.map((p) => resample(p))
  const user = cleanStrokes(userRaw)
  const expected = refs.length

  if (user.length === 0) {
    return { ok: false, drawn: 0, expected, strokes: [], summary: 'Belum ada goresan. Gambar hurufnya dulu.' }
  }

  // samakan posisi dan ukuran keseluruhan huruf, supaya letak dan besar gambar tidak dihitung salah
  const rb = bbox(refRaw)
  const ub = bbox(user)
  const k = rb.size / ub.size
  const norm = (s: Pt[]): Pt[] => s.map(([x, y]) => [rb.cx + (x - ub.cx) * k, rb.cy + (y - ub.cy) * k])
  const us = user.map((s) => resample(norm(s)))
  const tol = TOLERANCE * rb.size

  const refLen = refRaw.map((p) => length(resample(p, 14)))
  // panjang diukur dari garis yang sudah diratakan, supaya getaran kecil tidak ikut dihitung
  const userLen = user.map((st) => length(resample(norm(st), 14)))
  const shapeOk = (i: number, j: number) => {
    const r = userLen[i] / Math.max(refLen[j], 1)
    return r >= LENGTH_RATIO[0] && r <= LENGTH_RATIO[1] && chamfer(us[i], refs[j]) <= tol
  }
  // arah: titik awal pengguna lebih dekat ke awal contoh daripada ke ujungnya
  const forward = (i: number, j: number) => {
    const u = us[i]
    const r = refs[j]
    const sameEnds = dist(r[0], r[r.length - 1]) < 0.25 * refLen[j] // goresan melingkar: arah tak bisa dipastikan
    if (sameEnds) return true
    return dist(u[0], r[0]) + dist(u[u.length - 1], r[r.length - 1]) <= dist(u[0], r[r.length - 1]) + dist(u[u.length - 1], r[0])
  }

  const strokes: StrokeVerdict[] = us.map((_, i) => {
    if (i >= expected) return { status: 'extra' }
    if (shapeOk(i, i)) return { status: forward(i, i) ? 'ok' : 'reversed' }
    for (let j = 0; j < expected; j++) {
      if (j !== i && shapeOk(i, j) && forward(i, j)) return { status: 'order', matches: j + 1 }
    }
    return { status: 'shape' }
  })

  const ok = us.length === expected && strokes.every((s) => s.status === 'ok')
  let summary = 'Benar! Urutan, arah, dan bentuk goresanmu sesuai.'
  if (!ok) {
    const bad = strokes.findIndex((s) => s.status !== 'ok')
    if (us.length < expected && bad === -1) summary = `Goresanmu baru ${us.length} dari ${expected}. Masih kurang ${expected - us.length}.`
    else if (us.length > expected) summary = `Goresanmu ${us.length}, seharusnya ${expected}. Ada goresan berlebih.`
    else {
      const v = strokes[bad]
      const n = bad + 1
      summary =
        v.status === 'reversed'
          ? `Goresan ke-${n} arahnya terbalik.`
          : v.status === 'order'
            ? `Goresan ke-${n} urutannya keliru; itu mirip goresan ke-${v.matches}.`
            : `Goresan ke-${n} bentuknya belum tepat.`
    }
  }
  return { ok, drawn: us.length, expected, strokes, summary }
}
