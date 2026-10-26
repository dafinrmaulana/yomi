# Yomi 読み

Latihan membaca hiragana & katakana bertema klan Uchiha. React + Vite + TypeScript + Tailwind v4.

```bash
npm install
npm run dev     # pengembangan
npm run build   # produksi
```

## Fitur

| Alamat | Isi |
|---|---|
| `/` | Menu utama (dojo) dengan pangkat ninja |
| `/missions` | Papan misi: 10 soal per misi, 5 nyawa, bintang 1–3 |
| `/practice` | Latihan bebas: pilih huruf sendiri, per huruf atau gabungan acak, tanpa henti |
| `/write`, `/write/<kode>` | Daftar semua huruf dengan urutan goresan langkah demi langkah, animasi, dan latihan menulis yang diperiksa di browser |
| `/review` | Ulangan harian berjarak (Leitner: 1, 3, 7, 14, 30 hari) |
| `/stats` | Pangkat, kalender latihan, peta penguasaan huruf, lencana |

Tidak ada AI maupun backend. Progres, XP, streak, kalender, dan statistik disimpan di `localStorage`.

## Data urutan goresan

`src/data/strokes.json` dibuat dari [KanjiVG](https://kanjivg.tagaini.net) (© Ulrich Apel,
[CC BY-SA 3.0](https://creativecommons.org/licenses/by-sa/3.0/)). Data ini tetap berlisensi CC BY-SA;
kode aplikasi berlisensi MIT. Membangun ulang:

```bash
node scripts/build-strokes.mjs /folder/cache/unduhan
```

## PWA & deploy

Aplikasi ini PWA (bisa dipasang dan jalan offline). Konfigurasi server ada di `deploy/`
(Caddy / Nginx) dan `deploy/deploy.sh` untuk `rsync` ke VPS. PWA butuh HTTPS.
Alamat seperti `/write` ditangani lewat fallback ke `index.html` (sudah ada di konfigurasi).

## Catatan

Proyek penggemar bertema Uchiha. Tidak berafiliasi dengan Masashi Kishimoto, Shueisha,
atau pemegang hak cipta Naruto; semua grafis dibuat sendiri dengan SVG.

## Lisensi

[MIT](LICENSE)
