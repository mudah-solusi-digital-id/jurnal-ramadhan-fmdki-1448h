/* ==========================================================================
   lembar.js : lembar cetak jurnal harian
   Dipakai menu.html (Cetak Semua) dan penutup.html (rekap lengkap).
   Butuh jurnal/data.js dan storage.js. Gayanya ada di print.css.
   ========================================================================== */

const NAMA_MOOD = { senang: "😊 Bahagia", biasa: "😐 Biasa saja", sedih: "😔 Sedih" };

function tambahElemen(induk, tag, kelas, teks) {
  const e = document.createElement(tag);
  if (kelas) e.className = kelas;
  if (teks !== undefined && teks !== "") e.textContent = teks;
  induk.appendChild(e);
  return e;
}

// Isian yang bukan tulisan dianggap kosong
function hanyaTulisan(nilai) {
  return typeof nilai === "string" ? nilai.trim() : "";
}

// Lembar kosong dengan kepala berlogo
function buatLembar(induk, judul, anakJudul) {
  const lembar = tambahElemen(induk, "section", "lembar");
  const kepala = tambahElemen(lembar, "header", "page-header");
  const logo = tambahElemen(kepala, "div", "logo-bar");
  ["fmdki", "karimah"].forEach(function (nama) {
    const img = tambahElemen(logo, "img");
    img.src = "assets/logo-" + nama + ".png";
    img.alt = "";
  });
  tambahElemen(kepala, "h2", "", judul);
  if (anakJudul) tambahElemen(kepala, "p", "quote", anakJudul);
  return lembar;
}

function buatLembarJurnal(hari, induk) {
  const isi = JURNAL[hari];
  const jawaban = loadJournal(hari);
  const lembar = buatLembar(induk, "Hari ke " + hari + " Ramadhan 1448 H", isi.judul);
  tambahElemen(lembar.firstChild, "p", "kecil",
    "Level " + levelHari(hari) + ": " + LEVEL[levelHari(hari)].nama + " · " + tanggalHari(hari));

  tambahElemen(lembar, "p", "kutipan", isi.ayat + " (" + isi.sumber + ")");
  tambahElemen(lembar, "h3", "", "Refleksi: " + isi.refleksi);
  tambahElemen(lembar, "div", "kotak-jawab tinggi", hanyaTulisan(jawaban.refleksi));
  tambahElemen(lembar, "h3", "", "Upgrade Challenge: " + isi.challenge);
  tambahElemen(lembar, "div", "kotak-jawab", hanyaTulisan(jawaban.catatan));
  tambahElemen(lembar, "p", "baris-mood", "Mood: " + (NAMA_MOOD[jawaban.mood] || "😊   😐   😔"));
}

/* Isi cetakan dikosongkan saat layar disentuh lagi, bukan saat dialog cetak
   tertutup, karena di HP dialog bisa masih membaca isinya. */
function kosongkanSetelahCetak(aksi) {
  ["pointerdown", "keydown"].forEach(function (nama) {
    window.addEventListener(nama, aksi, { capture: true });
  });
}
