# Yomi 読み

Latihan membaca hiragana & katakana bertema klan Uchiha. React + Vite + TypeScript + Tailwind v4.

```bash
npm install
npm run dev     # pengembangan
npm run build   # produksi
```

- **Jalur Latihan**: node per grup huruf, 10 soal, 5 nyawa, bintang 1–3.
- **Latihan Bebas**: pilih huruf sendiri, mode per huruf atau gabungan acak, soal tanpa henti.
- Progres, XP, streak, dan statistik per huruf disimpan di `localStorage`.

## PWA & deploy

Aplikasi ini PWA (bisa dipasang dan jalan offline). Konfigurasi server ada di `deploy/`
(Caddy / Nginx) dan `deploy/deploy.sh` untuk `rsync` ke VPS. PWA butuh HTTPS.

## Catatan

Proyek penggemar bertema Uchiha. Tidak berafiliasi dengan Masashi Kishimoto, Shueisha,
atau pemegang hak cipta Naruto; semua grafis dibuat sendiri dengan SVG.

## Lisensi

[MIT](LICENSE)
