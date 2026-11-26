/* ==========================================================================
   jurnal/data.js : Isi jurnal 30 hari

   Cara mengedit tanpa coding: ubah hanya tulisan di antara tanda petik "...".
   Jangan hapus tanda petik, koma, atau kurung kurawal.

   ayat      = Terjemahan Kementerian Agama RI (dari equran.id), JANGAN DIUBAH
               Tanda ... berarti hanya sebagian ayat yang ditampilkan
   sumber    = nama surat dan nomor ayat
   ========================================================================== */

/* Tanggal 1 Ramadhan 1448 H (tahun-bulan-hari). Masih perkiraan: setelah
   sidang isbat, sesuaikan tanggalnya lalu ubah TANGGAL_PASTI menjadi true. */
const AWAL_RAMADHAN = "2027-02-08";
const TANGGAL_PASTI = false;

const LEVEL = {
  1: { nama: "Reset Diri & Niat", dari: 1, sampai: 10 },
  2: { nama: "Berdiri Dalam", dari: 11, sampai: 20 },
  3: { nama: "Totalitas", dari: 21, sampai: 30 }
};

const JURNAL = {
  /* ===== LEVEL 1 — RESET DIRI & NIAT ===== */

  /* Luka Nyata (hari 1-5) */
  1: {
    tema: "Luka Nyata",
    judul: "Kenapa Aku di Sini?",
    ayat: "Wahai orang-orang yang beriman, diwajibkan atas kamu berpuasa sebagaimana diwajibkan atas orang-orang sebelum kamu agar kamu bertakwa.",
    sumber: "QS Al Baqarah: 183",
    refleksi: "Apa alasan terbesarku menyambut Ramadhan ini?",
    challenge: "Tulis niat Ramadhanmu, spesifik!"
  },
  2: {
    tema: "Luka Nyata",
    judul: "Doa yang Terlupa",
    ayat: "Apabila hamba-hamba-Ku bertanya kepadamu (Nabi Muhammad) tentang Aku, sesungguhnya Aku dekat. Aku mengabulkan permohonan orang yang berdoa apabila dia berdoa kepada-Ku. Maka, hendaklah mereka memenuhi (perintah)-Ku dan beriman kepada-Ku agar mereka selalu berada dalam kebenaran.",
    sumber: "QS Al Baqarah: 186",
    refleksi: "Doa apa yang paling sering aku remehkan?",
    challenge: "Hafalkan satu doa yang terlupakan"
  },
  3: {
    tema: "Luka Nyata",
    judul: "Ruang yang Penuh",
    ayat: "... Sesungguhnya Allah tidak mengubah keadaan suatu kaum hingga mereka mengubah apa yang ada pada diri mereka. ...",
    sumber: "QS Ar Ra'd: 11 (penggalan ayat)",
    refleksi: "Apa 'ruang' yang perlu aku bersihkan dari hidupku?",
    challenge: "Identifikasi 1 kebiasaan yang ingin direset"
  },
  4: {
    tema: "Luka Nyata",
    judul: "Apa Kabar Hubunganku?",
    ayat: "Maka, ingatlah kepada-Ku, Aku pun akan ingat kepadamu. Bersyukurlah kepada-Ku dan janganlah kamu ingkar kepada-Ku.",
    sumber: "QS Al Baqarah: 152",
    refleksi: "Bagaimana kondisi hubunganku dengan Allah sebelum Ramadhan?",
    challenge: "Tahajud + muraja'ah 1 surat"
  },
  5: {
    tema: "Luka Nyata",
    judul: "Luka yang Kubawa",
    ayat: "Maka, sesungguhnya beserta kesulitan ada kemudahan. Sesungguhnya beserta kesulitan ada kemudahan.",
    sumber: "QS Al Insyirah: 5 sampai 6",
    refleksi: "Apa 'luka nyata' yang aku rasakan sebagai muslimah hari ini?",
    challenge: "Tulis syukur 10 nikmat"
  },

  /* Allah Memperingatkan (hari 6-10) */
  6: {
    tema: "Allah Memperingatkan",
    judul: "Yang Allah Inginkan",
    ayat: "... Allah menghendaki kemudahan bagimu dan tidak menghendaki kesukaran. ...",
    sumber: "QS Al Baqarah: 185 (penggalan ayat)",
    refleksi: "Apa yang Allah inginkan dariku di Ramadhan ini?",
    challenge: "Baca Al Baqarah 1 sampai 5"
  },
  7: {
    tema: "Allah Memperingatkan",
    judul: "Tempat Pulang",
    ayat: "(Yaitu) orang-orang yang beriman dan hati mereka menjadi tenteram dengan mengingat Allah. Ingatlah, bahwa hanya dengan mengingat Allah hati akan selalu tenteram.",
    sumber: "QS Ar Ra'd: 28",
    refleksi: "Apakah aku masih menjadikan Allah tempat pulang?",
    challenge: "Doa khusus 10 menit setelah subuh"
  },
  8: {
    tema: "Allah Memperingatkan",
    judul: "Melepas Dendam",
    ayat: "(yaitu) orang-orang yang selalu berinfak, baik di waktu lapang maupun sempit, orang-orang yang mengendalikan kemurkaannya, dan orang-orang yang memaafkan (kesalahan) orang lain. Allah mencintai orang-orang yang berbuat kebaikan.",
    sumber: "QS Ali 'Imran: 134",
    refleksi: "Siapa yang perlu aku maafkan?",
    challenge: "Hubungi 1 orang yang perlu diminta maaf"
  },
  9: {
    tema: "Allah Memperingatkan",
    judul: "Kecil tapi Konsisten",
    ayat: "Siapa yang mengerjakan kebaikan seberat zarah, dia akan melihat (balasan)-nya.",
    sumber: "QS Az Zalzalah: 7",
    refleksi: "Apa hal terkecil yang bisa aku perbaiki hari ini?",
    challenge: "Perbaiki 1 kebiasaan kecil"
  },
  10: {
    tema: "Allah Memperingatkan",
    judul: "Versi Terbaikku",
    ayat: "Wahai orang-orang yang beriman, bertakwalah kepada Allah dan hendaklah setiap orang memperhatikan apa yang telah diperbuatnya untuk hari esok (akhirat). Bertakwalah kepada Allah. Sesungguhnya Allah Maha Teliti terhadap apa yang kamu kerjakan.",
    sumber: "QS Al Hasyr: 18",
    refleksi: "Seperti apa 'versi terbaikku' yang ingin kusyukuri di akhir Ramadhan?",
    challenge: "Tulis impian pasca Ramadhan"
  },

  /* ===== LEVEL 2 — BERDIRI DALAM ===== */

  /* Amanah Khalifah (hari 11-15) */
  11: {
    tema: "Amanah Khalifah",
    judul: "Aku, Khalifah",
    ayat: "(Ingatlah) ketika Tuhanmu berfirman kepada para malaikat, “Aku hendak menjadikan khalifah di bumi.” ...",
    sumber: "QS Al Baqarah: 30 (penggalan ayat)",
    refleksi: "Kalau aku diciptakan sebagai khalifah, jejak apa yang ingin aku tinggalkan di bumi?",
    challenge: "Tulis 3 peranmu hari ini dan satu amanah dari masing-masing peran"
  },
  12: {
    tema: "Amanah Khalifah",
    judul: "Niat di Balik Kuliah",
    ayat: "Tidaklah Aku menciptakan jin dan manusia kecuali untuk beribadah kepada-Ku.",
    sumber: "QS Adz Dzariyat: 56",
    refleksi: "Apakah kuliahku sudah kuniatkan sebagai ibadah, atau sekadar mengejar nilai dan gelar?",
    challenge: "Tulis ulang niat kuliahmu dalam satu kalimat, tempel di meja belajar"
  },
  13: {
    tema: "Amanah Khalifah",
    judul: "Amanah yang Tertunda",
    ayat: "Sesungguhnya Allah menyuruh kamu menyampaikan amanah kepada pemiliknya. ...",
    sumber: "QS An Nisa': 58 (penggalan ayat)",
    refleksi: "Amanah apa yang selama ini kuanggap ringan, padahal kelak akan ditanya?",
    challenge: "Selesaikan 1 amanah yang tertunda hari ini"
  },
  14: {
    tema: "Amanah Khalifah",
    judul: "Umat Terbaik",
    ayat: "Kamu (umat Islam) adalah umat terbaik yang dilahirkan untuk manusia (selama) kamu menyuruh (berbuat) yang makruf, mencegah dari yang mungkar, dan beriman kepada Allah. ...",
    sumber: "QS Ali 'Imran: 110 (penggalan ayat)",
    refleksi: "Di kampusku, kebaikan apa yang belum ada yang berani memulai?",
    challenge: "Ajak 1 teman melakukan satu kebaikan bersamamu"
  },
  15: {
    tema: "Amanah Khalifah",
    judul: "Saling Menguatkan",
    ayat: "Orang-orang mukmin, laki-laki dan perempuan, sebagian mereka menjadi penolong bagi sebagian yang lain. Mereka menyuruh (berbuat) makruf dan mencegah (berbuat) mungkar, menegakkan salat, menunaikan zakat, dan taat kepada Allah dan Rasul-Nya. Mereka akan diberi rahmat oleh Allah. Sesungguhnya Allah Maha Perkasa lagi Maha Bijaksana.",
    sumber: "QS At Taubah: 71",
    refleksi: "Siapa sahabat yang menguatkan imanku? Sudahkah aku menguatkan imannya juga?",
    challenge: "Kirim doa atau pesan penyemangat untuk 1 sahabat"
  },

  /* Muhasabah (hari 16-20) */
  16: {
    tema: "Muhasabah",
    judul: "Lupa pada Diri",
    ayat: "Janganlah kamu seperti orang-orang yang melupakan Allah sehingga Dia menjadikan mereka lupa kepada diri mereka sendiri. Mereka itulah orang-orang fasik.",
    sumber: "QS Al Hasyr: 19",
    refleksi: "Di bagian mana aku kehilangan diriku karena lupa kepada Allah?",
    challenge: "Satu jam tanpa media sosial, isi dengan dzikir"
  },
  17: {
    tema: "Muhasabah",
    judul: "Ayat yang Mengubahku",
    ayat: "(Al-Qur’an ini adalah) kitab yang Kami turunkan kepadamu (Nabi Muhammad) yang penuh berkah supaya mereka menghayati ayat-ayatnya dan orang-orang yang berakal sehat mendapat pelajaran.",
    sumber: "QS Shad: 29",
    refleksi: "Ayat mana yang terakhir kali benar-benar mengubah sikapku?",
    challenge: "Tadabbur 5 ayat dan tulis satu pelajarannya"
  },
  18: {
    tema: "Muhasabah",
    judul: "Yang Kulihat, Yang Kudengar",
    ayat: "Janganlah engkau mengikuti sesuatu yang tidak kauketahui. Sesungguhnya pendengaran, penglihatan, dan hati nurani, semua itu akan diminta pertanggungjawabannya.",
    sumber: "QS Al Isra': 36",
    refleksi: "Apa yang paling sering kulihat dan kudengar? Bagaimana itu membentuk hatiku?",
    challenge: "Bersihkan feed: berhenti mengikuti 3 akun yang menjauhkanmu dari Allah"
  },
  19: {
    tema: "Muhasabah",
    judul: "Kata dan Perbuatan",
    ayat: "Wahai orang-orang yang beriman, mengapa kamu mengatakan sesuatu yang tidak kamu kerjakan? Sangat besarlah kemurkaan di sisi Allah bahwa kamu mengatakan apa yang tidak kamu kerjakan.",
    sumber: "QS Ash Shaff: 2 sampai 3",
    refleksi: "Kebaikan apa yang sering kuucapkan, tapi belum kulakukan?",
    challenge: "Lakukan 1 hal yang selama ini hanya kamu katakan"
  },
  20: {
    tema: "Muhasabah",
    judul: "Pintu Taubat",
    ayat: "Katakanlah (Nabi Muhammad), “Wahai hamba-hamba-Ku yang melampaui batas (dengan menzalimi) dirinya sendiri, janganlah berputus asa dari rahmat Allah. Sesungguhnya Allah mengampuni dosa semuanya. Sesungguhnya Dialah Yang Maha Pengampun lagi Maha Penyayang.",
    sumber: "QS Az Zumar: 53",
    refleksi: "Kesalahan apa yang ingin kutinggalkan sebelum masuk sepuluh malam terakhir?",
    challenge: "Shalat taubat 2 rakaat, lalu tulis surat taubatmu"
  },

  /* ===== LEVEL 3 — TOTALITAS ===== */

  /* Respons Islami (hari 21-30) */
  21: {
    tema: "Respons Islami",
    judul: "Pintu Langit Terbuka",
    ayat: "Tuhanmu berfirman, “Berdoalah kepada-Ku, niscaya akan Aku perkenankan bagimu (apa yang kamu harapkan). ...",
    sumber: "QS Ghafir: 60 (penggalan ayat)",
    refleksi: "Kalau malam ini pintu langit terbuka untukku, doa apa yang pertama kali kupanjatkan?",
    challenge: "Tulis wishlist 10 doa dan bacakan di waktu sahur"
  },
  22: {
    tema: "Respons Islami",
    judul: "Malam & Air Mata",
    ayat: "Mereka menyungkurkan wajah seraya menangis dan ia (Al-Qur’an) menambah kekhusyukan mereka.",
    sumber: "QS Al Isra': 109",
    refleksi: "Kapan terakhir kali aku menangis karena Allah?",
    challenge: "Qiyamul lail dan istighfar 100 kali"
  },
  23: {
    tema: "Respons Islami",
    judul: "Aku & Akhirat",
    ayat: "Setiap yang bernyawa akan merasakan mati. Hanya pada hari Kiamat sajalah diberikan dengan sempurna balasanmu. Siapa yang dijauhkan dari neraka dan dimasukkan ke dalam surga, sungguh dia memperoleh kemenangan. Kehidupan dunia hanyalah kesenangan yang memperdaya.",
    sumber: "QS Ali 'Imran: 185",
    refleksi: "Kalau besok aku meninggal, apakah aku siap?",
    challenge: "Tulis 3 bekal akhirat yang ingin kamu siapkan mulai hari ini"
  },
  24: {
    tema: "Respons Islami",
    judul: "Bangun di Sepi Malam",
    ayat: "bangunlah (untuk salat) pada malam hari, kecuali sebagian kecil, (yaitu) seperduanya, kurang sedikit dari itu, atau lebih dari (seperdua) itu. Bacalah Al-Qur’an itu dengan perlahan-lahan.",
    sumber: "QS Al Muzzammil: 2 sampai 4",
    refleksi: "Apa yang paling berat kulepaskan agar bisa bangun untuk Allah?",
    challenge: "Tidur lebih awal, bangun satu jam sebelum sahur"
  },
  25: {
    tema: "Respons Islami",
    judul: "Malam Seribu Bulan",
    ayat: "Sesungguhnya Kami telah menurunkannya (Al-Qur’an) pada Lailatulqadar. Tahukah kamu apakah Lailatulqadar itu? Lailatulqadar itu lebih baik daripada seribu bulan.",
    sumber: "QS Al Qadr: 1 sampai 3",
    refleksi: "Kalau satu malam bisa bernilai seumur hidup, bagaimana aku ingin mengisinya?",
    challenge: "Susun jadwal ibadahmu dari Isya sampai Subuh"
  },
  26: {
    tema: "Respons Islami",
    judul: "Maaf yang Kucari",
    ayat: "Siapa yang berbuat kejahatan atau menganiaya dirinya, kemudian memohon ampunan kepada Allah, niscaya akan mendapati Allah Maha Pengampun lagi Maha Penyayang.",
    sumber: "QS An Nisa': 110",
    refleksi: "Maaf apa yang paling kubutuhkan dari Allah?",
    challenge: "Hafalkan doa Lailatul Qadr dan ulangi sepanjang malam"
  },
  27: {
    tema: "Respons Islami",
    judul: "Damai sampai Fajar",
    ayat: "Pada malam itu turun para malaikat dan Rūḥ (Jibril) dengan izin Tuhannya untuk mengatur semua urusan. Sejahteralah (malam) itu sampai terbit fajar.",
    sumber: "QS Al Qadr: 4 sampai 5",
    refleksi: "Apa yang membuat hatiku benar-benar damai, dan apa yang selalu mengusiknya?",
    challenge: "Matikan notifikasi semalam, hadir penuh bersama Allah"
  },
  28: {
    tema: "Respons Islami",
    judul: "Semampuku, Setulusku",
    ayat: "... Kebaikan apa saja yang kamu perbuat untuk dirimu niscaya kamu memperoleh (balasan)-nya di sisi Allah sebagai balasan yang paling baik dan yang paling besar pahalanya. ...",
    sumber: "QS Al Muzzammil: 20 (penggalan ayat)",
    refleksi: "Ibadah apa yang kulakukan tulus, tanpa ingin dilihat siapa pun?",
    challenge: "Satu sedekah rahasia hari ini"
  },
  29: {
    tema: "Respons Islami",
    judul: "Sampai Garis Akhir",
    ayat: "dan sembahlah Tuhanmu sampai datang kepadamu kepastian (kematian).",
    sumber: "QS Al Hijr: 99",
    refleksi: "Ibadah apa yang ingin tetap kujaga, bahkan saat Ramadhan sudah pergi?",
    challenge: "Pilih 1 amalan harian dan tulis rencana menjaganya"
  },
  30: {
    tema: "Respons Islami",
    judul: "Ramadhan Terakhir?",
    ayat: "Sesungguhnya orang-orang yang berkata, “Tuhan kami adalah Allah,” kemudian tetap (dalam pendiriannya), akan turun malaikat-malaikat kepada mereka (seraya berkata), “Janganlah kamu takut dan bersedih hati serta bergembiralah dengan (memperoleh) surga yang telah dijanjikan kepadamu.”",
    sumber: "QS Fushshilat: 30",
    refleksi: "Kalau ini Ramadhan terakhirku, apa yang paling ingin kubawa pulang kepada Allah?",
    challenge: "Tulis janjimu pasca Ramadhan: 3 amalan yang akan terus hidup"
  }
};

/* ---------- Fungsi bantu (tidak perlu diubah) ---------- */

function levelHari(hari) {
  return Math.ceil(hari / 10); // hari 1-10 = 1, 11-20 = 2, 21-30 = 3
}

/* Contoh hasil: "Senin, 8 Februari 2027 (perkiraan)" */
function tanggalHari(hari) {
  const b = AWAL_RAMADHAN.split("-").map(Number);
  const tanggal = new Date(b[0], b[1] - 1, b[2] + hari - 1);
  const teks = tanggal.toLocaleDateString("id-ID", {
    weekday: "long", day: "numeric", month: "long", year: "numeric"
  });
  return teks + (TANGGAL_PASTI ? "" : " (perkiraan)");
}
