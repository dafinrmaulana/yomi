/**
 * Bank dialog untuk mode Dialog di Latihan Bebas. Tiap baris: [pembicara, kalimat, arti].
 * Kalimat ditulis dengan spasi antar-kata; tanda baca (。、？！) hanya hiasan dan tidak dijawab.
 * Partikel yang dibaca lain diberi "~" di depannya: わたし~は = "watashi wa", ~を = "o", ~へ = "e".
 * Hanya huruf yang dikenal aplikasi (っ/ッ dan ー termasuk); dialog baru hanya keluar bila semua hurufnya dipilih.
 */
export type RawLine = [speaker: string, text: string, meaning: string]

export interface RawDialog {
  id: string
  title: string
  lines: RawLine[]
}

export const RAW_DIALOGS: RawDialog[] = [
  {
    id: 'pagi',
    title: 'Selamat pagi',
    lines: [
      ['A', 'おはよう。', 'Selamat pagi.'],
      ['B', 'おはよう ございます。', 'Selamat pagi (sopan).'],
    ],
  },
  {
    id: 'terima-kasih',
    title: 'Terima kasih',
    lines: [
      ['A', 'どうぞ。', 'Silakan.'],
      ['B', 'ありがとう。', 'Terima kasih.'],
      ['A', 'どういたしまして。', 'Sama-sama.'],
    ],
  },
  {
    id: 'pamit',
    title: 'Berpisah',
    lines: [
      ['A', 'さようなら。', 'Selamat tinggal.'],
      ['B', 'また あした。', 'Sampai besok.'],
    ],
  },
  {
    id: 'maaf',
    title: 'Minta maaf',
    lines: [
      ['A', 'ごめんなさい。', 'Maaf.'],
      ['B', 'だいじょうぶ です。', 'Tidak apa-apa.'],
    ],
  },
  {
    id: 'siang',
    title: 'Selamat siang',
    lines: [
      ['A', 'こんにち~は。', 'Selamat siang.'],
      ['B', 'こんにち~は。 おげんき ですか。', 'Selamat siang. Apa kabar?'],
      ['A', 'はい、げんき です。', 'Ya, saya baik.'],
    ],
  },
  {
    id: 'kenalan',
    title: 'Berkenalan',
    lines: [
      ['A', 'はじめまして。', 'Salam kenal.'],
      ['B', 'わたし~は さくら です。', 'Saya Sakura.'],
      ['A', 'よろしく おねがいします。', 'Mohon bantuannya.'],
    ],
  },
  {
    id: 'nama',
    title: 'Menanyakan nama',
    lines: [
      ['A', 'おなまえ~は なん ですか。', 'Siapa namamu?'],
      ['B', 'たなか です。', 'Tanaka.'],
    ],
  },
  {
    id: 'ini-apa',
    title: 'Ini apa?',
    lines: [
      ['A', 'これ~は なん ですか。', 'Ini apa?'],
      ['B', 'それ~は ほん です。', 'Itu buku.'],
    ],
  },
  {
    id: 'hewan',
    title: 'Hewan imut',
    lines: [
      ['A', 'あれ~は なん ですか。', 'Itu apa?'],
      ['B', 'あれ~は うさぎ です。', 'Itu kelinci.'],
      ['A', 'かわいい ですね。', 'Imut ya.'],
    ],
  },
  {
    id: 'harga',
    title: 'Menanyakan harga',
    lines: [
      ['A', 'これ~は いくら ですか。', 'Ini berapa?'],
      ['B', 'ひゃくえん です。', 'Seratus yen.'],
    ],
  },
  {
    id: 'stasiun',
    title: 'Tanya jalan',
    lines: [
      ['A', 'えき~は どこ ですか。', 'Stasiun di mana?'],
      ['B', 'あそこ です。', 'Di sana.'],
      ['A', 'ありがとう ございます。', 'Terima kasih banyak.'],
    ],
  },
  {
    id: 'jam',
    title: 'Jam berapa',
    lines: [
      ['A', 'いま なんじ ですか。', 'Sekarang jam berapa?'],
      ['B', 'さんじ です。', 'Jam tiga.'],
    ],
  },
  {
    id: 'keluarga',
    title: 'Keluarga',
    lines: [
      ['A', 'かぞく~は なんにん ですか。', 'Keluargamu berapa orang?'],
      ['B', 'よにん です。', 'Empat orang.'],
    ],
  },
  {
    id: 'kucing',
    title: 'Suka kucing',
    lines: [
      ['A', 'ねこ~が すき ですか。', 'Kamu suka kucing?'],
      ['B', 'はい、すき です。', 'Ya, suka.'],
      ['A', 'いぬ~も すき です。', 'Anjing juga suka.'],
    ],
  },
  {
    id: 'cuaca',
    title: 'Cuaca panas',
    lines: [
      ['A', 'きょう~は あつい ですね。', 'Hari ini panas ya.'],
      ['B', 'ええ、そう ですね。', 'Iya, benar.'],
    ],
  },
  {
    id: 'besok',
    title: 'Cuaca besok',
    lines: [
      ['A', 'あした~は あめ ですか。', 'Besok hujan?'],
      ['B', 'いいえ、はれ です。', 'Bukan, cerah.'],
    ],
  },
  {
    id: 'minum',
    title: 'Minta teh',
    lines: [
      ['A', 'のみもの~は なに~が いい ですか。', 'Mau minum apa?'],
      ['B', 'おちゃ~を ください。', 'Tolong teh.'],
      ['A', 'はい、どうぞ。', 'Ya, silakan.'],
    ],
  },
  {
    id: 'lapar',
    title: 'Lapar',
    lines: [
      ['A', 'おなか~が すきました。', 'Aku lapar.'],
      ['B', 'すし~を たべましょう。', 'Ayo makan sushi.'],
    ],
  },
  {
    id: 'sarapan',
    title: 'Sarapan',
    lines: [
      ['A', 'あさごはん~を たべます。', 'Aku makan sarapan.'],
      ['B', 'なに~を たべますか。', 'Makan apa?'],
      ['A', 'ごはん~と みそしる です。', 'Nasi dan sup miso.'],
    ],
  },
  {
    id: 'sekolah',
    title: 'Ke sekolah',
    lines: [
      ['A', 'がっこう~へ いきます。', 'Aku pergi ke sekolah.'],
      ['B', 'いっしょ~に いきましょう。', 'Ayo pergi bersama.'],
    ],
  },
  {
    id: 'taman',
    title: 'Ke taman',
    lines: [
      ['A', 'ともだち~と こうえん~へ いきます。', 'Aku ke taman dengan teman.'],
      ['B', 'いい ですね。', 'Bagus ya.'],
    ],
  },
  {
    id: 'hobi',
    title: 'Hobi',
    lines: [
      ['A', 'しゅみ~は なん ですか。', 'Hobimu apa?'],
      ['B', 'えいが~を みる こと です。', 'Menonton film.'],
    ],
  },
  {
    id: 'bahasa',
    title: 'Bahasa Jepang',
    lines: [
      ['A', 'にほんご~が じょうず ですね。', 'Bahasa Jepangmu bagus.'],
      ['B', 'いいえ、まだ まだ です。', 'Tidak, masih jauh.'],
    ],
  },
  {
    id: 'sakit',
    title: 'Sakit kepala',
    lines: [
      ['A', 'あたま~が いたい です。', 'Kepalaku sakit.'],
      ['B', 'だいじょうぶ ですか。', 'Kamu baik-baik saja?'],
      ['B', 'くすり~を のみましょう。', 'Ayo minum obat.'],
    ],
  },
  {
    id: 'ulang-tahun',
    title: 'Ulang tahun',
    lines: [
      ['A', 'たんじょうび おめでとう。', 'Selamat ulang tahun.'],
      ['B', 'ありがとう。 うれしい です。', 'Terima kasih. Aku senang.'],
    ],
  },
  {
    id: 'tidur',
    title: 'Selamat tidur',
    lines: [
      ['A', 'もう ねます。', 'Aku tidur dulu.'],
      ['B', 'おやすみ なさい。', 'Selamat tidur.'],
    ],
  },
  {
    id: 'toko',
    title: 'Di toko',
    lines: [
      ['A', 'いらっしゃいませ。', 'Selamat datang.'],
      ['B', 'みず~を ください。', 'Tolong air.'],
    ],
  },
  {
    id: 'kopi',
    title: 'Pesan kopi',
    lines: [
      ['A', 'コーヒー~を ください。', 'Tolong kopi.'],
      ['B', 'ミルク~は いりますか。', 'Perlu susu?'],
      ['A', 'いいえ、けっこう です。', 'Tidak, tidak usah.'],
    ],
  },
  {
    id: 'kue',
    title: 'Makan kue',
    lines: [
      ['A', 'ケーキ~を たべます。', 'Aku makan kue.'],
      ['B', 'おいしい ですか。', 'Enak?'],
      ['A', 'はい、とても おいしい です。', 'Ya, enak sekali.'],
    ],
  },
]
