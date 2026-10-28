/** pemilik Mangekyō; berganti tiap permainan */
export type Mangekyo = 'itachi' | 'shisui' | 'obito' | 'sasuke'
export const MANGEKYO: Mangekyo[] = ['itachi', 'shisui', 'obito', 'sasuke']

let lastMangekyo: Mangekyo | undefined
/** pilih Mangekyō acak untuk permainan baru, selalu berbeda dari permainan sebelumnya */
export function pickMangekyo(): Mangekyo {
  const pool = MANGEKYO.filter((m) => m !== lastMangekyo)
  lastMangekyo = pool[Math.floor(Math.random() * pool.length)]
  return lastMangekyo
}

/** tingkat mata menurut combo: 0–2 → 1 tomoe, 3–5 → 2, 6–9 → 3, 10+ → 4 (Mangekyō) */
export const sharinganLevel = (combo: number) => (combo >= 10 ? 4 : combo >= 6 ? 3 : combo >= 3 ? 2 : 1)
