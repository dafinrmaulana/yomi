import { useEffect, useState } from 'react'

/** s = path tiap goresan (urut), n = posisi nomor goresan; kotak 109×109 milik KanjiVG */
export interface StrokeData {
  s: string[]
  n: [number, number][]
}

let cache: Promise<Record<string, StrokeData>> | null = null

// dimuat terpisah supaya bundel utama tetap kecil
export const loadStrokes = () => (cache ??= import('../data/strokes.json').then((m) => m.default as unknown as Record<string, StrokeData>))

/** enabled=false: jangan muat data goresan (mis. kuis arah baca) */
export function useStrokes(enabled = true) {
  const [data, setData] = useState<Record<string, StrokeData> | null>(null)
  useEffect(() => {
    if (!enabled) return
    let live = true
    void loadStrokes().then((d) => live && setData(d))
    return () => {
      live = false
    }
  }, [enabled])
  return data
}
