/* ==========================================================================
   rekap.js : menyusun rekap lengkap SEMUA isi jurnal untuk disimpan sebagai PDF
   Dipakai penutup.html. Urutan lembar:
     sampul profil, tentang aku, ringkasan dan mood, tracker amalan,
     tilawah dan sedekah, 30 hari jurnal, semua rencana proyek kebaikan,
     catatan bebas dari buku di kamar 3D (kalau ada).
   ========================================================================== */

function tanggalIndonesia(nilai) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nilai)) return nilai;
  const t = nilai.split("-").map(Number);
  return new Date(t[0], t[1] - 1, t[2]).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" });
}

// Daftar judul dan isi; baris yang kosong dilewati
function tulisDaftar(induk, baris) {
  const daftar = tambahElemen(induk, "dl", "rekap-data");
  baris.forEach(function (b) {
    if (!b[1]) return;
    tambahElemen(daftar, "dt", "", b[0]);
    tambahElemen(daftar, "dd", "", b[1]);
  });
  return daftar;
}

const NAMA_PROYEK = {
  social: "Social Experiment Kampus",
  kreativitas: "Lomba Kreativitas",
  event: "Mini Event Dakwah",
  sendiri: "Proyekku Sendiri"
};

function namaProyekPilihan(proyek) {
  if (!Object.hasOwn(NAMA_PROYEK, proyek.pilihan)) return "";
  if (proyek.pilihan === "sendiri") return hanyaTulisan(proyek.namaSendiri) || NAMA_PROYEK.sendiri;
  return NAMA_PROYEK[proyek.pilihan];
}

function hitungMood() {
  const mood = { senang: 0, biasa: 0, sedih: 0 };
  for (let hari = 1; hari <= JUMLAH_HARI; hari++) {
    const m = loadJournal(hari).mood;
    if (Object.hasOwn(mood, m)) mood[m]++;
  }
  return mood;
}

function angkaRekap() {
  const t = ringkasTracker();
  return [
    [jumlahHariTerisi() + " / " + JUMLAH_HARI, "hari jurnal terisi"],
    [t.amalan, "amalan tercentang"],
    [t.halaman, "halaman tilawah"],
    [t.khatam, "kali khatam"],
    [t.sedekah, "hari sedekah"]
  ];
}

function tulisAngka(daftar) {
  angkaRekap().forEach(function (a) {
    const li = tambahElemen(daftar, "li");
    tambahElemen(li, "strong", "", a[0]);
    li.append(a[1]);
  });
}

/* --- Lembar 1: sampul --- */
function rekapSampul(induk, profil) {
  const lembar = buatLembar(induk, "Rekap Jurnal Ramadhan 1448 H", "Space to Breathe, KARIMAH 2027");
  lembar.classList.add("sampul");

  if (typeof profil.foto === "string" && profil.foto.startsWith("data:image/")) {
    const foto = tambahElemen(lembar, "img", "rekap-foto");
    foto.src = profil.foto;
    foto.alt = "";
  }
  tambahElemen(lembar, "p", "rekap-nama", hanyaTulisan(profil.nama) || hanyaTulisan(profil.panggilan) || "Muslimah FMDKI");

  const p = function (k) { return hanyaTulisan(profil[k]); };
  const lahir = [p("tempatLahir"), tanggalIndonesia(p("tanggalLahir"))].filter(Boolean).join(", ");
  tulisDaftar(lembar, [
    ["Panggilan", p("panggilan")], ["Tempat, tgl lahir", lahir], ["Hobby", p("hobby")],
    ["Kampus", p("kampus")], ["Jurusan", p("jurusan")], ["Angkatan", p("angkatan")], ["Asal daerah", p("asalDaerah")]
  ]);
}

