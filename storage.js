/* ==========================================================================
   storage.js — Penyimpanan isian jurnal di browser (localStorage)

   Data hanya ada di browser pengguna; tidak dikirim ke server mana pun.

   Fungsi yang dipakai halaman lain:
     saveJournal(hariKe, data)  loadJournal(hariKe)
     saveTracker(data)          loadTracker()
     saveProfil(data)           loadProfil()
     saveProyek(data)           loadProyek()
     ringkasTracker()           jumlah centang, halaman, khatam, sedekah
     jurnalTerisi(hariKe)       jumlahHariTerisi()
     bacaForm(form)             isiForm(form, data)

   save... mengembalikan true kalau berhasil, false kalau gagal.
   load... mengembalikan objek data; objek kosong {} kalau belum ada isian.
   ========================================================================== */

/* 1. NAMA KUNCI — satu tempat, supaya semua halaman membaca kunci yang sama */
const KUNCI_TRACKER = "jurnal-tracker";
const KUNCI_PROFIL = "jurnal-profil";
const KUNCI_PROYEK = "jurnal-proyek";
const JUMLAH_HARI = 30;

/* Mengubah 1 atau "1" menjadi "jurnal-hari-1". Hari di luar 1-30 = error. */
function kunciHari(hariKe) {
  const hari = Number(hariKe);
  if (!Number.isInteger(hari) || hari < 1 || hari > JUMLAH_HARI) {
    throw new RangeError("Hari harus angka 1 sampai " + JUMLAH_HARI + ", bukan: " + hariKe);
  }
  return "jurnal-hari-" + hari;
}

/* 2. FUNGSI DASAR — satu-satunya tempat yang menyentuh localStorage */
function simpanData(kunci, data) {
  try {
    localStorage.setItem(kunci, JSON.stringify(data));
    return true;
  } catch (err) {
    // Biasanya: memori penuh, atau localStorage diblokir browser
    console.warn("Gagal menyimpan " + kunci + ":", err);
    return false;
  }
}

function ambilData(kunci) {
  try {
    const data = JSON.parse(localStorage.getItem(kunci));
    const berupaObjek = data !== null && typeof data === "object" && !Array.isArray(data);
    return berupaObjek ? data : {};
  } catch (err) {
    // Biasanya: isi tersimpan rusak, atau localStorage diblokir browser
    console.warn("Gagal membaca " + kunci + ":", err);
    return {};
  }
}

/* 3. JURNAL HARIAN */
function saveJournal(hariKe, data) {
  try {
    return simpanData(kunciHari(hariKe), data);
  } catch (err) {
    console.warn(err.message);
    return false;
  }
}

function loadJournal(hariKe) {
  try {
    return ambilData(kunciHari(hariKe));
  } catch (err) {
    console.warn(err.message);
    return {};
  }
}

/* Hari dianggap terisi kalau ada minimal satu isian yang tidak kosong */
function jurnalTerisi(hariKe) {
  return Object.values(loadJournal(hariKe)).some(function (nilai) {
    return nilai === true || (typeof nilai === "string" && nilai.trim() !== "");
  });
}

function jumlahHariTerisi() {
  let jumlah = 0;
  for (let hari = 1; hari <= JUMLAH_HARI; hari++) {
    if (jurnalTerisi(hari)) jumlah++;
  }
  return jumlah;
}

/* 4. TRACKER AMALAN */
function saveTracker(data) {
  return simpanData(KUNCI_TRACKER, data);
}

function loadTracker() {
  return ambilData(KUNCI_TRACKER);
}

/* 5. PROFIL */
function saveProfil(data) {
  return simpanData(KUNCI_PROFIL, data);
}

function loadProfil() {
  return ambilData(KUNCI_PROFIL);
}

/* 5b. PROYEK KEBAIKAN */
function saveProyek(data) {
  return simpanData(KUNCI_PROYEK, data);
}

function loadProyek() {
  return ambilData(KUNCI_PROYEK);
}

/* 5c. RINGKASAN TRACKER untuk menu dan penutup */
function ringkasTracker() {
  const data = loadTracker();
  const bagian = function (nama) {
    const isi = data[nama];
    return isi && typeof isi === "object" ? isi : {};
  };
  const jumlahBenar = function (nama) {
    return Object.values(bagian(nama)).filter(function (n) { return n === true; }).length;
  };
  const halaman = Object.values(bagian("tilawah")).reduce(function (total, n) {
    return total + (Number.isFinite(n) && n > 0 ? Math.floor(n) : 0);
  }, 0);
  return { amalan: jumlahBenar("shalat"), halaman: halaman, khatam: jumlahBenar("khatam"), sedekah: jumlahBenar("sedekah") };
}

/* 6. FORM <-> OBJEK — atribut name di HTML menjadi nama datanya */
function kolomForm(form) {
  return Array.from(form.elements).filter(function (el) {
    return el.name && !["file", "button", "submit", "reset"].includes(el.type);
  });
}

/* Membaca semua isian form menjadi objek, misalnya { nama: "Aisyah" } */
function bacaForm(form) {
  const data = {};
  kolomForm(form).forEach(function (el) {
    if (el.type === "checkbox") {
      data[el.name] = el.checked;
    } else if (el.type === "radio") {
      if (el.checked) data[el.name] = el.value;
    } else {
      data[el.name] = el.value;
    }
  });
  return data;
}

/* Mengisi form dari objek. Kolom tanpa data tersimpan dibiarkan apa adanya. */
function isiForm(form, data) {
  kolomForm(form).forEach(function (el) {
    if (!Object.hasOwn(data, el.name)) return;
    const nilai = data[el.name];
    if (el.type === "checkbox") {
      el.checked = nilai === true;
    } else if (el.type === "radio") {
      el.checked = el.value === nilai;
    } else {
      el.value = nilai;
    }
  });
}

/* 7. AUTO-LOAD — jalan sendiri saat halaman dibuka. Cukup tandai form-nya:
     <form data-autoload="profil">
     <form data-autoload="tracker">
     <form data-autoload="jurnal" data-hari="1">
   Kalau data-hari tidak ditulis, harinya diambil dari alamat (...?hari=1). */
function autoLoadForm() {
  document.querySelectorAll("form[data-autoload]").forEach(function (form) {
    try {
      const jenis = form.dataset.autoload;
      if (jenis === "profil") {
        isiForm(form, loadProfil());
      } else if (jenis === "tracker") {
        isiForm(form, loadTracker());
      } else if (jenis === "jurnal") {
        const hariDiAlamat = new URLSearchParams(location.search).get("hari");
        isiForm(form, loadJournal(form.dataset.hari || hariDiAlamat));
      }
    } catch (err) {
      console.warn("Auto-load form gagal:", err);
    }
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", autoLoadForm);
} else {
  autoLoadForm();
}
