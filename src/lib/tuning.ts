/*
 * Angka-angka yang bisa disetel untuk mengatur rasa latihan. Semuanya dikumpulkan di sini supaya mudah dicari
 * dan diubah tanpa membuka logika.
 */

/* ---------- kecepatan ---------- */

/** batas "cukup cepat" per huruf (ms): arah baca */
export const SLOW_MS_READ = 2500
/** batas "cukup cepat" per huruf (ms): arah tulis (menyusun/mengetik huruf Jepang butuh waktu lebih lama) */
export const SLOW_MS_WRITE = 4000
/** berapa jawaban benar terakhir per huruf yang dipakai menilai "lambat" */
export const SPEED_WINDOW = 3
/** jumlah sesi per huruf yang disimpan di riwayat */
export const HISTORY_LIMIT = 30

/* ---------- soal ---------- */

/** porsi soal gabungan yang disusun dari kata nyata (sisanya huruf acak penuh) */
export const WORD_SHARE = 0.85
/** rangkaian yang salah/lambat diulang paling banyak sekian kali */
export const MAX_RETRIES = 2
/** rangkaian yang sudah keluar diingat sebanyak ini per sesi sebelum diulang dari kosong */
export const SEEN_LIMIT = 500

/* ---------- saran naik level ---------- */

/** panjang rangkaian gabungan maksimal yang disarankan */
export const MAX_LENGTH = 20
/** jumlah huruf terlemah yang diuji */
export const SAMPLE = 8
/** minimal jawaban benar-cepat per huruf sampel di masa tes */
export const FAST_NEEDED = 2
/** salah yang masih ditoleransi dalam satu masa tes; salah lagi mengulang tes dari awal */
export const TEST_MISSES = 1
/** saran naik level hanya muncul bila jawaban benar beruntun sebanyak ini, sejak pengaturan terakhir berubah */
export const STREAK_FOR_UP = 10
/** tanpa sesi berjalan (Meja Latihan): akurasi minimal per huruf dari riwayat */
export const MIN_ACC = 0.9
/** tanpa sesi berjalan (Meja Latihan): minimal jawaban per huruf dari riwayat */
export const MIN_ATTEMPTS = 3
/** tes dianggap "hampir" (mata jadi Rinnegan) bila kemajuannya sudah sejauh ini (0–1) */
export const NEAR_UP = 0.7
/** tiap kelipatan ini, sesi diajak selesai atau istirahat */
export const MILESTONE = 50

/* ---------- tampilan ---------- */

/** huruf terlambat yang tampil sebelum "Tampilkan semua" */
export const SPEED_PREVIEW = 3
/** kelompok huruf yang tampil sebelum "Tampilkan semua" */
export const GROUP_PREVIEW = 4