/* --- Lembar 1b: tentang aku (isian panjang dan medsos dari halaman profil) --- */
function rekapTentangAku(induk, profil) {
  const p = function (k) { return hanyaTulisan(profil[k]); };
  const lembar = buatLembar(induk, "Tentang Aku");
  [["Ayat / Hadits favoritku", "ayat"], ["Motto hidupku", "motto"], ["Harapanku untuk kampus dan daerahku", "harapan"]].forEach(function (b) {
    tambahElemen(lembar, "h3", "", b[0]);
    const kotak = tambahElemen(lembar, "div", "kotak-jawab pendek", p(b[1]));
    if (b[1] === "ayat") kotak.dir = "auto"; // bisa berisi tulisan Arab
  });
  tambahElemen(lembar, "h3", "", "Medsosku");
  tulisDaftar(lembar, [["Instagram", p("instagram")], ["TikTok", p("tiktok")], ["Lainnya", p("medsosLain")]]);
}

/* --- Lembar 2: angka dan mood --- */
function rekapRingkasan(induk) {
  const lembar = buatLembar(induk, "Ringkasan Perjalananku");
  tulisAngka(tambahElemen(lembar, "ul", "angka"));

  tambahElemen(lembar, "h3", "", "Mood 30 hari");
  const grid = tambahElemen(lembar, "ol", "rekap-mood");
  for (let hari = 1; hari <= JUMLAH_HARI; hari++) {
    const m = loadJournal(hari).mood;
    const ada = Object.hasOwn(NAMA_MOOD, m);
    const li = tambahElemen(grid, "li", ada ? "mood-" + m : "");
    tambahElemen(li, "small", "", hari);
    tambahElemen(li, "span", "", ada ? Array.from(NAMA_MOOD[m])[0] : "·");
  }

  const mood = hitungMood();
  const total = mood.senang + mood.biasa + mood.sedih;
  Object.keys(NAMA_MOOD).forEach(function (m) {
    const baris = tambahElemen(lembar, "div", "rekap-batang");
    tambahElemen(baris, "span", "", NAMA_MOOD[m]);
    const jalur = tambahElemen(baris, "span", "jalur");
    tambahElemen(jalur, "i", "mood-" + m).style.width = (total ? (mood[m] / total) * 100 : 0) + "%";
    tambahElemen(baris, "b", "", mood[m] + " hari");
  });
}

/* --- Lembar 3 dan 4: tracker --- */
function rekapTracker(induk) {
  const data = loadTracker();
  const bagian = function (nama) {
    const isi = data[nama];
    return isi && typeof isi === "object" ? isi : {};
  };
  const shalat = bagian("shalat"), tilawah = bagian("tilawah"), khatam = bagian("khatam"), sedekah = bagian("sedekah");

  const satu = buatLembar(induk, "Amalan Harianku");
  const tabel = tambahElemen(satu, "table", "rekap-tabel");
  const kepala = tambahElemen(tambahElemen(tabel, "thead"), "tr");
  tambahElemen(kepala, "th", "", "Amalan / Hari");
  for (let hari = 1; hari <= JUMLAH_HARI; hari++) tambahElemen(kepala, "th", "", hari);
  const badan = tambahElemen(tabel, "tbody");
  AMALAN_TRACKER.forEach(function (a) {
    const baris = tambahElemen(badan, "tr");
    tambahElemen(baris, "th", a.jenis || "", a.nama);
    for (let hari = 1; hari <= JUMLAH_HARI; hari++) {
      const ya = shalat[hari + "-" + a.kunci] === true;
      tambahElemen(baris, "td", ya ? "ya" : "", ya ? "✓" : "");
    }
  });

  const dua = buatLembar(induk, "Tilawah dan Sedekahku");
  const t = ringkasTracker();
  tambahElemen(dua, "h3", "", "Tilawah: " + t.halaman + " halaman, khatam " + t.khatam + " kali");
  const kotak = tambahElemen(dua, "ol", "rekap-tilawah");
  for (let hari = 1; hari <= JUMLAH_HARI; hari++) {
    const n = tilawah[hari];
    const li = tambahElemen(kotak, "li", khatam[hari] === true ? "khatam" : "");
    tambahElemen(li, "small", "", "Hari " + hari);
    tambahElemen(li, "b", "", Number.isFinite(n) && n > 0 ? Math.floor(n) + " hal." : "·");
    if (khatam[hari] === true) tambahElemen(li, "small", "", "Khatam");
  }
  tambahElemen(dua, "h3", "", "Sedekah: " + t.sedekah + " dari " + JUMLAH_HARI + " hari");
  const koin = tambahElemen(dua, "ol", "rekap-koin");
  for (let hari = 1; hari <= JUMLAH_HARI; hari++) {
    tambahElemen(koin, "li", sedekah[hari] === true ? "ya" : "", hari);
  }
}

