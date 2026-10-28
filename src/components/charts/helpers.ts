/** warna teks sekunder di dalam grafik */
export const TEXT_2 = 'text-[#b9a782]'

/** tanggal pendek untuk label sumbu, mis. "28 Okt" */
export const fmtShort = (key: string) =>
  new Date(key + 'T00:00').toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })

/** tick sumbu-y yang bulat: 0, 5, 10 ... */
export function niceMax(v: number) {
  if (v <= 5) return 5
  const step = 10 ** Math.floor(Math.log10(v))
  return Math.ceil(v / step) * step
}
