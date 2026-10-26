import { useEffect, useState } from 'react'

/** s = path tiap goresan (urut), n = posisi nomor goresan; kotak 109×109 milik KanjiVG */
export interface StrokeData {
  s: string[]
  n: [number, number][]
}

let cache: Promise<Record<string, StrokeData>> | null = null

// dimuat terpisah supaya bundel utama tetap kecil
export const loadStrokes = () => (cache ??= import('../data/strokes.json').then((m) => m.default as unknown as Record<string, StrokeData>))

export function useStrokes() {
  const [data, setData] = useState<Record<string, StrokeData> | null>(null)
  useEffect(() => {
    let live = true
    void loadStrokes().then((d) => live && setData(d))
    return () => {
      live = false
    }
  }, [])
  return data
}