/* --- Proyek kebaikan: proyek pilihan dulu, lalu rencana proyek lain yang sempat diisi --- */
const PERTANYAAN_PROYEK = [["ide", "Ide proyekku"], ["tim", "Siapa yang kuajak?"], ["tanggal", "Kapan dimulai?"],
  ["langkah", "Langkah pertamaku"], ["dampak", "Dampak yang kuharapkan"]];

function rencanaTerisi(rencana) {
  return PERTANYAAN_PROYEK.some(function (b) { return hanyaTulisan(rencana[b[0]]) !== ""; });
}

function rekapProyek(induk) {
  const proyek = loadProyek();
  const semua = proyek.rencana && typeof proyek.rencana === "object" ? proyek.rencana : {};
  const pilihan = Object.hasOwn(NAMA_PROYEK, proyek.pilihan) ? proyek.pilihan : "";
  const urutan = [pilihan].concat(Object.keys(NAMA_PROYEK).filter(function (k) { return k !== pilihan; }))
    .filter(function (k) { return k && semua[k] && typeof semua[k] === "object" && (k === pilihan || rencanaTerisi(semua[k])); });

  if (!urutan.length) buatLembar(induk, "Proyek Kebaikanku", "Belum dipilih");
  urutan.forEach(function (k) {
    const nama = k === "sendiri" ? (hanyaTulisan(proyek.namaSendiri) || NAMA_PROYEK.sendiri) : NAMA_PROYEK[k];
    const lembar = buatLembar(induk, "Proyek Kebaikanku", nama + (k === pilihan ? " (pilihanku)" : ""));
    PERTANYAAN_PROYEK.forEach(function (b) {
      tambahElemen(lembar, "h3", "", b[1]);
      tambahElemen(lembar, "div", "kotak-jawab pendek", tanggalIndonesia(hanyaTulisan(semua[k][b[0]])));
    });
  });
}

/* --- Catatan bebas: coretan di buku catatan kamar 3D --- */
function rekapCoretan(induk) {
  let gambar = "";
  try { gambar = localStorage.getItem("kamar-coretan-buku") || ""; } catch (err) { /* diblokir */ }
  if (!gambar.startsWith("data:image/")) return;
  const lembar = buatLembar(induk, "Catatan Bebasku", "Coretan di buku catatan kamarku");
  const img = tambahElemen(lembar, "img", "rekap-coretan");
  img.src = gambar;
  img.alt = "Coretan di buku catatan";
}

/* --- Lembar terakhir: ucapan --- */
function rekapUcapan(induk) {
  const lembar = buatLembar(induk, "Jazakumullah Khairan Katsiran");
  const akhir = tambahElemen(lembar, "div", "rekap-ucapan");
  tambahElemen(akhir, "p", "quote", "Semoga ibadah kalian lancar, semangat!");
  tambahElemen(akhir, "p", "quote", "Sampai jumpa di Ramadhan tahun depan, Insyaa Allah");
}

function buatRekapLengkap(induk) {
  const profil = loadProfil();
  induk.textContent = "";
  rekapSampul(induk, profil);
  rekapTentangAku(induk, profil);
  rekapRingkasan(induk);
  rekapTracker(induk);
  for (let hari = 1; hari <= JUMLAH_HARI; hari++) buatLembarJurnal(hari, induk); // semua 30 hari
  rekapProyek(induk);
  rekapCoretan(induk);
  rekapUcapan(induk);
}
