/**
 * Daftar kata untuk rangkaian "kata nyata": "tulisan:arti". Hanya memakai huruf yang ada di aplikasi
 * (tanpa っ kecil dan tanda panjang ー); kata yang tidak bisa diurai otomatis dilewati.
 */
const HIRAGANA = `
あう:bertemu あく:terbuka あせ:keringat あな:lubang あみ:jaring いか:cumi いけ:kolam いど:sumur いろ:warna
いし:batu いと:benang うお:ikan うそ:bohong えだ:ranting えん:yen おび:obi おに:iblis おの:kapak おや:orang tua
おと:bunyi かい:kerang かご:keranjang かみ:kertas かた:bahu かど:sudut からだ:tubuh きく:mendengar きし:tepi pantai
きず:luka きぬ:sutra くさ:rumput くび:leher くすり:obat くろ:hitam けむり:asap こけ:lumut こし:pinggang こま:gasing
こころ:hati ことば:kata さお:tongkat さい:badak さら:piring さん:tiga しあい:pertandingan すな:pasir すいか:semangka
すき:suka せき:kursi たい:ikan kakap たね:biji たび:perjalanan たけ:bambu たて:perisai たいこ:drum taiko ちかい:dekat
ちえ:kebijaksanaan つえ:tongkat つる:bangau つち:tanah つゆ:musim hujan てがみ:surat てぶくろ:sarung tangan
とびら:pintu とら:harimau とも:teman なす:terong なみ:ombak なか:dalam ななつ:tujuh にじ:pelangi にもつ:barang bawaan
ぬま:rawa ねつ:demam のど:tenggorokan はこ:kotak はか:makam はは:ibu(ku) はね:sayap はた:bendera はと:merpati
はみがき:pasta gigi ひげ:kumis ひも:tali ひたい:dahi ふく:pakaian へび:ular へそ:pusar ほね:tulang ほお:pipi
まつ:pohon pinus まゆ:alis まる:lingkaran まいにち:setiap hari みせ:toko みぎ:kanan みやげ:oleh-oleh むね:dada
むかし:dahulu めし:nasi もち:mochi もの:benda もん:gerbang もみじ:daun maple ひだり:kiri あたらしい:baru
おもしろい:menarik ありがとう:terima kasih さようなら:selamat tinggal おはよう:selamat pagi こんにちは:selamat siang
あかい:merah あおい:biru くろい:hitam しろい:putih おおきい:besar ちいさい:kecil たかい:tinggi やすい:murah
あつい:panas さむい:dingin おいしい:enak うれしい:senang かわいい:imut たのしい:menyenangkan
いくら:berapa いつ:kapan どこ:di mana だれ:siapa そと:luar なか:dalam うち:rumah ちかく:dekat とおい:jauh
あい:cinta いえ:rumah うえ:atas あお:biru いい:bagus えき:stasiun おか:bukit かお:wajah かき:kesemek
かぎ:kunci かさ:payung かめ:kura-kura くち:mulut くつ:sepatu くも:awan くま:beruang くるま:mobil
けさ:pagi ini こえ:suara こい:ikan koi ここ:sini さけ:sake さる:monyet しお:garam しか:rusa しま:pulau
すし:sushi すみ:tinta せみ:tonggeret そら:langit たこ:gurita たな:rak たに:lembah つき:bulan
つくえ:meja てら:kuil とり:burung とけい:jam なつ:musim panas なに:apa にく:daging にわ:halaman
ぬの:kain ねこ:kucing ねぎ:daun bawang のり:rumput laut はし:sumpit はな:bunga はる:musim semi
ひと:orang ひる:siang ふね:kapal ふゆ:musim dingin へや:kamar ほし:bintang ほん:buku まど:jendela
まめ:kacang みず:air みち:jalan みみ:telinga むし:serangga めがね:kacamata もり:hutan やま:gunung
やさい:sayur ゆき:salju ゆめ:mimpi よる:malam らいおん:singa りんご:apel ろうそく:lilin
わたし:saya わに:buaya いぬ:anjing いす:kursi いち:satu うた:lagu うみ:laut うし:sapi うま:kuda
うで:lengan えび:udang えほん:buku bergambar おちゃ:teh おかし:camilan おとこ:laki-laki
おんな:perempuan おとうと:adik laki-laki おかあさん:ibu おとうさん:ayah おねえさん:kakak perempuan
おにいさん:kakak laki-laki あたま:kepala あし:kaki あさ:pagi あめ:hujan あり:semut あか:merah
あき:musim gugur あに:kakak laki-laki(ku) あね:kakak perempuan(ku) かぜ:angin かわ:sungai
かばん:tas かたな:katana からす:gagak きのこ:jamur きもの:kimono きつね:rubah きた:utara
こども:anak ことり:burung kecil こめ:beras ごはん:nasi さかな:ikan さくら:sakura さとう:gula
しろ:putih せんせい:guru せかい:dunia たまご:telur たいよう:matahari ちず:peta つめ:kuku
つなみ:tsunami でんしゃ:kereta どうぶつ:hewan なまえ:nama にほん:Jepang ねずみ:tikus
のみもの:minuman はれ:cerah ばら:mawar ひこうき:pesawat ひかり:cahaya ぶた:babi ぼうし:topi
ほたる:kunang-kunang まくら:bantal まち:kota みかん:jeruk mandarin みどり:hijau みそ:miso
もも:persik やきとり:sate ayam ゆうびん:pos ふうせん:balon はたけ:ladang ひまわり:bunga matahari
きょう:hari ini しゃしん:foto じてんしゃ:sepeda ちゃいろ:cokelat りょこう:perjalanan
りょうり:masakan びょういん:rumah sakit しゅくだい:PR ひゃく:seratus にんぎょう:boneka
きゅうり:timun ぎゅうにく:daging sapi ぎゅうにゅう:susu sapi じょうず:pandai
ちょうちょう:kupu-kupu きょうと:Kyoto たんじょうび:ulang tahun びょうき:sakit べんきょう:belajar
だいがく:universitas でんわ:telepon でぐち:pintu keluar ぶどう:anggur ぱんだ:panda
ぺんぎん:pinguin かぞく:keluarga ともだち:teman こうえん:taman じかん:waktu ぎんこう:bank
でんき:listrik ぬいぐるみ:boneka kain さんぽ:jalan-jalan しんぶん:koran たべもの:makanan
くだもの:buah ぞう:gajah へび:ular うさぎ:kelinci さかな:ikan ひよこ:anak ayam くじら:paus
かもめ:camar いるか:lumba-lumba とんぼ:capung かえる:katak たぬき:tanuki あひる:bebek
にじ:pelangi かみなり:petir あらし:badai ゆうひ:matahari terbenam つゆ:musim hujan
ぎん:perak じごく:neraka だいじ:penting びじん:wanita cantik ぶんぽう:tata bahasa ぷりん:puding
ぺこぺこ:lapar sekali ぽかぽか:hangat nyaman おばあさん:nenek おじいさん:kakek おおさか:Osaka
こうこう:SMA きゃく:tamu しゃちょう:direktur しゅみ:hobi しゅじん:suami ちゅうい:perhatian
にゅうがく:masuk sekolah みゃく:denyut nadi りゅう:naga じゅぎょう:pelajaran
`

const KATAKANA = `
ピアノ:piano テレビ:televisi ナイフ:pisau カメラ:kamera バナナ:pisang トマト:tomat ホテル:hotel
ラジオ:radio ペン:pen ドア:pintu テニス:tenis ゴルフ:golf バス:bus ミルク:susu アイス:es krim
サラダ:salad メロン:melon レモン:lemon ワイン:anggur ピザ:pizza パン:roti ココア:kakao
スマホ:ponsel pintar アニメ:anime
`

export interface WordEntry {
  text: string
  meaning: string
}

function parse(raw: string): WordEntry[] {
  return raw
    .split(/\s+(?=\S+:)/)
    .map((x) => x.trim())
    .filter(Boolean)
    .map((x) => {
      const i = x.indexOf(':')
      return { text: x.slice(0, i), meaning: x.slice(i + 1) }
    })
}

export const WORDS_HIRAGANA = parse(HIRAGANA)
export const WORDS_KATAKANA = parse(KATAKANA)
