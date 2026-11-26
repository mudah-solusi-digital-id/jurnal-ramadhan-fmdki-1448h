/* ==========================================================================
   transisi.js — Perpindahan halaman yang lembut dan suara

   Dipakai semua halaman. Suaranya dibuat langsung oleh browser (Web Audio),
   jadi tidak ada file musik yang perlu diunduh.

   Fungsi yang bisa dipakai halaman lain:
     Suara.kertas()   lembaran dibalik
     Suara.ketuk()    ketukan pintu
     Suara.lonceng()  nada lembut
     pindahKe(alamat) memudar, lalu membuka alamat
   ========================================================================== */

/* ============ 1. SUARA ============ */
const Suara = (function () {
  const KUNCI = "jurnal-suara";
  let konteks = null;

  function nyala() {
    try { return localStorage.getItem(KUNCI) !== "mati"; } catch (err) { return true; }
  }

  function setel(hidup) {
    try { localStorage.setItem(KUNCI, hidup ? "nyala" : "mati"); } catch (err) { /* penyimpanan diblokir */ }
  }

  // Browser hanya mengizinkan suara setelah pengguna mengetuk layar
  function siapkan() {
    if (!nyala()) return null;
    try {
      const Audio = window.AudioContext || window.webkitAudioContext;
      if (!Audio) return null;
      if (!konteks) konteks = new Audio();
      if (konteks.state === "suspended") konteks.resume().catch(function () {});
      return konteks;
    } catch (err) {
      return null;
    }
  }

  // Desis halus yang disaring: terdengar seperti kertas
  function desis(k, mulai, lama, dari, ke, keras) {
    const n = Math.floor(k.sampleRate * lama);
    const wadah = k.createBuffer(1, n, k.sampleRate);
    const isi = wadah.getChannelData(0);
    for (let i = 0; i < n; i++) isi[i] = (Math.random() * 2 - 1) * (0.6 + 0.4 * Math.sin(i / 190));
    const sumber = k.createBufferSource();
    sumber.buffer = wadah;
    const saring = k.createBiquadFilter();
    saring.type = "bandpass";
    saring.Q.value = 0.8;
    saring.frequency.setValueAtTime(dari, mulai);
    saring.frequency.linearRampToValueAtTime(ke, mulai + lama);
    const gain = k.createGain();
    gain.gain.setValueAtTime(0.0001, mulai);
    gain.gain.exponentialRampToValueAtTime(keras, mulai + lama * 0.3);
    gain.gain.exponentialRampToValueAtTime(0.0001, mulai + lama);
    sumber.connect(saring).connect(gain).connect(k.destination);
    sumber.start(mulai);
  }

  function nada(k, mulai, frekuensi, lama, keras) {
    const o = k.createOscillator(), gain = k.createGain();
    o.type = "sine";
    o.frequency.value = frekuensi;
    gain.gain.setValueAtTime(0.0001, mulai);
    gain.gain.exponentialRampToValueAtTime(keras, mulai + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, mulai + lama);
    o.connect(gain).connect(k.destination);
    o.start(mulai);
    o.stop(mulai + lama + 0.05);
  }

  // Suara tidak boleh membuat halaman error
  function mainkan(isi) {
    const k = siapkan();
    if (!k) return;
    try { isi(k, k.currentTime + 0.02); } catch (err) { /* abaikan */ }
  }

  return {
    nyala: nyala,
    setel: setel,
    kertas: function () {
      mainkan(function (k, t) {
        desis(k, t, 0.28, 1300, 3600, 0.1);
        desis(k, t + 0.12, 0.22, 2600, 5200, 0.06);
      });
    },
    ketuk: function () {
      mainkan(function (k, t) {
        [0, 0.2, 0.4].forEach(function (d) {
          nada(k, t + d, 170, 0.12, 0.28);
          desis(k, t + d, 0.05, 700, 400, 0.12);
        });
      });
    },
    lonceng: function () {
      mainkan(function (k, t) {
        [523.25, 659.25, 783.99, 1046.5].forEach(function (f, i) { nada(k, t + i * 0.13, f, 1.1, 0.045); });
      });
    }
  };
})();

