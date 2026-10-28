/** ukuran huruf soal arah baca menurut panjang rangkaian (makin panjang makin kecil agar tetap muat) */
export function promptSize(n: number, compact: boolean): string {
  // ukuran dasar untuk layar kecil (enam huruf per baris harus muat di ~320px), lalu lebih besar di sm ke atas
  if (compact) return n > 6 ? 'text-3xl' : n > 3 ? 'text-4xl' : n > 1 ? 'text-5xl' : 'text-7xl'
  if (n > 12) return 'text-3xl sm:text-4xl'
  if (n > 6) return 'text-4xl sm:text-5xl'
  if (n > 4) return 'text-4xl sm:text-7xl'
  if (n > 3) return 'text-5xl sm:text-7xl'
  if (n > 1) return 'text-6xl sm:text-8xl'
  return 'text-8xl sm:text-9xl'
}
