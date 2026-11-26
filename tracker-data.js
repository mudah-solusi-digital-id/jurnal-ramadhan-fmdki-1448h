/* ==========================================================================
   tracker-data.js : daftar amalan tracker (dipakai tracker.html dan rekap)
   kunci = nama untuk penyimpanan, jangan diubah setelah dipakai.
   nama  = tulisan di layar, boleh diubah.
   ========================================================================== */
const AMALAN_TRACKER = [
  { kunci: "tahajud", nama: "Tahajud" },
  { kunci: "qobliyah-subuh", nama: "Qobliyah Subuh" },
  { kunci: "subuh", nama: "Subuh", jenis: "wajib" },
  { kunci: "dhuha", nama: "Dhuha" },
  { kunci: "qobliyah-dzuhur", nama: "Qobliyah Dzuhur" },
  { kunci: "dzuhur", nama: "Dzuhur", jenis: "wajib" },
  { kunci: "badiyah-dzuhur", nama: "Ba'diyah Dzuhur" },
  { kunci: "ashar", nama: "Ashar", jenis: "wajib" },
  { kunci: "magrib", nama: "Magrib", jenis: "wajib" },
  { kunci: "badiyah-magrib", nama: "Ba'diyah Magrib" },
  { kunci: "qobliyah-isya", nama: "Qobliyah Isya" },
  { kunci: "isya", nama: "Isya", jenis: "wajib" },
  { kunci: "badiyah-isya", nama: "Ba'diyah Isya" },
  { kunci: "tarawih", nama: "Shalat Tarawih" },
  { kunci: "baca-buku", nama: "Baca Buku", jenis: "lain" },
  { kunci: "dzikir-petang", nama: "Dzikir Petang", jenis: "lain" }
];