/* ============ 2. PINDAH HALAMAN DENGAN LEMBUT ============ */
const LAMA_PINDAH = 420; // sama dengan transition body.pindah di style.css

function pindahKe(alamat) {
  const tanpaGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  document.body.classList.add("pindah");
  setTimeout(function () { location.href = alamat; }, tanpaGerak ? 0 : LAMA_PINDAH);
}

// Satu listener untuk semua link di halaman
document.addEventListener("click", function (e) {
  if (e.defaultPrevented || e.button !== 0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
  const link = e.target.closest("a[href]");
  if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
  const tulisan = link.getAttribute("href");
  if (tulisan.startsWith("#") || link.protocol !== location.protocol || link.host !== location.host) return;
  e.preventDefault();
  Suara.kertas();
  pindahKe(link.href);
});

// Tombol "kembali" browser bisa memulihkan halaman yang sudah memudar
window.addEventListener("pageshow", function () { document.body.classList.remove("pindah"); });

/* ============ 3. AKSEN MELAYANG — aktif kalau ada <body data-aksen> ============ */
(function () {
  if (document.body.dataset.aksen === undefined) return;
  const lapisan = document.createElement("div");
  lapisan.className = "aksen-melayang no-print";
  lapisan.setAttribute("aria-hidden", "true");

  // [gambar, kiri %, atas %, lebar px, jeda detik]
  [["bulan", 3, 14, 52, 0], ["hati", 91, 24, 44, 1.2], ["quran", 5, 46, 56, 2.1], ["lampu", 90, 52, 54, 0.6],
    ["jurnal", 2, 78, 50, 1.7], ["bulan", 93, 80, 40, 2.6], ["hati", 12, 92, 34, 0.9], ["ceklis", 82, 92, 42, 3]
  ].forEach(function (a) {
    const img = document.createElement("img");
    img.src = "assets/ikon-" + a[0] + ".svg";
    img.alt = "";
    img.style.cssText = "left:" + a[1] + "%;top:" + a[2] + "%;width:" + a[3] + "px;animation-delay:-" + a[4] + "s";
    lapisan.appendChild(img);
  });

  // Kelopak bunga yang jatuh pelan
  ["#ecc2d0", "#b7d3bc", "#efd3a0", "#d3c7e6", "#f9e4eb", "#b7d3bc", "#ecc2d0"].forEach(function (warna, i) {
    const k = document.createElement("i");
    k.style.cssText = "left:" + (6 + i * 14) + "%;background:" + warna + ";animation-duration:" + (14 + (i % 4) * 4) + "s;animation-delay:-" + i * 3.4 + "s";
    lapisan.appendChild(k);
  });

  document.body.insertBefore(lapisan, document.body.firstChild);
})();

/* ============ 4. TOMBOL SUARA NYALA / MATI ============ */
(function () {
  const tombol = document.createElement("button");
  tombol.type = "button";
  tombol.className = "tombol-suara no-print";

  function gambarkan() {
    const hidup = Suara.nyala();
    tombol.setAttribute("aria-label", hidup ? "Matikan suara" : "Nyalakan suara");
    tombol.title = hidup ? "Suara nyala" : "Suara mati";
    tombol.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6h4l5 4V5L8 9z" fill="currentColor"/>' +
      (hidup ? '<path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12"/>' : '<path d="m17 9 5 6M22 9l-5 6"/>') + "</svg>";
  }

  tombol.addEventListener("click", function () {
    Suara.setel(!Suara.nyala());
    gambarkan();
    Suara.kertas();
  });

  gambarkan();
  // Halaman isi: di ujung bawah, supaya tidak menutupi kolom. Cover dan kamar: melayang di pojok.
  (document.querySelector("main.page, .bab-teks") || document.body).appendChild(tombol);
})();
