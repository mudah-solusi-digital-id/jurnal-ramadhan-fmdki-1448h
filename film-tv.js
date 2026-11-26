/* ==========================================================================
   film-tv.js : video 3D "Jurnal Ramadhan 1448 H" di layar TV kamar

   Dipanggil kamar.js:
     const film = buatFilmTV(THREE, renderer, { logoF, logoK, kurangiGerak });
     film.tekstur              tekstur untuk layar TV
     film.perbarui(detik)      dipanggil tiap bingkai
     film.tonton(true/false)   duduk menonton (suara boleh berbunyi) atau tidak
     film.aturSuara(ya)        suara TV nyala atau mati (tersimpan di HP)
     film.suaraNyala()         pilihan suara TV saat ini
     film.ulang()              ulang dari adegan pertama

   Video tidak berupa file: adegan 3D digambar langsung di layar TV,
   jadi ringan. Hanya narasi suara yang berupa file (assets/narasi/).
   ========================================================================== */

function buatFilmTV(THREE, renderer, opsi) {
  const KECIL = Math.min(window.innerWidth, window.innerHeight) < 600;
  const LEBAR = KECIL ? 768 : 1024, TINGGI = LEBAR * 9 / 16;
  const target = new THREE.WebGLRenderTarget(LEBAR, TINGGI);
  const scene = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(40, 16 / 9, 0.1, 60);
  kamera.position.set(0, 0, 6);
  scene.add(kamera);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3e8ef, 0.95));
  const matahari = new THREE.DirectionalLight(0xffffff, 0.35);
  matahari.position.set(2, 3, 4);
  scene.add(matahari);

  const W = {
    putih: 0xfffdfa, krem: 0xfdf3e7, sage: 0xb7d3bc, sageMuda: 0xe2efe2, sageTua: 0x8fb89b,
    rose: 0xecc2d0, roseMuda: 0xf9e4eb, lav: 0xd3c7e6, lavMuda: 0xece6f4, madu: 0xefd3a0, emas: 0xdcb26b,
    kayu: 0xf3dfc4, biru: 0xcfe3ee, hijau: 0x3f6650
  };

  /* ============ 1. NASKAH: judul, teks di layar, file suara ============ */
  // lama = perkiraan detik bila suara belum ada; diganti panjang rekaman setelah termuat
  const ADEGAN = [
    { judul: "Jurnal Ramadhan 1448 H", latar: 0xf6f1fb, lama: 12,
      teks: "Assalamu'alaikum, Muslimah. Selamat datang di Jurnal Ramadhan 1448 H, Space to Breathe. Sebuah ruang tenang untuk menemanimu bertumbuh selama tiga puluh hari Ramadhan." },
    { judul: "Bukan sekadar catatan", latar: 0xfdf3e7, lama: 11,
      teks: "Jurnal ini bukan sekadar catatan. Ini tempatmu berhenti sejenak, menarik napas, lalu jujur pada diri sendiri tentang ibadahmu, perasaanmu, dan langkah kecilmu setiap hari." },
    { judul: "Kamar 3D", latar: 0xfbe9ef, lama: 12,
      teks: "Perjalananmu dimulai dari kamar ini. Kamu bisa membuka Al Qur'an berisi tiga puluh ayat pilihan, duduk di sajadah, melongok dari jendela, atau rebahan sambil menatap langit berbintang." },
    { judul: "Profil Muslimah", latar: 0xe9f3ea, lama: 8,
      teks: "Langkah pertama, isi Profil Muslimah. Kenali dirimu: kampusmu, motto hidupmu, dan harapanmu untuk kampus dan daerahmu." },
    { judul: "Jurnal 30 Hari", latar: 0xf3effa, lama: 13,
      teks: "Setiap hari ada satu halaman jurnal: bekal ayat hari ini, satu pertanyaan refleksi, satu tantangan kecil, dan pilihan mood. Tiga puluh hari dibagi tiga level: Reset Diri dan Niat, Berdiri Dalam, lalu Totalitas." },
    { judul: "Amalan Tracker", latar: 0xfdf3e3, lama: 9,
      teks: "Di Amalan Tracker, centang shalat dan amalanmu, catat halaman tilawah, tandai saat khatam, dan kumpulkan koin sedekah setiap hari." },
    { judul: "Infografis", latar: 0xeaf3f7, lama: 9,
      teks: "Ingin tahu keutamaan Ramadhan? Buka Infografis untuk mengenal waktu terbaik berdoa, sahur, dan amalan harian beserta dalilnya." },
    { judul: "Proyek Kebaikan", latar: 0xfbeef3, lama: 8,
      teks: "Ramadhan juga tentang berbagi. Pilih satu Proyek Kebaikan, ajak temanmu, lalu mulai dari satu langkah kecil untuk negeri." },
    { judul: "Rekap PDF", latar: 0xf1f6ec, lama: 9,
      teks: "Di akhir Ramadhan, lihat rekap perjalananmu dan simpan seluruh isi jurnalmu sebagai PDF. Kenang kenangan yang bisa kamu baca lagi tahun depan." },
    { judul: "Untukmu, muslimah mahasiswa", latar: 0x141a3a, malam: true, lama: 22,
      teks: "Untukmu, muslimah mahasiswa. Tidak apa apa kalau ibadahmu belum sempurna. Jurnal ini bukan untuk dinilai orang lain; hanya kamu dan Allah yang tahu. Tulislah dengan jujur, meski harimu terasa berat. Isilah dengan konsisten, walau hanya satu kalimat. Karena perubahan besar selalu dimulai dari langkah kecil yang dijaga setiap hari. Pelan pelan, asal konsisten." },
    { judul: "Yuk, mulai hari ini!", latar: 0xf6f1fb, lama: 8,
      teks: "Selamat menjalani Ramadhan. Semoga Allah menerima setiap usahamu. Yuk, mulai isi jurnalmu hari ini!" }
  ];
  const JEDA = 1.2; // detik hening di antara adegan
  ADEGAN.forEach(function (a, i) {
    a.suara = "assets/narasi/adegan-" + String(i + 1).padStart(2, "0") + ".mp3";
    a.kalimat = a.teks.match(/[^.!?;:]+[.!?;:]*/g).map(function (k) { return k.trim(); });
  });

  /* ============ 2. ALAT BANTU 3D ============ */
  const simpanan = {};
  function bahan(w) {
    if (!simpanan[w]) simpanan[w] = new THREE.MeshLambertMaterial({ color: w });
    return simpanan[w];
  }
  function mesh(induk, geo, w, x, y, z) {
    const m = new THREE.Mesh(geo, typeof w === "number" ? bahan(w) : w);
    m.position.set(x || 0, y || 0, z || 0);
    induk.add(m);
    return m;
  }
  function kotak(induk, w, l, t, d, x, y, z) { return mesh(induk, new THREE.BoxGeometry(l, t, d), w, x, y, z); }
  function bola(induk, w, r, x, y, z) { return mesh(induk, new THREE.SphereGeometry(r, 24, 16), w, x, y, z); }
  function tabung(induk, w, ra, rb, t, x, y, z) { return mesh(induk, new THREE.CylinderGeometry(ra, rb, t, 28), w, x, y, z); }
  function grup(induk, x, y, z) { const g = new THREE.Group(); g.position.set(x || 0, y || 0, z || 0); induk.add(g); return g; }

  function bulat(l, t, r) {
    const a = l / 2, b = t / 2, s = new THREE.Shape();
    s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r);
    s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b); s.lineTo(-a + r, b);
    s.quadraticCurveTo(-a, b, -a, b - r); s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
    return s;
  }
  function tebal(bentuk, d) {
    const g = new THREE.ExtrudeGeometry(bentuk, { depth: d, bevelEnabled: true, bevelThickness: d * 0.3, bevelSize: d * 0.3, bevelSegments: 2, curveSegments: 16 });
    g.center();
    return g;
  }
  function papan(induk, w, l, t, d, r, x, y, z) { return mesh(induk, tebal(bulat(l, t, r), d), w, x, y, z); }
  function sabit(R) {
    const r = R * 0.8, geser = R * 0.37;
    const x = (R * R - r * r + geser * geser) / (2 * geser), y = Math.sqrt(R * R - x * x);
    const a = Math.atan2(y, x), b = Math.atan2(y, x - geser), s = new THREE.Shape();
    s.absarc(0, 0, R, a, Math.PI * 2 - a, false);
    s.absarc(geser, 0, r, -b, b, true);
    return s;
  }
  function bintang(luar, dalam) {
    const s = new THREE.Shape();
    for (let i = 0; i < 10; i++) {
      const j = i % 2 ? dalam : luar, a = i / 10 * Math.PI * 2 + Math.PI / 2;
      if (i === 0) s.moveTo(Math.cos(a) * j, Math.sin(a) * j); else s.lineTo(Math.cos(a) * j, Math.sin(a) * j);
    }
    s.closePath();
    return s;
  }

  // Tulisan di bidang datar (kanvas 2D menjadi tekstur)
  function tulisan(induk, isi, ukuran, warna, lebar, x, y, z, tebalHuruf) {
    const c = document.createElement("canvas"), ctx = c.getContext("2d");
    const font = (tebalHuruf || "700") + " " + ukuran + "px Georgia, serif";
    ctx.font = font;
    c.width = Math.ceil(ctx.measureText(isi).width + ukuran);
    c.height = Math.ceil(ukuran * 1.5);
    ctx.font = font;
    ctx.fillStyle = warna;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(isi, c.width / 2, c.height / 2);
    const t = new THREE.CanvasTexture(c);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(lebar, lebar * c.height / c.width),
      new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.position.set(x || 0, y || 0, z || 0);
    induk.add(m);
    return m;
  }
  function logo(induk, data, lebar, rasio, x, y, z) {
    if (typeof data !== "string") return null;
    const t = new THREE.TextureLoader().load(data);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(lebar, lebar / rasio), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }));
    m.position.set(x, y, z);
    induk.add(m);
    return m;
  }

  const ease = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };
  const pantul = function (t) { t = Math.max(0, Math.min(1, t)); return 1 + 2.2 * Math.pow(t - 1, 3) + 1.2 * Math.pow(t - 1, 2); };

  // Bintang kecil berkelip sebagai latar beberapa adegan
  function taburBintang(induk, n, warna, sebar) {
    const daftar = [];
    for (let i = 0; i < n; i++) {
      const s = mesh(induk, new THREE.CircleGeometry(0.025 + Math.random() * 0.03, 8),
        new THREE.MeshBasicMaterial({ color: warna, transparent: true }),
        (Math.random() - 0.5) * sebar, (Math.random() - 0.3) * sebar * 0.5, -2 - Math.random() * 2);
      s.userData.fase = Math.random() * 6;
      daftar.push(s);
    }
    return function (t) { daftar.forEach(function (s) { s.material.opacity = 0.35 + 0.65 * Math.abs(Math.sin(t * 1.5 + s.userData.fase)); }); };
  }

  /* ============ 3. ADEGAN 3D ============ */
  const RASIO_F = 900 / 305, RASIO_K = 900 / 251;
  const panggung = [];

  // 1. Bulan sabit emas, bintang, dan logo
  panggung.push(function () {
    const g = grup(scene);
    const bulan = mesh(g, tebal(sabit(0.75), 0.18), W.emas, 0, 0.35, 0);
    const kilau = [];
    for (let i = 0; i < 7; i++) {
      const b = mesh(g, tebal(bintang(0.13, 0.06), 0.05), W.madu, Math.cos(i * 0.9) * 1.9, 0.2 + Math.sin(i * 1.7) * 0.7, -0.4);
      kilau.push(b);
    }
    const kelip = taburBintang(g, 40, 0xdcb26b, 9);
    const lf = logo(g, opsi.logoF, 1.1, RASIO_F, -0.75, -0.75, 0.3), lk = logo(g, opsi.logoK, 1.1, RASIO_K, 0.75, -0.75, 0.3);
    return function (t) {
      bulan.rotation.y = Math.sin(t * 0.8) * 0.6;
      bulan.scale.setScalar(Math.max(0.001, pantul(t / 1.2)));
      kilau.forEach(function (b, i) { b.rotation.z = t * (0.6 + i * 0.1); b.scale.setScalar(Math.max(0.001, ease((t - 0.3 - i * 0.15) / 0.6))); });
      [lf, lk].forEach(function (l, i) { if (l) { l.material.opacity = ease((t - 1.5 - i * 0.3) / 0.8); } });
      kelip(t);
    };
  });

  // 2. Buku jurnal terbuka, halaman membalik
  panggung.push(function () {
    const g = grup(scene, 0, 0.15, 0);
    g.rotation.x = -0.35;
    const kiri = grup(g), kanan = grup(g);
    papan(kiri, W.sage, 1.3, 1.7, 0.06, 0.08, -0.66, 0, 0);
    papan(kanan, W.sage, 1.3, 1.7, 0.06, 0.08, 0.66, 0, 0);
    papan(kiri, W.putih, 1.2, 1.6, 0.05, 0.04, -0.62, 0, 0.06);
    papan(kanan, W.putih, 1.2, 1.6, 0.05, 0.04, 0.62, 0, 0.06);
    [kiri, kanan].forEach(function (s, k) {
      for (let i = 0; i < 6; i++) kotak(s, 0xe4dcf0, 0.85, 0.025, 0.01, (k ? 0.62 : -0.62), 0.45 - i * 0.18, 0.1);
    });
    const halaman = [];
    for (let i = 0; i < 3; i++) {
      const h = grup(g, 0, 0, 0.1 + i * 0.005);
      papan(h, i % 2 ? W.roseMuda : W.krem, 1.18, 1.56, 0.02, 0.04, 0.6, 0, 0);
      halaman.push(h);
    }
    return function (t) {
      const buka = ease(t / 1.4);
      kiri.rotation.y = -(1 - buka) * 1.5;
      kanan.rotation.y = (1 - buka) * 1.5;
      halaman.forEach(function (h, i) { h.rotation.y = -Math.PI * ease((t - 2 - i * 1.4) / 1.1); h.visible = buka > 0.9; });
      g.rotation.y = Math.sin(t * 0.4) * 0.25;
    };
  });

  // 3. Miniatur kamar berputar
  panggung.push(function () {
    const g = grup(scene, 0, -0.35, 0);
    papan(g, W.kayu, 2.6, 2.6, 0.12, 0.1, 0, 0, 0).rotation.x = -Math.PI / 2;
    kotak(g, 0xfbeff2, 2.6, 1.5, 0.08, 0, 0.75, -1.3);
    kotak(g, 0xf4f1fa, 0.08, 1.5, 2.6, -1.3, 0.75, 0);
    kotak(g, 0xc3e4f2, 0.9, 0.6, 0.02, 0.3, 0.95, -1.25);                 // jendela
    kotak(g, W.putih, 0.95, 0.05, 0.05, 0.3, 0.95, -1.24);
    kotak(g, W.putih, 0.05, 0.62, 0.05, 0.3, 0.95, -1.24);
    kotak(g, W.putih, 0.8, 0.16, 1.2, -0.85, 0.12, -0.6);                 // kasur
    kotak(g, W.roseMuda, 0.82, 0.08, 0.75, -0.85, 0.22, -0.35);
    bola(g, W.lavMuda, 0.14, -0.85, 0.26, -1.05).scale.set(1.6, 0.6, 1);
    kotak(g, W.kayu, 1.0, 0.05, 0.45, 0.3, 0.42, -1.0);                   // meja
    kotak(g, W.lavMuda, 0.32, 0.2, 0.02, 0.15, 0.55, -1.05);              // laptop
    papan(g, W.sage, 0.45, 0.75, 0.02, 0.03, 0.75, 0.02, 0.35).rotation.x = -Math.PI / 2; // sajadah
    const quran = grup(g, 0.95, 0.55, -0.85);
    kotak(quran, W.putih, 0.38, 0.35, 0.3, 0, -0.18, 0);
    papan(quran, W.sageTua, 0.3, 0.2, 0.02, 0.02, 0, 0.05, 0).rotation.x = -0.6;
    const kilau = bola(g, new THREE.MeshBasicMaterial({ color: 0xffe9a8, transparent: true, opacity: 0.5 }), 0.12, 0.95, 0.75, -0.85);
    return function (t) {
      g.rotation.y = -0.6 + Math.sin(t * 0.35) * 0.55;
      g.rotation.x = 0.35;
      g.scale.setScalar(0.85 + 0.15 * ease(t / 1.2));
      kilau.material.opacity = 0.3 + 0.3 * Math.sin(t * 3);
    };
  });

  // 4. Kartu profil melayang
  panggung.push(function () {
    const g = grup(scene, 0, 0.1, 0);
    papan(g, W.putih, 2.4, 1.5, 0.08, 0.14, 0, 0, 0);
    papan(g, W.sageMuda, 2.2, 0.32, 0.02, 0.08, 0, 0.5, 0.06);
    const foto = tabung(g, W.rose, 0.36, 0.36, 0.05, -0.7, -0.08, 0.07);
    foto.rotation.x = Math.PI / 2;
    bola(g, W.roseMuda, 0.14, -0.7, 0.0, 0.11).scale.set(1, 1, 0.3);
    const garis = [0.12, -0.08, -0.28, -0.48].map(function (y, i) {
      const m = kotak(g, i ? 0xe4dcf0 : W.sageTua, 1.1, 0.07, 0.02, 0.25, y, 0.07);
      m.userData.lebar = i ? 1.1 - i * 0.12 : 1.2;
      return m;
    });
    return function (t) {
      g.position.y = 0.1 + Math.sin(t * 1.2) * 0.06;
      g.rotation.y = Math.sin(t * 0.6) * 0.3;
      g.rotation.x = -0.1;
      garis.forEach(function (m, i) {
        const p = ease((t - 0.6 - i * 0.5) / 0.7);
        m.scale.x = Math.max(0.001, p * m.userData.lebar / 1.1);
        m.position.x = -0.3 + 0.55 * p * m.userData.lebar / 1.1;
      });
      foto.scale.setScalar(Math.max(0.001, pantul(t / 0.8)));
    };
  });

  // 5. Tiga puluh kotak hari menyala satu per satu, tiga warna level
  panggung.push(function () {
    const g = grup(scene, 0, 0.15, 0);
    const WARNA_LEVEL = [W.sage, W.rose, W.lav];
    const kotakHari = [];
    for (let i = 0; i < 30; i++) {
      const kol = i % 10, bar = Math.floor(i / 10);
      const m = papan(g, new THREE.MeshLambertMaterial({ color: 0xf1ede6 }), 0.32, 0.32, 0.08, 0.06, (kol - 4.5) * 0.4, (1 - bar) * 0.42, 0);
      m.userData.warna = new THREE.Color(WARNA_LEVEL[bar]);
      kotakHari.push(m);
    }
    const label = ["Reset Diri & Niat", "Berdiri Dalam", "Totalitas"].map(function (n, i) {
      return tulisan(g, n, 44, ["#5f8f6c", "#c0708e", "#8a74c0"][i], 1.3, 2.75, (1 - i) * 0.42, 0.05);
    });
    g.position.x = -0.35;
    return function (t) {
      const nyala = Math.floor(t / 0.3);
      kotakHari.forEach(function (m, i) {
        if (i < nyala) {
          m.material.color.lerp(m.userData.warna, 0.15);
          m.scale.setScalar(Math.min(1.12, pantul((t - i * 0.3) / 0.35)));
        }
      });
      label.forEach(function (l, i) { l.material.opacity = ease((t - (i * 10 + 5) * 0.3) / 0.6); });
      g.rotation.x = -0.25 + Math.sin(t * 0.5) * 0.05;
      g.rotation.y = Math.sin(t * 0.4) * 0.12;
    };
  });

  // 6. Kotak centang tercentang dan koin sedekah berjatuhan
  panggung.push(function () {
    const g = grup(scene);
    const centang = [];
    ["Shalat", "Tilawah", "Sedekah"].forEach(function (n, i) {
      const y = 0.75 - i * 0.6;
      papan(g, W.putih, 2.3, 0.48, 0.06, 0.1, -1.0, y, 0);
      papan(g, W.sageMuda, 0.32, 0.32, 0.05, 0.06, -1.85, y, 0.05);
      tulisan(g, n, 44, "#3f6650", 1.0, -0.95, y, 0.06);
      const c = grup(g, -1.85, y, 0.1);
      kotak(c, W.hijau, 0.07, 0.17, 0.03, -0.06, -0.03, 0).rotation.z = 0.8;
      kotak(c, W.hijau, 0.07, 0.3, 0.03, 0.06, 0.03, 0).rotation.z = -0.6;
      centang.push(c);
    });
    const koin = [];
    for (let i = 0; i < 9; i++) {
      const k = tabung(g, W.emas, 0.16, 0.16, 0.04, 1.2 + (i % 3) * 0.38, 2, (i % 2) * 0.1);
      k.rotation.x = Math.PI / 2;
      k.userData.jatuh = 0.8 + i * 0.6;
      k.userData.dasar = -0.85 + Math.floor(i / 3) * 0.06;
      koin.push(k);
    }
    tabung(g, W.lavMuda, 0.75, 0.6, 0.5, 1.58, -1.05, 0).scale.z = 0.4; // wadah sedekah
    return function (t) {
      centang.forEach(function (c, i) { c.scale.setScalar(Math.max(0.001, pantul((t - 0.8 - i * 1.6) / 0.5))); });
      koin.forEach(function (k) {
        const p = ease((t - k.userData.jatuh) / 0.8);
        k.position.y = 2 + (k.userData.dasar - 2) * p;
        k.rotation.y = t * 3;
      });
    };
  });

  // 7. Ikon infografis muncul bergantian
  panggung.push(function () {
    const g = grup(scene, 0, 0.15, 0);
    const ikon = [];
    const bln = grup(g, -1.4, 0, 0); mesh(bln, tebal(sabit(0.45), 0.12), W.emas); ikon.push(bln);
    const lampu = grup(g, 0, 0, 0);
    bola(lampu, new THREE.MeshBasicMaterial({ color: 0xfff1c4 }), 0.38, 0, 0.12, 0);
    tabung(lampu, W.sageTua, 0.18, 0.14, 0.25, 0, -0.38, 0);
    ikon.push(lampu);
    const kitab = grup(g, 1.4, 0, 0);
    papan(kitab, W.sage, 0.75, 0.95, 0.12, 0.05, 0, 0, 0);
    papan(kitab, W.emas, 0.5, 0.06, 0.02, 0.02, 0, 0.2, 0.08);
    ikon.push(kitab);
    ["Waktu berdoa", "Sahur", "Amalan harian"].forEach(function (n, i) {
      ikon[i].userData.label = tulisan(g, n, 40, "#3f6650", 1.0, (i - 1) * 1.4, -0.85, 0);
    });
    return function (t) {
      ikon.forEach(function (k, i) {
        const p = (t - 0.4 - i * 1.0) / 0.6;
        k.scale.setScalar(Math.max(0.001, pantul(p)));
        k.rotation.y = Math.sin(t * 1.1 + i) * 0.5;
        k.position.y = Math.sin(t * 1.6 + i) * 0.05;
        k.userData.label.material.opacity = ease(p);
      });
    };
  });

  // 8. Kubus proyek kebaikan berputar
  panggung.push(function () {
    const g = grup(scene, 0, 0.1, 0);
    function sisi(emoji, warna) {
      const c = document.createElement("canvas");
      c.width = c.height = 128;
      const ctx = c.getContext("2d");
      ctx.fillStyle = warna;
      ctx.fillRect(0, 0, 128, 128);
      ctx.font = "72px sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(emoji, 64, 70);
      return new THREE.MeshLambertMaterial({ map: new THREE.CanvasTexture(c) });
    }
    const kubus = [["🎬", "#e2efe2"], ["🎨", "#fbeed6"], ["🕌", "#ece6f4"]].map(function (d, i) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.8, 0.8), sisi(d[0], d[1]));
      m.position.set((i - 1) * 1.5, 0, 0);
      g.add(m);
      return m;
    });
    const hati = mesh(g, tebal((function () {
      const s = new THREE.Shape();
      s.moveTo(0, -0.3); s.bezierCurveTo(-0.6, 0.1, -0.3, 0.55, 0, 0.25); s.bezierCurveTo(0.3, 0.55, 0.6, 0.1, 0, -0.3);
      return s;
    })(), 0.1), W.rose, 0, 0.95, 0);
    return function (t) {
      kubus.forEach(function (k, i) {
        k.rotation.x = t * 0.6 + i;
        k.rotation.y = t * 0.8 + i;
        k.scale.setScalar(Math.max(0.001, pantul((t - 0.3 - i * 0.4) / 0.6)));
      });
      hati.scale.setScalar(Math.max(0.001, (0.9 + Math.sin(t * 4) * 0.08) * ease((t - 1.6) / 0.5)));
    };
  });

  // 9. Lembar rekap tersusun menjadi buku PDF
  panggung.push(function () {
    const g = grup(scene, 0, 0.1, 0);
    const lembar = [];
    const warna = [W.putih, W.sageMuda, W.roseMuda, W.lavMuda, W.krem, W.putih];
    for (let i = 0; i < 6; i++) {
      const l = papan(g, warna[i], 1.0, 1.35, 0.02, 0.05, 0, 0, 0);
      l.userData.dari = new THREE.Vector3((i - 2.5) * 0.9, 1.4 - (i % 2) * 2.8, -1);
      l.userData.ke = new THREE.Vector3(0, 0, i * 0.03);
      lembar.push(l);
    }
    const sampul = papan(g, W.sage, 1.1, 1.45, 0.06, 0.06, 0, 0, 0.22);
    const pdf = tulisan(g, "PDF", 70, "#ffffff", 0.6, 0, 0, 0.27);
    return function (t) {
      lembar.forEach(function (l, i) {
        const p = ease((t - 0.3 - i * 0.35) / 0.8);
        l.position.lerpVectors(l.userData.dari, l.userData.ke, p);
        l.rotation.z = (1 - p) * (i % 2 ? 0.6 : -0.6);
      });
      const s = ease((t - 2.8) / 0.6);
      sampul.scale.setScalar(Math.max(0.001, s));
      pdf.material.opacity = s;
      g.rotation.y = Math.sin(t * 0.5) * 0.35;
    };
  });

  // 10. Langit malam dan kata kata bercahaya
  panggung.push(function () {
    const g = grup(scene);
    const kelip = taburBintang(g, 90, 0xfff3d6, 12);
    const bulan = mesh(g, tebal(sabit(0.4), 0.1), new THREE.MeshBasicMaterial({ color: 0xf4d694 }), 2.2, 1.05, -0.5);
    const kata = [["Jujur", "#f4d694"], ["Konsisten", "#f6c6d6"], ["Pelan pelan", "#cfe3ee"]].map(function (k, i) {
      return tulisan(g, k[0], 96, k[1], 1.9, (i - 1) * 2.05, 0.15, 0);
    });
    return function (t, p) {
      kelip(t);
      bulan.rotation.z = Math.sin(t * 0.5) * 0.1;
      kata.forEach(function (k, i) {
        const muncul = ease((p - 0.3 - i * 0.2) / 0.08);
        k.material.opacity = muncul * (0.75 + 0.25 * Math.sin(t * 2 + i));
        k.position.y = 0.15 + (1 - muncul) * -0.3 + Math.sin(t * 1.2 + i) * 0.04;
      });
    };
  });

  // 11. Penutup: bulan, logo, ajakan
  panggung.push(function () {
    const g = grup(scene);
    const bulan = mesh(g, tebal(sabit(0.5), 0.14), W.emas, 0, 0.75, 0);
    const ajak = tulisan(g, "Yuk, mulai hari ini!", 80, "#3f6650", 3.2, 0, 0.0, 0);
    const lf = logo(g, opsi.logoF, 1.0, RASIO_F, -0.7, -0.7, 0), lk = logo(g, opsi.logoK, 1.0, RASIO_K, 0.7, -0.7, 0);
    const kelip = taburBintang(g, 30, 0xdcb26b, 9);
    return function (t) {
      bulan.rotation.y = t * 0.8;
      ajak.scale.setScalar(Math.max(0.001, pantul((t - 0.4) / 0.7)));
      [lf, lk].forEach(function (l) { if (l) l.material.opacity = ease((t - 1) / 0.8); });
      kelip(t);
    };
  });

  const adegan3D = panggung.map(function (buat) {
    const sebelum = scene.children.length;
    const jalankan = buat();
    const g = scene.children[sebelum]; // grup yang baru dibuat
    g.visible = false;
    return { grup: g, jalankan: jalankan };
  });

  /* ============ 4. TEKS DI LAYAR: judul di atas, kalimat narasi di bawah ============ */
  const kanvasTeks = document.createElement("canvas");
  kanvasTeks.width = 1024;
  kanvasTeks.height = 576;
  const ctxTeks = kanvasTeks.getContext("2d");
  const teksturTeks = new THREE.CanvasTexture(kanvasTeks);
  const lapisanTeks = new THREE.Mesh(new THREE.PlaneGeometry(1, 1),
    new THREE.MeshBasicMaterial({ map: teksturTeks, transparent: true, depthTest: false, depthWrite: false }));
  lapisanTeks.renderOrder = 10;
  kamera.add(lapisanTeks);
  // Bidang setinggi layar kamera tepat di depan lensa
  const jarakTeks = 1;
  const tinggiTeks = 2 * jarakTeks * Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
  lapisanTeks.position.z = -jarakTeks;
  lapisanTeks.scale.set(tinggiTeks * 16 / 9, tinggiTeks, 1);

  function pecahBaris(ctx, isi, lebarMaks) {
    const kata = isi.split(" "), baris = [];
    let kini = "";
    kata.forEach(function (k) {
      const coba = kini ? kini + " " + k : k;
      if (ctx.measureText(coba).width > lebarMaks && kini) { baris.push(kini); kini = k; } else kini = coba;
    });
    if (kini) baris.push(kini);
    return baris;
  }

  let teksTerakhir = "";
  function tulisLayar(a, kalimat, nomor) {
    const kunci = nomor + "|" + kalimat;
    if (kunci === teksTerakhir) return;
    teksTerakhir = kunci;
    const ctx = ctxTeks;
    ctx.clearRect(0, 0, 1024, 576);
    // Judul adegan
    ctx.font = "700 30px Georgia, serif";
    const lebarJudul = ctx.measureText(a.judul).width + 44;
    ctx.fillStyle = a.malam ? "rgba(255,255,255,0.16)" : "rgba(255,255,255,0.85)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(32, 26, lebarJudul, 50, 25) : ctx.rect(32, 26, lebarJudul, 50);
    ctx.fill();
    ctx.fillStyle = a.malam ? "#f4d694" : "#3f6650";
    ctx.textBaseline = "middle";
    ctx.fillText(a.judul, 54, 52);
    // Kalimat narasi
    ctx.font = "600 30px 'Plus Jakarta Sans', Arial, sans-serif";
    const baris = pecahBaris(ctx, kalimat, 860);
    const tinggi = baris.length * 40 + 30;
    ctx.fillStyle = a.malam ? "rgba(20,26,58,0.55)" : "rgba(255,255,255,0.88)";
    ctx.beginPath();
    ctx.roundRect ? ctx.roundRect(60, 576 - tinggi - 26, 904, tinggi, 22) : ctx.rect(60, 576 - tinggi - 26, 904, tinggi);
    ctx.fill();
    ctx.fillStyle = a.malam ? "#ffffff" : "#2f4a3c";
    ctx.textAlign = "center";
    baris.forEach(function (b, i) { ctx.fillText(b, 512, 576 - tinggi - 26 + 35 + i * 40); });
    ctx.textAlign = "left";
    teksturTeks.needsUpdate = true;
  }

  /* ============ 5. SUARA: lonceng lembut tiap ganti adegan (narasi Lani menyusul) ============ */
  // Narasi suara orang dimatikan dulu. Setelah file suara Lani dipasang di assets/narasi/,
  // ubah PAKAI_NARASI menjadi true.
  const PAKAI_NARASI = false;
  const KUNCI_SUARA = "tv-suara";
  let suaraTV = true;
  try { suaraTV = localStorage.getItem(KUNCI_SUARA) !== "mati"; } catch (err) { /* diblokir */ }
  let menonton = false;

  const audio = new Audio();
  audio.preload = "none";
  // Panjang tiap adegan mengikuti rekaman bila sudah diketahui
  audio.addEventListener("loadedmetadata", function () {
    const a = ADEGAN[nomor];
    if (audio.dataset.nomor === String(nomor) && isFinite(audio.duration)) a.lama = Math.max(a.lama * 0.5, audio.duration);
  });

  // Lonceng lembut dibuat langsung oleh browser (Web Audio), tanpa file
  let konteks = null;
  function siapkanKonteks() {
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      if (!konteks) konteks = new AC();
      if (konteks.state === "suspended") konteks.resume().catch(function () {});
      return konteks;
    } catch (err) { return null; }
  }
  function lonceng(malam) {
    const k = siapkanKonteks();
    if (!k) return;
    const t = k.currentTime + 0.03;
    // Dua atau tiga nada tinggi yang memudar pelan, seperti lonceng angin kecil
    (malam ? [523.25, 659.25, 783.99] : [659.25, 987.77]).forEach(function (f, i) {
      [1, 2.01].forEach(function (kali, j) { // nada dasar + gema tipis di atasnya
        const o = k.createOscillator(), g = k.createGain();
        o.type = "sine";
        o.frequency.value = f * kali;
        const mulai = t + i * 0.18, keras = j ? 0.008 : 0.03;
        g.gain.setValueAtTime(0.0001, mulai);
        g.gain.exponentialRampToValueAtTime(keras, mulai + 0.03);
        g.gain.exponentialRampToValueAtTime(0.0001, mulai + 2.2);
        o.connect(g).connect(k.destination);
        o.start(mulai);
        o.stop(mulai + 2.3);
      });
    });
  }

  // HP (terutama iPhone) hanya mengizinkan suara yang dibuka lewat sentuhan pertama
  document.addEventListener("pointerdown", function buka() {
    document.removeEventListener("pointerdown", buka);
    siapkanKonteks();
    if (!PAKAI_NARASI) return;
    audio.muted = true;
    audio.src = ADEGAN[0].suara;
    audio.dataset.nomor = "0";
    const p = audio.play();
    if (p && p.then) p.then(function () { audio.pause(); audio.muted = false; }).catch(function () { audio.muted = false; });
    else audio.muted = false;
  });

  // Aplikasi ditinggal (pindah tab atau layar mati): suara berhenti
  document.addEventListener("visibilitychange", function () { if (document.hidden) audio.pause(); });

  function bolehBersuara() {
    return menonton && suaraTV && (typeof Suara === "undefined" || Suara.nyala());
  }

  function putarSuara(dariDetik) {
    if (!bolehBersuara()) { audio.pause(); return; }
    const a = ADEGAN[nomor];
    if (!dariDetik) lonceng(a.malam); // tanda adegan baru
    if (!PAKAI_NARASI) return;
    if (audio.dataset.nomor !== String(nomor)) {
      audio.src = a.suara;
      audio.dataset.nomor = String(nomor);
    }
    try { audio.currentTime = dariDetik || 0; } catch (err) { /* belum siap */ }
    const p = audio.play();
    if (p && p.catch) p.catch(function () { /* ditolak browser, video tetap jalan */ });
  }
  /* ============ 6. PEMUTAR ============ */
  let nomor = 0, waktuAdegan = 0, waktuTotal = 0;

  function ke(n) {
    adegan3D[nomor].grup.visible = false;
    nomor = n % ADEGAN.length;
    waktuAdegan = 0;
    adegan3D[nomor].grup.visible = true;
    scene.background = new THREE.Color(ADEGAN[nomor].latar);
    putarSuara(0);
  }

  function gambar() {
    const a = ADEGAN[nomor];
    const p = Math.min(1, waktuAdegan / a.lama);
    adegan3D[nomor].jalankan(waktuAdegan, p);
    // Kalimat yang tampil mengikuti kemajuan narasi (berdasarkan panjang kalimat)
    const total = a.teks.length;
    let jalan = 0, kalimat = a.kalimat[a.kalimat.length - 1];
    for (let i = 0; i < a.kalimat.length; i++) {
      jalan += a.kalimat[i].length;
      if (p * total <= jalan) { kalimat = a.kalimat[i]; break; }
    }
    tulisLayar(a, kalimat, nomor);
    // Pudar masuk di awal adegan
    const masuk = Math.min(1, waktuAdegan / 0.5);
    adegan3D[nomor].grup.scale.setScalar(0.92 + 0.08 * masuk);
    renderer.setRenderTarget(target);
    renderer.render(scene, kamera);
    renderer.setRenderTarget(null);
  }

  ke(0);
  gambar();

  return {
    tekstur: target.texture,
    perbarui: function (detik) {
      waktuAdegan += detik;
      waktuTotal += detik;
      if (menonton && !bolehBersuara() && !audio.paused) audio.pause(); // tombol suara global dimatikan
      if (waktuAdegan > ADEGAN[nomor].lama + JEDA) ke(nomor + 1);
      gambar();
    },
    tonton: function (ya) {
      menonton = ya;
      if (ya) ke(0); // duduk menonton: mulai dari awal dengan suara
      else audio.pause();
    },
    aturSuara: function (ya) {
      suaraTV = ya;
      try { localStorage.setItem(KUNCI_SUARA, ya ? "nyala" : "mati"); } catch (err) { /* diblokir */ }
      if (!ya) { audio.pause(); return; }
      if (bolehBersuara()) lonceng(ADEGAN[nomor].malam); // tanda suara menyala
      if (PAKAI_NARASI) putarSuara(Math.max(0.01, Math.min(waktuAdegan, ADEGAN[nomor].lama)));
    },
    suaraNyala: function () { return suaraTV; },
    ulang: function () { ke(0); gambar(); }
  };
}
