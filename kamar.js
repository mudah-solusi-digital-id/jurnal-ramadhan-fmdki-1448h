/* ==========================================================================
   kamar.js — Pintu dan kamar 3D (Three.js r128)

   Dipanggil index.html:
     const kamar = mulaiKamar({ ... });
     kamar.masuk();        membuka pintu dan berjalan masuk
     kamar.kembali();      kamera kembali setelah melihat dari dekat

   Sumbu (dalam meter): x = kiri-kanan, y = bawah-atas, z = dalam-luar.
   Kamar berukuran 6 x 6 meter, tinggi 3 meter. Pintu ada di z = 3.
   Benda yang membuka halaman: Al-Qur'an dan buku jurnal.
   Tempat yang bisa diduduki: bangku, kasur (duduk atau rebahan), sajadah.
     kamar.pose("kursi")   pindah pose; "berdiri" untuk kembali berjalan
   ========================================================================== */

function mulaiKamar(opsi) {
  const kanvas = opsi.kanvas;
  const kurangiGerak = opsi.kurangiGerak;
  const layarKecil = Math.min(window.innerWidth, window.innerHeight) < 600;

  /* ============ 1. DASAR: renderer, scene, kamera, cahaya ============ */
  const renderer = new THREE.WebGLRenderer({ canvas: kanvas, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, layarKecil ? 1.5 : 2));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xfff8f6);

  const kamera = new THREE.PerspectiveCamera(58, 1, 0.05, 40);
  kamera.rotation.order = "YXZ"; // menoleh dulu, baru menunduk atau mendongak

  const langit = new THREE.HemisphereLight(0xffffff, 0xfff5ee, 0.95);
  scene.add(langit);
  const matahari = new THREE.DirectionalLight(0xfff6e8, 0.16);
  matahari.position.set(1.5, 4, 3);
  scene.add(matahari);

  /* ============ 2. ALAT BANTU ============ */
  const W = { // palet pastel
    putih: 0xfffdfa, krem: 0xfdf3e7, kayu: 0xf3dfc4, kayuTua: 0xe3c49c,
    sage: 0xb7d3bc, sageMuda: 0xe2efe2, sageTua: 0x8fb89b,
    rose: 0xecc2d0, roseMuda: 0xf9e4eb, lav: 0xd3c7e6, lavMuda: 0xece6f4,
    madu: 0xefd3a0, emas: 0xdcb26b, biru: 0xcfe3ee
  };
  const simpananBahan = {};

  // Tekstur kanvas yang berulang. ukuran = berapa meter yang ditutup satu gambar.
  function teksturUlang(px, lukis, ulang) {
    const c = document.createElement("canvas");
    c.width = c.height = px;
    lukis(c.getContext("2d"), px);
    const t = new THREE.CanvasTexture(c);
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(ulang || 1, ulang || 1);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return t;
  }

  // Serat kayu tipis: garis bergelombang sedikit lebih gelap dari warna dasar
  function seratKayu(dasar, serat) {
    return teksturUlang(256, function (ctx, n) {
      ctx.fillStyle = dasar;
      ctx.fillRect(0, 0, n, n);
      ctx.strokeStyle = serat;
      for (let i = 0; i < 26; i++) {
        const y = (i + Math.random() * 0.6) * n / 26, fase = Math.random() * 6;
        ctx.globalAlpha = 0.18 + Math.random() * 0.22;
        ctx.lineWidth = 0.8 + Math.random() * 1.4;
        ctx.beginPath();
        for (let x = 0; x <= n; x += 8) ctx.lineTo(x, y + Math.sin(x / 40 + fase) * 2.2);
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    });
  }
  const BAHAN_KHUSUS = {}; // warna kayu memakai bahan bertekstur
  BAHAN_KHUSUS[W.kayu] = function () { return new THREE.MeshLambertMaterial({ map: seratKayu("#f3dfc4", "#c9a57a") }); };
  BAHAN_KHUSUS[W.kayuTua] = function () { return new THREE.MeshLambertMaterial({ map: seratKayu("#e3c49c", "#a87e52") }); };

  function bahan(warna) {
    if (!simpananBahan[warna]) {
      simpananBahan[warna] = BAHAN_KHUSUS[warna] ? BAHAN_KHUSUS[warna]() : new THREE.MeshLambertMaterial({ color: warna });
    }
    return simpananBahan[warna];
  }

  // Warna boleh angka (0xffffff) atau bahan jadi
  function mesh(induk, geo, warna, x, y, z) {
    const m = new THREE.Mesh(geo, typeof warna === "number" ? bahan(warna) : warna);
    m.position.set(x, y, z);
    induk.add(m);
    return m;
  }

  function kotak(induk, warna, l, t, d, x, y, z) {
    return mesh(induk, new THREE.BoxGeometry(l, t, d), warna, x, y, z);
  }

  function tabung(induk, warna, jariAtas, jariBawah, t, x, y, z) {
    return mesh(induk, new THREE.CylinderGeometry(jariAtas, jariBawah, t, 24), warna, x, y, z);
  }

  function bola(induk, warna, jari, x, y, z) {
    return mesh(induk, new THREE.SphereGeometry(jari, 20, 14), warna, x, y, z);
  }

  function batang(induk, warna, jari, a, b) {
    const dari = new THREE.Vector3().fromArray(a);
    const arah = new THREE.Vector3().fromArray(b).sub(dari);
    const m = tabung(induk, warna, jari, jari, arah.length(), 0, 0, 0);
    m.position.copy(dari).addScaledVector(arah, 0.5);
    m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), arah.normalize());
    return m;
  }

  function grup(induk, x, y, z, putarY) {
    const g = new THREE.Group();
    g.position.set(x, y, z);
    g.rotation.y = putarY || 0;
    induk.add(g);
    return g;
  }

  function bentukBulat(l, t, r) {
    const a = l / 2, b = t / 2, s = new THREE.Shape();
    s.moveTo(-a + r, -b); s.lineTo(a - r, -b); s.quadraticCurveTo(a, -b, a, -b + r);
    s.lineTo(a, b - r); s.quadraticCurveTo(a, b, a - r, b);
    s.lineTo(-a + r, b); s.quadraticCurveTo(-a, b, -a, b - r);
    s.lineTo(-a, -b + r); s.quadraticCurveTo(-a, -b, -a + r, -b);
    return s;
  }

  function tebalkan(bentuk, tebal) {
    const g = new THREE.ExtrudeGeometry(bentuk, { depth: tebal, bevelEnabled: false, curveSegments: 14 });
    g.translate(0, 0, -tebal / 2);
    return g;
  }

  function papan(induk, warna, l, t, d, r, x, y, z) {
    return mesh(induk, tebalkan(bentukBulat(l, t, r), d), warna, x, y, z);
  }

  // Papan yang direbahkan (meja, kasur, karpet)
  function rebah(induk, warna, l, dalam, tebal, r, x, y, z) {
    const m = papan(induk, warna, l, dalam, tebal, r, x, y, z);
    m.rotation.x = -Math.PI / 2;
    return m;
  }

  // Lukisan canvas 2D menjadi bahan 3D
  function lukisan(l, t, lukis) {
    const c = document.createElement("canvas");
    c.width = l;
    c.height = t;
    lukis(c.getContext("2d"), l, t);
    const tekstur = new THREE.CanvasTexture(c);
    tekstur.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return new THREE.MeshBasicMaterial({ map: tekstur });
  }

  function bidang(induk, material, l, t, x, y, z) {
    return mesh(induk, new THREE.PlaneGeometry(l, t), material, x, y, z);
  }

  const teksturTitik = lukisan(64, 64, function (ctx) {
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
  }).map;

  function cahayaLembut(induk, warna, pekat, l, t, x, y, z) {
    return bidang(induk, new THREE.MeshBasicMaterial({
      map: teksturTitik, color: warna, transparent: true, opacity: pekat, depthWrite: false
    }), l, t, x, y, z);
  }

  // Bayangan lembut di lantai: lapisan lebar yang samar + lapisan kecil yang lebih pekat di tengah
  function bayangan(x, z, l, d) {
    const m = cahayaLembut(scene, 0xb59f86, 0.32, l * 1.15, d * 1.15, x, 0.021, z);
    m.rotation.x = -Math.PI / 2;
    const inti = cahayaLembut(scene, 0x9c8266, 0.3, l * 0.75, d * 0.75, x, 0.022, z);
    inti.rotation.x = -Math.PI / 2;
  }

  function bentukSabit(R) {
    const r = R * 0.8, geser = R * 0.37;
    const x = (R * R - r * r + geser * geser) / (2 * geser), y = Math.sqrt(R * R - x * x);
    const a = Math.atan2(y, x), b = Math.atan2(y, x - geser), s = new THREE.Shape();
    s.absarc(0, 0, R, a, Math.PI * 2 - a, false);
    s.absarc(geser, 0, r, -b, b, true);
    return s;
  }

  function bentukBintang(luar, dalam) {
    const s = new THREE.Shape();
    for (let i = 0; i < 16; i++) {
      const j = i % 2 ? dalam : luar, a = (i / 16) * Math.PI * 2;
      if (i === 0) s.moveTo(j, 0); else s.lineTo(Math.cos(a) * j, Math.sin(a) * j);
    }
    s.closePath();
    return s;
  }

  function logo(induk, data, l, rasio, x, y, z) {
    if (typeof data !== "string") return;
    const t = new THREE.TextureLoader().load(data, gambarUlang);
    t.anisotropy = renderer.capabilities.getMaxAnisotropy();
    bidang(induk, new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false }), l, l / rasio, x, y, z);
  }

  const LOGO_F = typeof LOGO_FMDKI === "string" ? LOGO_FMDKI : null;
  const LOGO_K = typeof LOGO_KARIMAH === "string" ? LOGO_KARIMAH : null;
  const RASIO_F = 900 / 305, RASIO_K = 900 / 251;

  // Angka acak yang selalu sama, supaya susunan buku tidak berubah-ubah
  let benih = 7;
  function acak() {
    benih = (benih * 16807) % 2147483647;
    return benih / 2147483647;
  }

  /* ============ 3. BANGUNAN: lantai, dinding, langit-langit ============ */
  const lantai = lukisan(512, 512, function (ctx, l, t) {
    ctx.fillStyle = "#f8ecdd";
    ctx.fillRect(0, 0, l, t);
    for (let i = 0; i < 8; i++) {
      ctx.fillStyle = i % 2 ? "#f5e6d3" : "#faf0e3";
      ctx.fillRect(i * 64, 0, 62, t);
      ctx.fillStyle = "#ecd9c0";
      ctx.fillRect(i * 64, ((i * 211) % 400) + 40, 62, 2);
    }
  });
  bidang(scene, lantai, 6, 6, 0, 0, 0).rotation.x = -Math.PI / 2;
  bidang(scene, bahan(W.putih), 6, 6, 0, 3, 0).rotation.x = Math.PI / 2;

  // Dinding belakang berlubang untuk jendela
  const JENDELA = { x: 0, y: 1.82, l: 2.3, t: 1.25 };
  const dindingBelakang = new THREE.Shape();
  dindingBelakang.moveTo(-3, 0); dindingBelakang.lineTo(3, 0);
  dindingBelakang.lineTo(3, 3); dindingBelakang.lineTo(-3, 3); dindingBelakang.closePath();
  const lubang = new THREE.Path();
  const jx = JENDELA.l / 2, jb = JENDELA.y - JENDELA.t / 2, ja = JENDELA.y + JENDELA.t / 2;
  lubang.moveTo(-jx, jb); lubang.lineTo(-jx, ja); lubang.lineTo(jx, ja); lubang.lineTo(jx, jb); lubang.closePath();
  dindingBelakang.holes.push(lubang);
  mesh(scene, new THREE.ShapeGeometry(dindingBelakang), 0xf6ede1, 0, 0, -3);

  const kiri = bidang(scene, bahan(0xfbeff2), 6, 3, -3, 1.5, 0);
  kiri.rotation.y = Math.PI / 2;
  const kanan = bidang(scene, bahan(0xf4f1fa), 6, 3, 3, 1.5, 0);
  kanan.rotation.y = -Math.PI / 2;

  // Lis bawah dinding
  kotak(scene, W.putih, 6, 0.12, 0.04, 0, 0.06, -2.98);
  kotak(scene, W.putih, 0.04, 0.12, 6, -2.98, 0.06, 0);
  kotak(scene, W.putih, 0.04, 0.12, 6, 2.98, 0.06, 0);

  // Dinding depan: warna rose di luar, krem di dalam. Di tengahnya lubang pintu.
  const LEBAR_PINTU = 1.12, TINGGI_PINTU = 2.25;
  const luarDalam = [0xfbe6ec, 0xfbe6ec, 0xfbe6ec, 0xfbe6ec, 0xfbe6ec, 0xfdf6ee].map(bahan);
  kotak(scene, luarDalam, 7, 6, 0.12, -LEBAR_PINTU / 2 - 3.5, 3, 3.06);
  kotak(scene, luarDalam, 7, 6, 0.12, LEBAR_PINTU / 2 + 3.5, 3, 3.06);
  kotak(scene, luarDalam, LEBAR_PINTU + 0.02, 6 - TINGGI_PINTU, 0.12, 0, TINGGI_PINTU + (6 - TINGGI_PINTU) / 2, 3.06);

  /* ============ 4. DEPAN PINTU ============ */
  const luar = grup(scene, 0, 0, 0);
  bidang(luar, bahan(0xf6ece2), 16, 8, 0, -0.005, 7.06).rotation.x = -Math.PI / 2;

  // Lengkung pastel di sekeliling pintu
  function lengkung(warna, l, t, z) {
    const s = new THREE.Shape();
    s.moveTo(-l / 2, 0); s.lineTo(-l / 2, t - l / 2);
    s.absarc(0, t - l / 2, l / 2, Math.PI, 0, true);
    s.lineTo(l / 2, 0); s.closePath();
    const h = new THREE.Path();
    h.moveTo(-LEBAR_PINTU / 2, 0); h.lineTo(LEBAR_PINTU / 2, 0);
    h.lineTo(LEBAR_PINTU / 2, TINGGI_PINTU); h.lineTo(-LEBAR_PINTU / 2, TINGGI_PINTU); h.closePath();
    s.holes.push(h);
    mesh(luar, new THREE.ShapeGeometry(s, 40), warna, 0, 0, z);
  }
  lengkung(W.lavMuda, 2.9, 3.35, 3.13);
  lengkung(W.sageMuda, 2.3, 3.05, 3.14);
  lengkung(0xfdf1dc, 1.75, 2.8, 3.15);

  // Kusen
  kotak(luar, W.putih, 0.1, TINGGI_PINTU + 0.1, 0.2, -LEBAR_PINTU / 2 - 0.05, TINGGI_PINTU / 2 + 0.05, 3.08);
  kotak(luar, W.putih, 0.1, TINGGI_PINTU + 0.1, 0.2, LEBAR_PINTU / 2 + 0.05, TINGGI_PINTU / 2 + 0.05, 3.08);
  kotak(luar, W.putih, LEBAR_PINTU + 0.2, 0.1, 0.2, 0, TINGGI_PINTU + 0.05, 3.08);

  // Daun pintu berputar pada engsel kiri
  const pintu = grup(scene, -LEBAR_PINTU / 2, 0, 3.06);
  const tengahPintu = LEBAR_PINTU / 2;
  kotak(pintu, W.sage, LEBAR_PINTU - 0.02, TINGGI_PINTU - 0.02, 0.07, tengahPintu, TINGGI_PINTU / 2, 0);
  [0.04, -0.04].forEach(function (z) {
    papan(pintu, W.sageMuda, 0.8, 0.78, 0.02, 0.06, tengahPintu, 0.58, z);
    papan(pintu, W.sageMuda, 0.8, 0.95, 0.02, 0.06, tengahPintu, 1.6, z);
    bola(pintu, W.emas, 0.05, LEBAR_PINTU - 0.13, 1.06, z * 2.2);
  });

  // Hiasan pintu: lingkaran daun, bulan sabit, papan salam
  const karangan = grup(pintu, tengahPintu, 1.68, 0.07);
  mesh(karangan, new THREE.TorusGeometry(0.27, 0.022, 8, 40), W.kayuTua, 0, 0, 0);
  for (let i = 0; i < 22; i++) {
    const a = (i / 22) * Math.PI * 2;
    const daun = bola(karangan, i % 3 ? W.sageTua : W.rose, 0.045, Math.cos(a) * 0.27, Math.sin(a) * 0.27, 0.02);
    daun.scale.set(1.3, 0.6, 0.5);
    daun.rotation.z = a + 0.8;
  }
  mesh(karangan, tebalkan(bentukSabit(0.14), 0.03), W.emas, 0, 0, 0.02);
  papan(pintu, W.putih, 0.72, 0.2, 0.02, 0.05, tengahPintu, 1.22, 0.06);
  bidang(pintu, lukisan(512, 142, function (ctx, l, t) {
    ctx.fillStyle = "#fffdfa";
    ctx.fillRect(0, 0, l, t);
    ctx.fillStyle = "#3f6650";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "italic 60px Georgia, serif";
    ctx.fillText("Assalamu'alaikum", l / 2, t / 2);
  }), 0.68, 0.18, tengahPintu, 1.22, 0.072);

  // Keset, sandal, pot, lentera
  rebah(luar, W.roseMuda, 1.3, 0.62, 0.03, 0.1, 0, 0.015, 3.65);
  rebah(luar, W.rose, 1.1, 0.44, 0.034, 0.08, 0, 0.016, 3.65);
  [-0.98, -0.8].forEach(function (x) {
    const s = rebah(luar, W.lav, 0.12, 0.3, 0.04, 0.055, x, 0.03, 3.5);
    s.rotation.z = -0.08;
    kotak(luar, W.emas, 0.11, 0.03, 0.04, x, 0.07, 3.48);
  });
  const daunGoyang = []; // daun tanaman yang bergoyang pelan (diatur di loop)
  function catatDaun(daun) {
    daunGoyang.push({ m: daun, x: daun.rotation.x, z: daun.rotation.z, fase: daunGoyang.length * 0.9 });
  }
  function pot(induk, x, z, skala, warna) {
    const p = grup(induk, x, 0, z);
    p.scale.setScalar(skala);
    if (induk === scene) bayangan(x, z, 0.55 * skala, 0.55 * skala);
    tabung(p, warna, 0.2, 0.15, 0.34, 0, 0.17, 0);
    tabung(p, W.putih, 0.215, 0.215, 0.05, 0, 0.34, 0);
    for (let i = 0; i < 11; i++) {
      const a = i * 2.4, j = 0.06 + (i % 3) * 0.06;
      const daun = bola(p, i % 2 ? W.sageTua : W.sage, 0.11, Math.cos(a) * j, 0.5 + i * 0.045, Math.sin(a) * j);
      daun.scale.set(0.7, 1.7, 0.4);
      daun.rotation.set(Math.sin(a) * 0.7, a, Math.cos(a) * -0.7);
      catatDaun(daun);
    }
  }
  pot(luar, 1.12, 3.5, 1, W.madu);
  pot(luar, 1.55, 3.7, 0.7, W.rose);

  function lentera(induk, x, y, z) {
    const g = grup(induk, x, y, z);
    batang(g, W.kayuTua, 0.008, [0, 0.18, 0], [0, 0.7, 0]);
    mesh(g, new THREE.ConeGeometry(0.11, 0.12, 6), W.emas, 0, 0.15, 0);
    tabung(g, new THREE.MeshBasicMaterial({ color: 0xfff1cf }), 0.1, 0.075, 0.2, 0, 0, 0);
    tabung(g, W.emas, 0.085, 0.085, 0.03, 0, -0.11, 0);
    cahayaLembut(g, 0xffe3a3, 0.5, 0.8, 0.8, 0, 0, -0.02);
  }
  lentera(luar, -1.12, 1.95, 3.35);
  lentera(luar, 1.12, 1.95, 3.35);

  // Untaian bintang di atas pintu
  function untaian(induk, dari, ke, turun, jumlah, skala) {
    const a = new THREE.Vector3().fromArray(dari), b = new THREE.Vector3().fromArray(ke);
    const titik = [];
    for (let i = 0; i <= jumlah; i++) {
      const t = i / jumlah, p = a.clone().lerp(b, t);
      p.y -= Math.sin(t * Math.PI) * turun;
      titik.push(p);
    }
    for (let i = 0; i < jumlah; i++) batang(induk, W.kayuTua, 0.006, titik[i].toArray(), titik[i + 1].toArray());
    const geo = tebalkan(bentukBintang(0.07 * skala, 0.045 * skala), 0.015);
    const terang = new THREE.MeshBasicMaterial({ color: 0xf4d694 });
    terang.userData.tetapTerang = true; // untaian bintang tetap menyala saat lampu dimatikan
    for (let i = 1; i < jumlah; i++) {
      const s = mesh(induk, geo, terang, titik[i].x, titik[i].y - 0.07 * skala, titik[i].z);
      s.lookAt(0, titik[i].y, i % 2 ? 0.5 : -0.2);
    }
  }
  untaian(luar, [-2.1, 3.25, 3.3], [2.1, 3.25, 3.3], 0.28, 12, 1.2);

  /* ============ 5. JENDELA DAN PEMANDANGAN HIJAU ============ */
  // Pemandangan dilukis di dinding tabung melengkung di luar jendela,
  // jadi tetap utuh saat melongok ke kiri, kanan, atas, dan bawah.
  const LUAR = { r: 4.2, tinggi: 11, bawah: -3 };
  const pemandangan = lukisan(3072, 1152, function (ctx, l, t) {
    const cakrawala = t * (LUAR.bawah + LUAR.tinggi - 1.6) / LUAR.tinggi; // setinggi mata
    const langitLuar = ctx.createLinearGradient(0, 0, 0, cakrawala);
    langitLuar.addColorStop(0, "#9fd3ee");
    langitLuar.addColorStop(0.55, "#c3e4f2");
    langitLuar.addColorStop(1, "#fdf6e4");
    ctx.fillStyle = langitLuar;
    ctx.fillRect(0, 0, l, t);
    const sinar = ctx.createRadialGradient(l * 0.6, cakrawala - 230, 0, l * 0.6, cakrawala - 230, 280);
    sinar.addColorStop(0, "rgba(255,246,214,1)");
    sinar.addColorStop(1, "rgba(255,246,214,0)");
    ctx.fillStyle = sinar;
    ctx.fillRect(0, 0, l, t);

    // Awan
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    for (let i = 0; i < 16; i++) {
      const x = acak() * l, y = 120 + acak() * (cakrawala - 300), s = 0.7 + acak() * 0.8;
      [[0, 0, 34], [38, 8, 26], [-38, 8, 26], [70, 14, 16], [-66, 14, 14]].forEach(function (b) {
        ctx.beginPath();
        ctx.arc(x + b[0] * s, y + b[1] * s, b[2] * s, 0, 7);
        ctx.fill();
      });
    }

    // Bukit berlapis: makin dekat makin hijau
    function bukit(y, tinggi, panjang, geser, atas, bawah) {
      const g = ctx.createLinearGradient(0, y - tinggi, 0, t);
      g.addColorStop(0, atas);
      g.addColorStop(1, bawah);
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(0, t);
      for (let x = 0; x <= l; x += 8) {
        ctx.lineTo(x, y - Math.sin(x / panjang + geser) * tinggi - Math.sin(x / (panjang * 0.37) + geser) * tinggi * 0.25);
      }
      ctx.lineTo(l, t);
      ctx.fill();
    }
    bukit(cakrawala + 6, 80, 230, 0.4, "#bfdcc6", "#aed3b6");
    bukit(cakrawala + 40, 60, 180, 2.1, "#9dcc9c", "#8cc18c");
    bukit(cakrawala + 80, 44, 260, 4.0, "#84bf80", "#72b270");

    // Danau tenang
    ctx.fillStyle = "rgba(214,236,243,0.95)";
    ctx.beginPath();
    ctx.ellipse(l * 0.5, cakrawala + 100, 460, 30, -0.02, 0, 7);
    ctx.fill();
    ctx.fillStyle = "rgba(255,255,255,0.6)";
    ctx.fillRect(l * 0.5 - 180, cakrawala + 94, 140, 3);
    ctx.fillRect(l * 0.5 + 20, cakrawala + 106, 170, 3);

    bukit(cakrawala + 150, 24, 300, 1.0, "#86c07e", "#66a868");

    function pohon(x, y, s, warna) {
      ctx.fillStyle = "#b08d6b";
      ctx.fillRect(x - 5 * s, y - 34 * s, 10 * s, 40 * s);
      warna.forEach(function (w, i) {
        ctx.fillStyle = w;
        [[0, -84], [-28, -58], [28, -58], [0, -50]].forEach(function (b) {
          ctx.beginPath();
          ctx.arc(x + (b[0] - i * 5) * s, y + (b[1] - i * 7) * s, (32 - i * 8) * s, 0, 7);
          ctx.fill();
        });
      });
    }
    for (let i = 0; i < 14; i++) {
      const x = (i + 0.3 + acak() * 0.4) / 14 * l;
      if (Math.abs(x - l * 0.5) < 380) continue; // danau tetap terlihat
      const jauh = i % 3 === 1;
      pohon(x, cakrawala + (jauh ? 110 : 160 + acak() * 40), jauh ? 0.8 : 1.3 + acak() * 0.5,
        jauh ? ["#70ad72", "#8cc389"] : ["#5f9f66", "#7ab77a"]);
    }

    // Rumput dan bunga kecil
    for (let i = 0; i < 1800; i++) {
      const x = acak() * l, y = cakrawala + 150 + acak() * (t - cakrawala - 150);
      ctx.strokeStyle = i % 2 ? "#6aa76c" : "#8fc78a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + (acak() - 0.5) * 8, y - 10 - acak() * 10);
      ctx.stroke();
    }
    ["#ffffff", "#f5cfdb", "#f7e2a8", "#d9cdee"].forEach(function (w) {
      ctx.fillStyle = w;
      for (let i = 0; i < 130; i++) {
        ctx.beginPath();
        ctx.arc(acak() * l, cakrawala + 150 + acak() * (t - cakrawala - 160), 3 + acak() * 2.5, 0, 7);
        ctx.fill();
      }
    });
  });
  pemandangan.side = THREE.BackSide; // dilihat dari dalam tabung
  pemandangan.map.wrapS = THREE.RepeatWrapping;
  pemandangan.map.repeat.x = -1; // dari dalam gambar terbalik, dibalik lagi
  mesh(scene, new THREE.CylinderGeometry(LUAR.r, LUAR.r, LUAR.tinggi, 72, 1, true, Math.PI / 2, Math.PI),
    pemandangan, 0, LUAR.bawah + LUAR.tinggi / 2, -3);

  const jendela = grup(scene, JENDELA.x, JENDELA.y, -2.97);
  kotak(jendela, W.putih, JENDELA.l + 0.16, 0.08, 0.12, 0, JENDELA.t / 2, 0);
  kotak(jendela, W.putih, JENDELA.l + 0.3, 0.07, 0.24, 0, -JENDELA.t / 2, 0.06);
  [-1, 1].forEach(function (s) { kotak(jendela, W.putih, 0.08, JENDELA.t, 0.12, s * JENDELA.l / 2, 0, 0); });

  // Dua daun jendela kaca, berengsel di sisi kiri dan kanan, terbuka ke luar
  const kaca = new THREE.MeshBasicMaterial({ color: 0xdff1f8, transparent: true, opacity: 0.18, depthWrite: false, side: THREE.DoubleSide });
  const daunJendela = [-1, 1].map(function (s) {
    const d = grup(jendela, s * (JENDELA.l / 2 - 0.04), 0, -0.01);
    const lebar = JENDELA.l / 2 - 0.04, tengah = -s * lebar / 2;
    kotak(d, W.putih, lebar, 0.04, 0.04, tengah, JENDELA.t / 2 - 0.06, 0);
    kotak(d, W.putih, lebar, 0.04, 0.04, tengah, -JENDELA.t / 2 + 0.02, 0);
    kotak(d, W.putih, 0.04, JENDELA.t - 0.06, 0.04, -s * (lebar - 0.02), -0.02, 0);
    kotak(d, W.putih, lebar, 0.03, 0.03, tengah, 0.18, 0);
    bidang(d, kaca, lebar - 0.04, JENDELA.t - 0.1, tengah, -0.02, 0);
    bola(d, W.emas, 0.022, -s * (lebar - 0.07), -0.05, 0.03); // gagang
    d.userData.arah = s;
    return d;
  });

  // Tirai lavender: lipatan dari tabung berjajar
  batang(jendela, W.kayuTua, 0.02, [-1.75, 0.86, 0.12], [1.75, 0.86, 0.12]);
  const tirai = [];
  [-1, 1].forEach(function (s) {
    for (let i = 0; i < 7; i++) {
      const lipat = tabung(jendela, i % 2 ? W.lavMuda : W.lav, 0.045, 0.055, 1.72, s * (1.18 + i * 0.075), 0, 0.12);
      lipat.scale.z = 0.7;
      tirai.push(lipat);
    }
    const ikat = kotak(jendela, W.rose, 0.56, 0.06, 0.12, s * 1.4, -0.2, 0.13);
    ikat.rotation.z = s * 0.06;
  });

  /* ============ 6. MEJA BELAJAR DI DEPAN JENDELA ============ */
  const meja = grup(scene, 0, 0, -2.45);
  bayangan(0, -2.4, 2.9, 1.5);
  rebah(meja, W.kayu, 2.5, 0.95, 0.06, 0.07, 0, 0.77, 0);
  [[-1.12, -0.36], [-1.12, 0.36]].forEach(function (p) { batang(meja, W.kayuTua, 0.03, [p[0], 0, p[1]], [p[0], 0.74, p[1]]); });
  kotak(meja, W.roseMuda, 0.5, 0.72, 0.82, 0.94, 0.37, 0);
  [0.18, 0.4, 0.61].forEach(function (y) {
    papan(meja, W.putih, 0.42, 0.18, 0.02, 0.03, 0.94, y, 0.42);
    bola(meja, W.emas, 0.018, 0.94, y, 0.44);
  });

  // Laptop
  const laptop = grup(meja, -0.66, 0.8, -0.08, 0.3);
  rebah(laptop, W.lavMuda, 0.5, 0.34, 0.02, 0.03, 0, 0.01, 0.04);
  const layar = grup(laptop, 0, 0.02, -0.13);
  layar.rotation.x = -0.22;
  papan(layar, W.lav, 0.5, 0.34, 0.015, 0.03, 0, 0.17, 0);
  bidang(layar, lukisan(512, 340, function (ctx, l, t) {
    const g = ctx.createLinearGradient(0, 0, l, t);
    g.addColorStop(0, "#f6f1fb");
    g.addColorStop(1, "#fdf3f6");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, l, t);
    ctx.fillStyle = "#3f6650";
    ctx.textAlign = "center";
    ctx.font = "italic 48px Georgia, serif";
    ctx.fillText("Space to Breathe", l / 2, t * 0.5);
    ctx.font = "26px sans-serif";
    ctx.fillText("KARIMAH 2027", l / 2, t * 0.68);
  }), 0.45, 0.29, 0, 0.17, 0.01);

  // Lampu belajar
  const lampu = grup(meja, 0.98, 0.8, -0.18);
  tabung(lampu, W.rose, 0.11, 0.13, 0.03, 0, 0.015, 0);
  batang(lampu, W.putih, 0.014, [0, 0.03, 0], [0.06, 0.42, 0]);
  batang(lampu, W.putih, 0.014, [0.06, 0.42, 0], [-0.22, 0.64, 0.06]);
  bola(lampu, W.emas, 0.025, 0.06, 0.42, 0);
  const kap = grup(lampu, -0.25, 0.61, 0.07);
  kap.rotation.z = -0.45;
  const bahanKap = new THREE.MeshLambertMaterial({ color: W.rose, side: THREE.DoubleSide });
  mesh(kap, new THREE.CylinderGeometry(0.035, 0.125, 0.14, 28, 1, true), bahanKap, 0, -0.05, 0);
  bola(kap, new THREE.MeshBasicMaterial({ color: 0xfff1cc }), 0.045, 0, -0.1, 0);
  cahayaLembut(lampu, 0xffe0a0, 0.45, 1, 1, -0.3, 0.45, 0.1);
  const sinarLampu = new THREE.PointLight(0xffe2b0, 0.35, 2.2);
  sinarLampu.position.set(-0.3, 0.5, 0.15);
  lampu.add(sinarLampu);

  // Tempat pulpen
  const wadah = grup(meja, 0.62, 0.8, -0.26);
  tabung(wadah, W.sage, 0.06, 0.055, 0.14, 0, 0.07, 0);
  [[W.rose, -0.03, 0.1], [W.emas, 0.02, -0.12], [W.lav, 0.035, 0.16], [W.sageTua, -0.01, -0.05], [W.putih, 0.005, 0.22]].forEach(function (p, i) {
    batang(wadah, p[0], 0.008, [p[1], 0.06, (i - 2) * 0.012], [p[1] + p[2] * 0.4, 0.25 + i * 0.012, (i - 2) * 0.025]);
  });

  // Buku berdiri di ujung kiri meja
  const WARNA_BUKU = [W.sage, W.rose, W.lav, W.madu, W.roseMuda, W.sageTua, W.biru, W.lavMuda];
  function barisBuku(induk, x, y, z, panjang, tinggi, dalam) {
    let posisi = x;
    while (posisi < x + panjang - 0.05) {
      const tebal = 0.03 + acak() * 0.035, t = tinggi * (0.75 + acak() * 0.25);
      const w = WARNA_BUKU[Math.floor(acak() * WARNA_BUKU.length)];
      kotak(induk, w, tebal, t, dalam, posisi + tebal / 2, y + t / 2, z);
      kotak(induk, W.putih, tebal + 0.002, 0.02, dalam * 0.6, posisi + tebal / 2, y + t * 0.75, z + dalam * 0.21);
      posisi += tebal + 0.004;
    }
  }
  barisBuku(meja, -1.2, 0.8, -0.3, 0.36, 0.26, 0.18);
  kotak(meja, W.emas, 0.02, 0.18, 0.16, -0.82, 0.89, -0.3);

  // Cangkir dan buku bertumpuk
  tabung(meja, W.roseMuda, 0.05, 0.042, 0.1, 0.42, 0.85, -0.18);
  mesh(meja, new THREE.TorusGeometry(0.032, 0.009, 8, 20), W.roseMuda, 0.475, 0.85, -0.18);
  [[W.lav, 0.3], [W.madu, 0.27], [W.sage, 0.24]].forEach(function (b, i) {
    rebah(meja, b[0], b[1], 0.2, 0.04, 0.01, 0.7, 0.82 + i * 0.042, 0.2).rotation.z = 0.15 - i * 0.1;
  });

  // Bangku
  const bangku = grup(scene, 0.72, 0, -1.55);
  bayangan(0.72, -1.55, 0.9, 0.8);
  tabung(bangku, W.rose, 0.24, 0.24, 0.1, 0, 0.5, 0);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + 0.78;
    batang(bangku, W.kayuTua, 0.02, [Math.cos(a) * 0.15, 0.46, Math.sin(a) * 0.15], [Math.cos(a) * 0.23, 0, Math.sin(a) * 0.23]);
  }

  /* ============ 7. BENDA 1: BUKU JURNAL ============ */
  const jurnal = grup(meja, 0.02, 0.8, 0.14);
  kotak(jurnal, W.kayuTua, 0.34, 0.04, 0.16, 0, 0.02, 0);
  const bukuJurnal = grup(jurnal, 0, 0.04, 0.02);
  bukuJurnal.rotation.x = -0.3;
  papan(bukuJurnal, W.sage, 0.36, 0.48, 0.018, 0.02, 0, 0.24, 0.03);
  kotak(bukuJurnal, W.putih, 0.33, 0.45, 0.045, 0, 0.24, 0);
  papan(bukuJurnal, W.sage, 0.36, 0.48, 0.018, 0.02, 0, 0.24, -0.03);
  papan(bukuJurnal, W.emas, 0.315, 0.435, 0.006, 0.015, 0, 0.24, 0.041);
  papan(bukuJurnal, W.putih, 0.3, 0.42, 0.006, 0.012, 0, 0.24, 0.044);
  logo(bukuJurnal, LOGO_F, 0.25, RASIO_F, 0, 0.33, 0.049);
  logo(bukuJurnal, LOGO_K, 0.25, RASIO_K, 0, 0.2, 0.049);
  kotak(bukuJurnal, W.rose, 0.02, 0.1, 0.006, 0.1, -0.02, 0);
  // Pulpen di depan buku
  batang(meja, W.sageTua, 0.011, [-0.17, 0.812, 0.37], [0.13, 0.812, 0.34]);
  mesh(meja, new THREE.ConeGeometry(0.011, 0.04, 12), W.emas, 0.15, 0.812, 0.338).rotation.z = -Math.PI / 2;

  /* ============ 7b. BUKU CATATAN TERBUKA: bisa dicoret dengan jari ============ */
  const BUKU = { l: 0.38, d: 0.27, kanvasL: 1024, kanvasT: 728 };
  const bukuTulis = grup(meja, -0.45, 0.8, 0.3);
  rebah(bukuTulis, W.rose, BUKU.l + 0.02, BUKU.d + 0.02, 0.012, 0.012, 0, 0.006, 0); // sampul
  rebah(bukuTulis, W.putih, BUKU.l, BUKU.d, 0.012, 0.006, 0, 0.018, 0);              // tumpukan kertas
  const kertas = lukisan(BUKU.kanvasL, BUKU.kanvasT, function (ctx, l, t) {
    ctx.fillStyle = "#fffdf6";
    ctx.fillRect(0, 0, l, t);
    const lipat = ctx.createLinearGradient(l / 2 - 40, 0, l / 2 + 40, 0); // bayangan lipatan tengah
    lipat.addColorStop(0, "rgba(200,180,160,0)");
    lipat.addColorStop(0.5, "rgba(200,180,160,0.35)");
    lipat.addColorStop(1, "rgba(200,180,160,0)");
    ctx.fillStyle = lipat;
    ctx.fillRect(l / 2 - 40, 0, 80, t);
    ctx.fillStyle = "#e4dcf0"; // garis bergaris
    for (let y = 86; y < t - 24; y += 34) { ctx.fillRect(30, y, l / 2 - 60, 2); ctx.fillRect(l / 2 + 30, y, l / 2 - 60, 2); }
    ctx.fillStyle = "#f3c6d4"; // garis margin
    ctx.fillRect(78, 20, 2, t - 40);
    ctx.fillRect(l / 2 + 78, 20, 2, t - 40);
    ctx.fillStyle = "#b9a7d6";
    ctx.font = "italic 24px Georgia, serif";
    ctx.fillText("Catatan bebasku", 96, 54);
  });
  const halamanBuku = mesh(bukuTulis, new THREE.PlaneGeometry(BUKU.l, BUKU.d), kertas, 0, 0.0245, 0);
  halamanBuku.rotation.x = -Math.PI / 2;

  // Lapisan tinta transparan di atas kertas. Yang disimpan di HP hanya lapisan ini.
  const kanvasTinta = document.createElement("canvas");
  kanvasTinta.width = BUKU.kanvasL;
  kanvasTinta.height = BUKU.kanvasT;
  const ctxTinta = kanvasTinta.getContext("2d");
  const teksturTinta = new THREE.CanvasTexture(kanvasTinta);
  teksturTinta.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const bahanTinta = new THREE.MeshBasicMaterial({ map: teksturTinta, transparent: true, depthWrite: false });
  mesh(bukuTulis, new THREE.PlaneGeometry(BUKU.l, BUKU.d), bahanTinta, 0, 0.0255, 0).rotation.x = -Math.PI / 2;
  const KUNCI_CORETAN = "kamar-coretan-buku";
  try {
    const simpanan = localStorage.getItem(KUNCI_CORETAN);
    if (simpanan) {
      const img = new Image();
      img.onload = function () { ctxTinta.drawImage(img, 0, 0); teksturTinta.needsUpdate = true; gambarUlang(); };
      img.src = simpanan;
    }
  } catch (err) { /* penyimpanan diblokir */ }

  /* ============ 8. BENDA 2: AL-QUR'AN DI POJOK SHALAT ============ */
  const pojok = grup(scene, 2.2, 0, -2.2, -0.62);
  bayangan(2.2, -2.15, 1.7, 1.5);
  papan(pojok, W.putih, 0.95, 0.8, 0.5, 0.05, 0, 0.42, 0);
  papan(pojok, W.sageMuda, 0.38, 0.6, 0.02, 0.04, -0.22, 0.42, 0.25);
  papan(pojok, W.sageMuda, 0.38, 0.6, 0.02, 0.04, 0.22, 0.42, 0.25);
  [-0.07, 0.07].forEach(function (x) { bola(pojok, W.emas, 0.02, x, 0.44, 0.275); });
  rebah(pojok, W.kayu, 1.02, 0.56, 0.04, 0.05, 0, 0.84, 0);

  const halaman = lukisan(256, 320, function (ctx, l, t) {
    ctx.fillStyle = "#fffdf6";
    ctx.fillRect(0, 0, l, t);
    ctx.strokeStyle = "#d9b06a";
    ctx.lineWidth = 9;
    ctx.strokeRect(16, 16, l - 32, t - 32);
    ctx.strokeStyle = "#a9cbb0";
    ctx.lineWidth = 5;
    ctx.strokeRect(30, 30, l - 60, t - 60);
    ctx.fillStyle = "#cfc6b8"; // garis hias, bukan tulisan tiruan
    for (let y = 62; y < t - 50; y += 25) ctx.fillRect(50, y, l - 100, 5);
  });
  const quran = grup(pojok, 0, 0.86, 0.04);
  const rehal = grup(quran, 0, 0.16, 0);
  rehal.rotation.x = 0.42;
  [-1, 1].forEach(function (s) {
    const sayap = grup(rehal, 0, 0, 0);
    sayap.rotation.z = s * 0.5;
    kotak(sayap, W.kayuTua, 0.56, 0.022, 0.2, 0, 0, 0);
    kotak(sayap, 0x8fb89b, 0.28, 0.016, 0.35, s * 0.15, 0.028, 0);
    kotak(sayap, W.putih, 0.26, 0.04, 0.33, s * 0.142, 0.054, 0);
    const lembar = bidang(sayap, halaman, 0.26, 0.33, s * 0.142, 0.0755, 0);
    lembar.rotation.x = -Math.PI / 2;
  });

  // Mukena terlipat, tasbih, dan sajadah
  [W.lavMuda, W.putih, W.roseMuda].forEach(function (w, i) {
    rebah(pojok, w, 0.24, 0.3, 0.04, 0.04, -0.36, 0.885 + i * 0.042, 0);
  });
  const tasbih = mesh(pojok, new THREE.TorusGeometry(0.06, 0.011, 8, 30), W.emas, 0.38, 0.872, 0.1);
  tasbih.rotation.x = -Math.PI / 2;
  const sajadah = grup(scene, 1.8, 0, 1.35, Math.PI); // lurus menghadap TV di dinding pintu
  rebah(sajadah, W.sageTua, 0.7, 1.15, 0.016, 0.02, 0, 0.012, 0);
  rebah(sajadah, W.sageMuda, 0.58, 1.02, 0.018, 0.02, 0, 0.014, 0);
  const mihrab = new THREE.Shape();
  mihrab.moveTo(-0.2, -0.42); mihrab.lineTo(-0.2, 0.12);
  mihrab.quadraticCurveTo(-0.18, 0.32, 0, 0.42);
  mihrab.quadraticCurveTo(0.18, 0.32, 0.2, 0.12); mihrab.lineTo(0.2, -0.42); mihrab.closePath();
  mesh(sajadah, new THREE.ShapeGeometry(mihrab, 16), W.sage, 0, 0.026, 0).rotation.x = -Math.PI / 2;

  // Bulan di dinding atas pojok shalat
  const hiasPojok = grup(scene, 2.97, 2.0, -1.9, -Math.PI / 2);
  mesh(hiasPojok, new THREE.TorusGeometry(0.34, 0.014, 8, 48), W.emas, 0, 0, 0.02);
  mesh(hiasPojok, tebalkan(bentukSabit(0.2), 0.02), W.emas, 0, 0, 0.02);
  mesh(hiasPojok, tebalkan(bentukBintang(0.06, 0.04), 0.02), W.emas, 0.13, 0.04, 0.02);

  /* ============ 9. KASUR ============ */
  const kasur = grup(scene, -2.25, 0, -1.45);
  bayangan(-2.2, -1.45, 2, 3.1);
  rebah(kasur, W.kayu, 1.35, 2.45, 0.22, 0.08, 0, 0.22, 0);
  papan(kasur, W.kayu, 1.35, 0.95, 0.08, 0.2, 0, 0.5, -1.24);
  [[-0.58, -1.1], [0.58, -1.1], [-0.58, 1.1], [0.58, 1.1]].forEach(function (p) {
    tabung(kasur, W.kayuTua, 0.04, 0.03, 0.12, p[0], 0.06, p[1]);
  });
  rebah(kasur, W.putih, 1.27, 2.32, 0.24, 0.14, 0, 0.44, 0.02);
  // Selimut dengan lipatan kain lembut dan jahitan quilt
  rebah(kasur, W.roseMuda, 1.33, 1.55, 0.26, 0.14, 0, 0.455, 0.42).material = new THREE.MeshLambertMaterial({
    map: teksturUlang(256, function (ctx, n) {
      ctx.fillStyle = "#f9e4eb";
      ctx.fillRect(0, 0, n, n);
      for (let i = 0; i < 5; i++) { // lipatan: pita terang dan gelap yang landai
        const x = (i + 0.3) * n / 5, g = ctx.createLinearGradient(x - 26, 0, x + 26, 0);
        g.addColorStop(0, "rgba(214,160,180,0)");
        g.addColorStop(0.45, "rgba(214,160,180,0.22)");
        g.addColorStop(0.55, "rgba(255,255,255,0.35)");
        g.addColorStop(1, "rgba(255,255,255,0)");
        ctx.fillStyle = g;
        ctx.fillRect(x - 26, 0, 52, n);
      }
      ctx.strokeStyle = "rgba(220,150,175,0.45)"; // jahitan quilt putus putus
      ctx.lineWidth = 2;
      ctx.setLineDash([6, 6]);
      for (let k = n / 4; k < n; k += n / 4) {
        ctx.beginPath(); ctx.moveTo(0, k); ctx.lineTo(n, k); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(k, 0); ctx.lineTo(k, n); ctx.stroke();
      }
    }, 1.6)
  });
  rebah(kasur, W.rose, 1.34, 0.28, 0.27, 0.08, 0, 0.46, -0.25);
  function bantal(warna, x, y, z, l, t, d) {
    const b = bola(kasur, warna, 0.5, x, y, z);
    b.scale.set(l, t, d);
    b.rotation.x = -0.35;
  }
  bantal(W.putih, -0.31, 0.68, -0.9, 0.56, 0.26, 0.42);
  bantal(W.lavMuda, 0.31, 0.68, -0.9, 0.56, 0.26, 0.42);
  bantal(W.madu, 0, 0.7, -0.64, 0.32, 0.24, 0.2);
  // Boneka bulan kecil
  mesh(kasur, tebalkan(bentukSabit(0.14), 0.09), W.sage, 0.34, 0.74, -0.5).rotation.set(-0.3, 0.2, 0.4);

  /* ============ 10. DINDING KIRI: poster, rak buku ============ */
  function bingkai(x, y, z, l, t, warna, isi) {
    const g = grup(scene, x, y, z, x < 0 ? Math.PI / 2 : -Math.PI / 2);
    papan(g, warna, l, t, 0.03, 0.02, 0, 0, 0.02);
    papan(g, W.putih, l - 0.08, t - 0.08, 0.03, 0.01, 0, 0, 0.026);
    isi(g);
  }
  bingkai(-3, 1.9, -1.5, 1.05, 0.8, W.madu, function (g) {
    logo(g, LOGO_F, 0.78, RASIO_F, 0, 0.17, 0.05);
    logo(g, LOGO_K, 0.78, RASIO_K, 0, -0.17, 0.05);
  });
  bingkai(-3, 1.95, -0.55, 0.5, 0.66, W.lav, function (g) {
    bidang(g, lukisan(256, 340, function (ctx, l, t) {
      ctx.fillStyle = "#fdf7f1";
      ctx.fillRect(0, 0, l, t);
      ctx.fillStyle = "#3f6650";
      ctx.textAlign = "center";
      ctx.font = "italic 34px Georgia, serif";
      ["Pelan-pelan", "asal", "konsisten"].forEach(function (k, i) { ctx.fillText(k, l / 2, 125 + i * 52); });
    }), 0.4, 0.54, 0, 0, 0.05);
  });

  const rak = grup(scene, -2.78, 0, 1.2, Math.PI / 2);
  bayangan(-2.7, 1.2, 1, 1.8);
  [-0.62, 0.62].forEach(function (x) { kotak(rak, W.putih, 0.04, 1.7, 0.34, x, 0.85, 0); });
  kotak(rak, W.roseMuda, 1.24, 1.7, 0.02, 0, 0.85, -0.16);
  [0.04, 0.46, 0.88, 1.3, 1.68].forEach(function (y) { kotak(rak, W.putih, 1.26, 0.035, 0.34, 0, y, 0); });
  papan(rak, W.lav, 0.5, 0.3, 0.28, 0.04, -0.3, 0.21, 0);
  papan(rak, W.madu, 0.5, 0.3, 0.28, 0.04, 0.3, 0.21, 0);
  // Hiasan pindah ke atas rak, supaya tiga tingkat penuh untuk buku
  bola(rak, W.sage, 0.09, 0.38, 1.79, 0);
  tabung(rak, W.rose, 0.07, 0.055, 0.12, -0.38, 1.76, 0);
  for (let i = 0; i < 6; i++) {
    const daun = bola(rak, W.sageTua, 0.05, -0.38 + Math.cos(i) * 0.06, 1.88 + (i % 3) * 0.03, Math.sin(i) * 0.06);
    daun.scale.y = 1.5;
    catatDaun(daun);
  }

  /* ============ 10b. BUKU DI RAK: bisa diseret dan disusun sendiri ============ */
  const RAK = { y: [0.4775, 0.8975, 1.3175], kiri: -0.58, lebar: 1.16, celah: 0.004, kunci: "kamar-rak-buku" };
  let benihRak = 31; // acakan sendiri, supaya bentuk dan warna buku selalu sama
  function acakRak() { benihRak = (benihRak * 16807) % 2147483647; return benihRak / 2147483647; }
  const BUKU_RAK = [];
  for (let i = 0; i < 30; i++) {
    BUKU_RAK.push({
      t: 0.032 + acakRak() * 0.03, h: 0.22 + acakRak() * 0.09,
      warna: WARNA_BUKU[Math.floor(acakRak() * WARNA_BUKU.length)],
      pita: acakRak() < 0.5 ? W.putih : W.krem, emas: acakRak() < 0.3
    });
  }
  const bukuRak = BUKU_RAK.map(function (d, i) {
    const g = grup(rak, 0, 0, 0);
    kotak(g, d.warna, d.t, d.h, 0.22, 0, d.h / 2, 0);
    kotak(g, d.pita, d.t + 0.002, 0.022, 0.14, 0, d.h * 0.74, 0.045);
    if (d.emas) kotak(g, W.emas, d.t + 0.002, 0.012, 0.14, 0, d.h * 0.24, 0.045);
    g.userData.bukuRak = i;
    g.userData.tuju = new THREE.Vector3();
    return g;
  });

  function susunanAwal() {
    return [[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [12, 13, 14, 15, 16, 17, 18, 19, 20, 21], [22, 23, 24, 25, 26, 27, 28, 29]];
  }
  function lebarTingkat(daftar) {
    return daftar.reduce(function (n, id) { return n + BUKU_RAK[id].t + RAK.celah; }, 0);
  }
  // Susunan tersimpan dipakai hanya kalau lengkap dan tidak rusak
  function muatSusunanRak() {
    try {
      const s = JSON.parse(localStorage.getItem(RAK.kunci));
      const semua = Array.isArray(s) && s.length === 3 && s.every(Array.isArray) ? [].concat(s[0], s[1], s[2]) : [];
      const lengkap = semua.length === 30 && new Set(semua).size === 30 &&
        semua.every(function (id) { return Number.isInteger(id) && id >= 0 && id < 30; });
      if (lengkap && s.every(function (d) { return lebarTingkat(d) <= RAK.lebar; })) return s;
    } catch (err) { /* rusak atau diblokir */ }
    return susunanAwal();
  }
  function simpanSusunanRak() {
    try { localStorage.setItem(RAK.kunci, JSON.stringify(susunanRak)); } catch (err) { /* penuh atau diblokir */ }
  }
  let susunanRak = muatSusunanRak();

  // Hitung posisi tiap buku: berjajar dari kiri di tiap tingkat. lewati = buku yang sedang diseret.
  function aturRak(susunan, lewati, langsung) {
    susunan.forEach(function (daftar, tingkat) {
      let x = RAK.kiri;
      daftar.forEach(function (id) {
        const t = BUKU_RAK[id].t;
        if (id !== lewati) {
          bukuRak[id].userData.tuju.set(x + t / 2, RAK.y[tingkat], 0);
          if (langsung) bukuRak[id].position.copy(bukuRak[id].userData.tuju);
        }
        x += t + RAK.celah;
      });
    });
  }
  aturRak(susunanRak, -1, true);

  /* ============ 11. DINDING KANAN: lemari pakaian, papan catatan ============ */
  // Lemari menghadap ke tengah kamar. Sumbu lokal: x = lebar lemari, z = ke depan.
  const LEMARI = { l: 2.6, t: 2.3, d: 0.6, laci: 0.44, z: 0.35 };
  const lemari = grup(scene, 3 - LEMARI.d / 2, 0, LEMARI.z, -Math.PI / 2);
  bayangan(2.65, LEMARI.z, 1, 3);
  const tl = LEMARI.l / 2, td = LEMARI.d / 2;
  kotak(lemari, W.lavMuda, LEMARI.l, LEMARI.t, 0.02, 0, LEMARI.t / 2, -td + 0.01);       // dinding belakang
  [-1, 1].forEach(function (s) { kotak(lemari, W.putih, 0.04, LEMARI.t, LEMARI.d, s * (tl - 0.02), LEMARI.t / 2, 0); });
  kotak(lemari, W.putih, LEMARI.l, 0.04, LEMARI.d, 0, LEMARI.t - 0.02, 0);                // atap
  kotak(lemari, W.putih, LEMARI.l, 0.04, LEMARI.d, 0, 0.02, 0);                           // alas
  kotak(lemari, W.putih, LEMARI.l, 0.03, LEMARI.d, 0, LEMARI.laci, 0);                    // sekat rak sepatu
  papan(lemari, W.kayu, LEMARI.l + 0.08, 0.08, LEMARI.d + 0.06, 0.03, 0, LEMARI.t + 0.04, 0); // mahkota
  batang(lemari, W.emas, 0.014, [-tl + 0.05, 2.02, 0], [tl - 0.05, 2.02, 0]);             // gantungan

  // Pintu: dua daun berengsel di sisi luar, terbuka ke depan
  const pintuLemari = [-1, 1].map(function (s) {
    const p = grup(lemari, s * tl, 0, td);
    const lebar = tl - 0.01, tinggi = LEMARI.t - LEMARI.laci - 0.03, tengah = -s * lebar / 2, y = LEMARI.laci + 0.015 + tinggi / 2;
    kotak(p, W.roseMuda, lebar, tinggi, 0.03, tengah, y, 0.015);
    papan(p, W.putih, lebar - 0.16, tinggi - 0.2, 0.012, 0.04, tengah, y, 0.033);
    if (s > 0) bidang(p, new THREE.MeshBasicMaterial({ color: 0xe6f1f6 }), lebar - 0.3, tinggi - 0.5, tengah, y + 0.05, 0.04); // cermin
    batang(p, W.emas, 0.012, [-s * (lebar - 0.07), y - 0.15, 0.06], [-s * (lebar - 0.07), y + 0.15, 0.06]);
    return p;
  });

  /* Pakaian. Titik asal tiap pakaian = puncak gantungan. */
  function gantunganBaju(g) {
    batang(g, W.kayuTua, 0.012, [-0.19, -0.1, 0], [0, -0.02, 0]);
    batang(g, W.kayuTua, 0.012, [0, -0.02, 0], [0.19, -0.1, 0]);
    batang(g, W.kayuTua, 0.01, [-0.19, -0.1, 0], [0.19, -0.1, 0]);
    batang(g, W.emas, 0.007, [0, -0.02, 0], [0, 0.08, 0]);
  }
  function gantunganRok(g) {
    batang(g, W.kayuTua, 0.012, [-0.2, -0.03, 0], [0.2, -0.03, 0]);
    [-0.15, 0.15].forEach(function (x) { kotak(g, W.emas, 0.03, 0.05, 0.03, x, -0.06, 0); });
    batang(g, W.emas, 0.007, [0, -0.03, 0], [0, 0.08, 0]);
  }
  function kain(g, s, warna, tebal, y) { return mesh(g, tebalkan(s, tebal), warna, 0, y, 0); }

  function bajuGamis(warna) {
    const g = new THREE.Group(), s = new THREE.Shape(), p = 1.35;
    s.moveTo(-0.07, 0); s.lineTo(-0.2, -0.05); s.lineTo(-0.33, -0.55); s.lineTo(-0.24, -0.58);
    s.lineTo(-0.16, -0.3); s.lineTo(-0.3, -p);
    s.quadraticCurveTo(0, -p - 0.05, 0.3, -p);
    s.lineTo(0.16, -0.3); s.lineTo(0.24, -0.58); s.lineTo(0.33, -0.55); s.lineTo(0.2, -0.05); s.lineTo(0.07, 0);
    s.quadraticCurveTo(0, -0.06, -0.07, 0);
    gantunganBaju(g);
    kain(g, s, warna, 0.06, -0.06);
    for (let i = 0; i < 4; i++) bola(g, W.putih, 0.012, 0, -0.16 - i * 0.07, 0.034); // kancing
    return g;
  }

  // Jilbab panjang dua lapis: depan berujung segitiga, belakang lebih panjang dan bawahnya membulat
  function jilbabPanjang(warna) {
    const g = new THREE.Group();
    const belakang = new THREE.Shape();
    belakang.moveTo(0, 0.02); belakang.quadraticCurveTo(-0.17, 0, -0.25, -0.3); belakang.lineTo(-0.37, -0.78);
    belakang.quadraticCurveTo(0, -1.1, 0.37, -0.78); belakang.lineTo(0.25, -0.3); belakang.quadraticCurveTo(0.17, 0, 0, 0.02);
    const depan = new THREE.Shape();
    depan.moveTo(0, 0); depan.quadraticCurveTo(-0.16, -0.01, -0.22, -0.28); depan.lineTo(-0.31, -0.52);
    depan.lineTo(0, -0.8); depan.lineTo(0.31, -0.52); depan.lineTo(0.22, -0.28); depan.quadraticCurveTo(0.16, -0.01, 0, 0);
    gantunganBaju(g);
    mesh(g, tebalkan(belakang, 0.03), warna, 0, -0.08, -0.016);
    mesh(g, tebalkan(depan, 0.02), warna, 0, -0.08, 0.012);
    // Garis tepi tipis supaya ujung segitiga depan terlihat jelas
    batang(g, W.rose, 0.005, [-0.31, -0.6, 0.023], [0, -0.88, 0.023]);
    batang(g, W.rose, 0.005, [0, -0.88, 0.023], [0.31, -0.6, 0.023]);
    bola(g, W.emas, 0.02, 0, -0.3, 0.028); // bros
    return g;
  }

  function rok(warna) {
    const g = new THREE.Group(), s = new THREE.Shape();
    s.moveTo(-0.16, 0); s.lineTo(0.16, 0); s.lineTo(0.34, -0.85);
    s.quadraticCurveTo(0, -0.9, -0.34, -0.85); s.closePath();
    gantunganRok(g);
    kain(g, s, warna, 0.05, -0.07);
    kotak(g, W.kayu, 0.33, 0.05, 0.056, 0, -0.095, 0); // ban pinggang
    [-0.1, 0.1].forEach(function (x) { kotak(g, W.putih, 0.006, 0.7, 0.052, x * 1.6, -0.5, 0).rotation.z = -x * 0.9; }); // lipit
    return g;
  }

  // Mukena: atasan dan rok bawahan. Lubang wajah hanya di lapisan depan atasan.
  function mukena() {
    const g = new THREE.Group();
    function bentukAtasanMukena() {
      const s = new THREE.Shape();
      s.moveTo(0, 0.03); s.quadraticCurveTo(-0.22, 0.02, -0.3, -0.3); s.lineTo(-0.46, -1.05);
      s.quadraticCurveTo(0, -1.15, 0.46, -1.05); s.lineTo(0.3, -0.3); s.quadraticCurveTo(0.22, 0.02, 0, 0.03);
      return s;
    }
    gantunganBaju(g);

    // Rok bawahan digantung di belakang atasan, menjuntai lebih panjang
    const rokBawah = new THREE.Shape();
    rokBawah.moveTo(-0.2, 0); rokBawah.lineTo(0.2, 0); rokBawah.lineTo(0.42, -1.15);
    rokBawah.quadraticCurveTo(0, -1.22, -0.42, -1.15); rokBawah.closePath();
    mesh(g, tebalkan(rokBawah, 0.03), W.putih, 0, -0.28, -0.045);
    for (let i = 0; i <= 12; i++) { // renda di ujung rok
      const x = -0.4 + i * 0.0667;
      bola(g, W.rose, 0.015, x, -1.43 - 0.035 * (1 - (x / 0.42) * (x / 0.42)) + 0.012, -0.03);
    }

    // Atasan: lapisan belakang utuh, lapisan depan berlubang untuk wajah
    mesh(g, tebalkan(bentukAtasanMukena(), 0.024), W.putih, 0, -0.08, -0.012);
    const depan = bentukAtasanMukena();
    const wajah = new THREE.Path();
    wajah.absellipse(0, -0.19, 0.085, 0.11, 0, Math.PI * 2, true);
    depan.holes.push(wajah);
    mesh(g, tebalkan(depan, 0.02), W.putih, 0, -0.08, 0.014);
    const dalam = mesh(g, new THREE.CircleGeometry(1, 32), 0xebe3f2, 0, -0.27, 0.003); // bagian dalam lubang wajah
    dalam.scale.set(0.085, 0.11, 1);
    mesh(g, new THREE.TorusGeometry(0.1, 0.01, 6, 30), W.rose, 0, -0.27, 0.026).scale.y = 1.25; // renda wajah
    for (let i = 0; i <= 14; i++) { // renda di ujung atasan
      const x = -0.44 + i * 0.063;
      bola(g, W.rose, 0.016, x, -1.13 + Math.abs(x) * 0.17 + 0.02, 0.026);
    }
    return g;
  }

  function bentukAtasan(lebar, panjang) {
    const s = new THREE.Shape(), b = lebar / 2;
    s.moveTo(-0.08, 0); s.lineTo(-b, -0.04); s.lineTo(-b - 0.16, -0.52); s.lineTo(-b - 0.07, -0.55);
    s.lineTo(-b + 0.01, -0.2); s.lineTo(-b, -panjang); s.lineTo(b, -panjang); s.lineTo(b - 0.01, -0.2);
    s.lineTo(b + 0.07, -0.55); s.lineTo(b + 0.16, -0.52); s.lineTo(b, -0.04); s.lineTo(0.08, 0);
    s.quadraticCurveTo(0, -0.07, -0.08, 0);
    return s;
  }

  // Kaos lengan panjang dengan tulisan biasa (bukan logo)
  const tulisanKaos = lukisan(512, 256, function (ctx, l, t) {
    ctx.clearRect(0, 0, l, t);
    ctx.fillStyle = "#3f6650";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "bold 92px sans-serif";
    ctx.fillText("KARIMAH", l / 2, t * 0.36);
    ctx.font = "bold 64px sans-serif";
    ctx.fillText("1448 H", l / 2, t * 0.74);
  });
  tulisanKaos.transparent = true;
  function kaosPanjang(warna) {
    const g = new THREE.Group();
    gantunganBaju(g);
    kain(g, bentukAtasan(0.4, 0.66), warna, 0.05, -0.06);
    bidang(g, tulisanKaos, 0.26, 0.13, 0, -0.27, 0.027);
    [-1, 1].forEach(function (s) { kotak(g, W.putih, 0.1, 0.03, 0.052, s * 0.315, -0.595, 0).rotation.z = s * 0.35; }); // manset
    return g;
  }

  function jaket(warna) {
    const g = new THREE.Group();
    gantunganBaju(g);
    const tudung = bola(g, warna, 0.13, 0, -0.05, -0.04); // tudung di belakang leher
    tudung.scale.set(1.1, 0.8, 0.35);
    kain(g, bentukAtasan(0.44, 0.7), warna, 0.07, -0.06);
    kotak(g, W.emas, 0.012, 0.62, 0.074, 0, -0.42, 0); // ritsleting
    [-1, 1].forEach(function (s) {
      papan(g, 0x93a6c8, 0.12, 0.12, 0.01, 0.02, s * 0.11, -0.6, 0.038); // saku
      kotak(g, 0x93a6c8, 0.11, 0.035, 0.076, s * 0.345, -0.6, 0).rotation.z = s * 0.35;  // manset
      batang(g, W.putih, 0.004, [s * 0.04, -0.08, 0.04], [s * 0.05, -0.22, 0.04]);       // tali tudung
    });
    kotak(g, 0x93a6c8, 0.44, 0.05, 0.075, 0, -0.74, 0); // karet bawah
    return g;
  }

  /* Alas kaki. Panjang sepatu di sumbu x, titik asal di tengah bawah. */
  function sepatuOlahraga(warna, aksen) {
    const g = new THREE.Group();
    papan(g, W.putih, 0.28, 0.035, 0.095, 0.016, 0, 0.0175, 0); // sol tebal
    kotak(g, aksen, 0.28, 0.006, 0.097, 0, 0.012, 0);           // garis sol
    const s = new THREE.Shape();
    s.moveTo(-0.13, 0.03); s.lineTo(0.12, 0.03); s.quadraticCurveTo(0.145, 0.03, 0.137, 0.056);
    s.quadraticCurveTo(0.11, 0.08, 0.03, 0.088);
    s.lineTo(-0.06, 0.118); s.lineTo(-0.125, 0.118); s.quadraticCurveTo(-0.145, 0.1, -0.13, 0.03);
    mesh(g, tebalkan(s, 0.085), warna, 0, 0, 0);
    kotak(g, aksen, 0.13, 0.014, 0.087, -0.03, 0.06, 0).rotation.z = 0.12; // garis samping polos
    for (let i = 0; i < 4; i++) kotak(g, W.putih, 0.012, 0.006, 0.06, 0.03 - i * 0.025, 0.091 + i * 0.008, 0).rotation.z = 0.32; // tali
    kotak(g, 0x8f7f9a, 0.065, 0.004, 0.06, -0.095, 0.118, 0); // lubang kaki
    kotak(g, aksen, 0.03, 0.05, 0.087, -0.128, 0.08, 0);       // tumit
    return g;
  }

  function sandalSlide(warnaSol, warnaTali) {
    const g = new THREE.Group();
    rebah(g, warnaSol, 0.27, 0.105, 0.045, 0.045, 0, 0.0225, 0);  // sol tebal
    rebah(g, W.krem, 0.25, 0.09, 0.006, 0.04, 0, 0.048, 0);       // alas kaki
    const tali = mesh(g, new THREE.CylinderGeometry(0.056, 0.056, 0.1, 20, 1, true, 0, Math.PI),
      new THREE.MeshLambertMaterial({ color: warnaTali, side: THREE.DoubleSide }), 0.045, 0.05, 0);
    tali.rotation.x = Math.PI / 2;
    tali.scale.set(1, 1, 0.85);
    kotak(g, W.emas, 0.025, 0.012, 0.03, 0.045, 0.106, 0); // hiasan kecil
    return g;
  }

  // Kaos kaki dilipat rebah di rak. Ujung jari menghadap sumbu x, betis ke belakang.
  function kaosKaki(warna, aksen) {
    const g = new THREE.Group(), s = new THREE.Shape();
    s.moveTo(-0.032, 0.19); s.lineTo(0.032, 0.19); s.lineTo(0.032, 0.05); s.lineTo(0.12, 0.05);
    s.quadraticCurveTo(0.155, 0.025, 0.12, 0); s.lineTo(-0.015, 0);
    s.quadraticCurveTo(-0.04, 0, -0.032, 0.035); s.closePath();
    const kaki = mesh(g, tebalkan(s, 0.014), warna, 0, 0.008, 0);
    kaki.rotation.x = -Math.PI / 2;
    // Manset, ujung jari, dan tumit memakai warna aksen: [x, z, lebar, dalam]
    [[0, 0.17, 0.068, 0.04], [0.125, 0.025, 0.05, 0.05], [-0.018, 0.02, 0.04, 0.04]].forEach(function (b) {
      kotak(g, aksen, b[2], 0.016, b[3], b[0], 0.009, -b[1]);
    });
    return g;
  }
  function sepasangKaosKaki(warna, aksen) {
    const g = new THREE.Group();
    [-1, 1].forEach(function (s) {
      const k = kaosKaki(warna, aksen);
      k.position.set(s * 0.045 - 0.03, s > 0 ? 0.016 : 0, 0.08); // ditumpuk sedikit
      k.rotation.y = s * 0.08;
      g.add(k);
    });
    return g;
  }

  // Tas digantung di gantungan dinding. Titik asal = kait.
  function tasRansel(warna) {
    const g = new THREE.Group();
    mesh(g, new THREE.TorusGeometry(0.05, 0.011, 8, 20, Math.PI), W.kayuTua, 0, -0.07, 0); // pegangan atas
    papan(g, warna, 0.3, 0.38, 0.13, 0.09, 0, -0.29, 0);               // badan
    papan(g, W.krem, 0.22, 0.15, 0.05, 0.05, 0, -0.38, 0.08);          // saku depan
    kotak(g, W.emas, 0.2, 0.01, 0.012, 0, -0.32, 0.106);               // ritsleting saku
    kotak(g, W.emas, 0.24, 0.01, 0.012, 0, -0.14, 0.066);              // ritsleting atas
    bola(g, W.rose, 0.018, 0.1, -0.32, 0.11);                          // gantungan kunci
    [-1, 1].forEach(function (s) {
      batang(g, W.kayuTua, 0.012, [s * 0.08, -0.12, -0.07], [s * 0.12, -0.46, -0.08]); // tali punggung
      papan(g, warna, 0.06, 0.12, 0.03, 0.02, s * 0.16, -0.32, 0);                     // saku samping
    });
    return g;
  }
  function tasSelempang(warna) {
    const g = new THREE.Group();
    // Tali panjang menjuntai dari kait ke kedua sisi tas
    batang(g, W.kayuTua, 0.007, [0, 0, 0], [-0.1, -0.42, 0.01]);
    batang(g, W.kayuTua, 0.007, [0, 0, 0], [0.1, -0.42, 0.01]);
    papan(g, warna, 0.22, 0.15, 0.06, 0.04, 0, -0.5, 0.01);                      // badan mini
    papan(g, W.roseMuda, 0.22, 0.09, 0.012, 0.035, 0, -0.47, 0.046).rotation.x = -0.08; // tutup
    bola(g, W.emas, 0.014, 0, -0.51, 0.055);                                      // kancing emas
    [-1, 1].forEach(function (s) { mesh(g, new THREE.TorusGeometry(0.012, 0.004, 6, 14), W.emas, s * 0.1, -0.43, 0.01); });
    return g;
  }

  function sepasang(buat) {
    const g = new THREE.Group();
    [-1, 1].forEach(function (s) {
      const k = buat();
      k.position.z = s * 0.065;
      k.rotation.y = s * 0.06;
      g.add(k);
    });
    g.rotation.y = -Math.PI / 2; // ujung sepatu menghadap ke depan lemari
    return g;
  }

  // Daftar isi lemari: [nama, buat, x, y, z]. Yang lebar di baris belakang, yang ramping di depan.
  const ISI_LEMARI = [
    ["Jilbab panjang", function () { return jilbabPanjang(W.roseMuda); }, -1.0, 1.94, -0.12],
    ["Gamis", function () { return bajuGamis(W.sage); }, -0.6, 1.94, 0.06],
    ["Mukena", mukena, -0.2, 1.94, -0.12],
    ["Rok", function () { return rok(W.madu); }, 0.2, 1.94, 0.06],
    ["Jaket", function () { return jaket(0xb8c6e0); }, 0.6, 1.94, -0.12],
    ["Kaos lengan panjang KARIMAH 1448 H", function () { return kaosPanjang(W.lav); }, 1.0, 1.94, 0.06],
    ["Kaos kaki krem", function () { return sepasangKaosKaki(0xeedcbc, W.putih); }, -1.06, 0.045, 0],
    ["Sepatu olahraga pink", function () { return sepasang(function () { return sepatuOlahraga(W.rose, W.roseMuda); }); }, -0.64, 0.045, 0.02],
    ["Sepatu olahraga lavender", function () { return sepasang(function () { return sepatuOlahraga(W.lav, W.sageMuda); }); }, -0.21, 0.045, 0.02],
    ["Sandal slide sage", function () { return sepasang(function () { return sandalSlide(W.sage, W.putih); }); }, 0.21, 0.045, 0.02],
    ["Sandal slide madu", function () { return sepasang(function () { return sandalSlide(W.madu, W.roseMuda); }); }, 0.64, 0.045, 0.02],
    ["Kaos kaki putih hitam", function () { return sepasangKaosKaki(W.putih, 0x34323c); }, 1.06, 0.045, 0],
    // Digantung di kait balik pintu kiri, terlihat saat pintu dibuka
    ["Tas ransel", function () { return tasRansel(W.sage); }, 0.4, 1.78, -0.03, pintuLemari[0]],
    ["Tas selempang mini", function () { return tasSelempang(W.rose); }, 0.9, 1.78, -0.03, pintuLemari[0]]
  ];
  // Papan kait di balik pintu kiri
  papan(pintuLemari[0], W.kayu, 0.9, 0.07, 0.02, 0.03, 0.65, 1.82, -0.012);
  [0.4, 0.9].forEach(function (x) { batang(pintuLemari[0], W.emas, 0.01, [x, 1.82, -0.02], [x, 1.78, -0.04]); });
  const pakaian = ISI_LEMARI.map(function (b, i) {
    const g = b[1]();
    g.position.set(b[2], b[3], b[4]);
    if (b[3] > 1.8 && !b[5]) g.scale.setScalar(0.78); // pakaian di dalam lemari sedikit dikecilkan supaya muat
    if (b[5]) g.rotation.y = Math.PI; // tas di balik pintu menghadap ke dalam
    g.userData.pakaian = i;
    g.userData.nama = b[0];
    g.userData.buat = b[1];
    (b[5] || lemari).add(g);
    return g;
  });

  bingkai(3, 1.6, 2.2, 0.95, 0.72, W.kayuTua, function (g) {
    bidang(g, lukisan(512, 380, function (ctx, l, t) {
      ctx.fillStyle = "#fbf1e3";
      ctx.fillRect(0, 0, l, t);
      [["#f9e4eb", 30, 30, "Kuliah"], ["#e2efe2", 190, 50, "Tilawah"], ["#ece6f4", 345, 28, "Dakwah"],
        ["#fbeed6", 70, 205, "Sedekah"], ["#dfeef5", 270, 215, "Halaqah"]].forEach(function (n) {
        ctx.fillStyle = n[0];
        ctx.fillRect(n[1], n[2], 140, 130);
        ctx.fillStyle = "#3f6650";
        ctx.font = "italic 28px Georgia, serif";
        ctx.textAlign = "center";
        ctx.fillText(n[3], n[1] + 70, n[2] + 74);
        ctx.fillStyle = "#dcb26b";
        ctx.beginPath();
        ctx.arc(n[1] + 70, n[2] + 14, 8, 0, 7);
        ctx.fill();
      });
    }), 0.85, 0.62, 0, 0, 0.05);
  });

  /* ============ 12. TENGAH KAMAR ============ */
  // Karpet bertekstur anyaman halus
  function anyaman(dasar, benang, ulang) {
    return new THREE.MeshLambertMaterial({
      map: teksturUlang(128, function (ctx, n) {
        ctx.fillStyle = dasar;
        ctx.fillRect(0, 0, n, n);
        ctx.fillStyle = benang;
        for (let y = 0; y < n; y += 8) {
          for (let x = 0; x < n; x += 8) { // anyaman: garis mendatar dan tegak bergantian
            if ((x + y) % 16 === 0) ctx.fillRect(x + 1, y + 3, 6, 2);
            else ctx.fillRect(x + 3, y + 1, 2, 6);
          }
        }
      }, ulang)
    });
  }
  const karpet = mesh(scene, new THREE.CircleGeometry(1.15, 56), anyaman("#f9e4eb", "rgba(220,170,190,0.45)", 9), 0.1, 0.012, 0.7);
  karpet.rotation.x = -Math.PI / 2;
  const karpetDalam = mesh(scene, new THREE.CircleGeometry(0.95, 56), anyaman("#fffdfa", "rgba(215,200,185,0.4)", 8), 0.1, 0.016, 0.7);
  karpetDalam.rotation.x = -Math.PI / 2;
  const karpetTepi = mesh(scene, new THREE.RingGeometry(0.72, 0.78, 56), W.sage, 0.1, 0.02, 0.7);
  karpetTepi.rotation.x = -Math.PI / 2;
  pot(scene, -2.6, 2.45, 1.1, W.lav);
  untaian(scene, [-2.95, 2.72, -2.9], [2.95, 2.72, -2.9], 0.22, 18, 1);
  untaian(scene, [-2.95, 2.75, 2.6], [-2.95, 2.75, -2.6], 0.2, 14, 0.9);
  batang(scene, W.kayuTua, 0.01, [0.1, 3, 0.5], [0.1, 2.72, 0.5]);
  bola(scene, new THREE.MeshBasicMaterial({ color: 0xfffaf0 }), 0.2, 0.1, 2.55, 0.5);

  /* ============ 12a. SUASANA: sinar matahari, debu berkilau, uap cangkir ============ */
  // Pantulan jendela di lantai: empat kaca bercahaya hangat
  const bahanSinar = new THREE.MeshBasicMaterial({
    map: teksturUlang(256, function (ctx, n) {
      ctx.clearRect(0, 0, n, n);
      ctx.filter = "blur(6px)"; // tepi cahaya lembut (browser lama: tetap tajam, tidak apa apa)
      ctx.fillStyle = "#ffffff";
      [[20, 30], [134, 30], [20, 138], [134, 138]].forEach(function (k) { ctx.fillRect(k[0], k[1], 102, 92); });
      ctx.filter = "none";
      ctx.globalCompositeOperation = "destination-in"; // makin jauh dari jendela makin pudar
      const g = ctx.createLinearGradient(0, 0, 0, n);
      g.addColorStop(0, "rgba(0,0,0,0.9)");
      g.addColorStop(1, "rgba(0,0,0,0.25)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, n, n);
    }),
    color: 0xffe9bd, transparent: true, opacity: 0.32, depthWrite: false, blending: THREE.AdditiveBlending
  });
  bahanSinar.userData.tetapTerang = true; // diatur sendiri saat lampu dimatikan
  const sinarLantai = bidang(scene, bahanSinar, 1.9, 1.35, 0.3, 0.024, -1.3);
  sinarLantai.rotation.set(-Math.PI / 2, 0, -0.12);

  // Berkas cahaya tipis dari jendela turun ke lantai
  const bahanBerkas = new THREE.MeshBasicMaterial({
    map: teksturUlang(128, function (ctx, n) {
      const g = ctx.createLinearGradient(0, 0, 0, n);
      g.addColorStop(0, "rgba(255,255,255,0.9)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, n, n);
      ctx.globalCompositeOperation = "destination-in";
      const s = ctx.createLinearGradient(0, 0, n, 0);
      s.addColorStop(0, "rgba(0,0,0,0)");
      s.addColorStop(0.2, "rgba(0,0,0,1)");
      s.addColorStop(0.8, "rgba(0,0,0,1)");
      s.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = s;
      ctx.fillRect(0, 0, n, n);
    }),
    color: 0xfff0cc, transparent: true, opacity: 0.09, depthWrite: false, side: THREE.DoubleSide, blending: THREE.AdditiveBlending
  });
  bahanBerkas.userData.tetapTerang = true;
  const berkas = bidang(scene, bahanBerkas, 2.2, 2.5, 0.2, 1.0, -2.05);
  berkas.rotation.x = -Math.PI / 4; // miring dari jendela ke lantai

  // Debu berkilau yang melayang pelan di dalam berkas cahaya
  const JUMLAH_DEBU = 70;
  const posisiDebu = new Float32Array(JUMLAH_DEBU * 3), dasarDebu = [];
  for (let i = 0; i < JUMLAH_DEBU; i++) {
    dasarDebu.push({ x: -0.9 + Math.random() * 2.1, y: 0.3 + Math.random() * 1.9, z: -2.6 + Math.random() * 1.6, fase: Math.random() * 6, laju: 0.02 + Math.random() * 0.04 });
  }
  const geoDebu = new THREE.BufferGeometry();
  geoDebu.setAttribute("position", new THREE.BufferAttribute(posisiDebu, 3));
  const debu = new THREE.Points(geoDebu, new THREE.PointsMaterial({
    map: teksturTitik, color: 0xfff3d6, size: 0.025, transparent: true, opacity: 0.7,
    depthWrite: false, blending: THREE.AdditiveBlending
  }));
  scene.add(debu);

  // Uap tipis dari cangkir di meja
  const uap = [0, 1, 2, 3].map(function () {
    const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: teksturTitik, color: 0xffffff, transparent: true, opacity: 0, depthWrite: false }));
    meja.add(s);
    return s;
  });

  function hidupkanSuasana() {
    const siang = 1 - gelap; // sinar matahari dan debu hilang saat lampu dimatikan
    bahanSinar.opacity = 0.32 * siang;
    bahanBerkas.opacity = 0.09 * siang;
    sinarLantai.visible = berkas.visible = debu.visible = siang > 0.02;
    if (debu.visible) {
      dasarDebu.forEach(function (d, i) {
        const y = 0.3 + ((d.y - 0.3 + waktu * d.laju) % 1.9);
        posisiDebu[i * 3] = d.x + Math.sin(waktu * 0.3 + d.fase) * 0.08;
        posisiDebu[i * 3 + 1] = y;
        posisiDebu[i * 3 + 2] = d.z + Math.cos(waktu * 0.25 + d.fase) * 0.06;
      });
      geoDebu.attributes.position.needsUpdate = true;
      debu.material.opacity = (0.5 + Math.sin(waktu * 1.3) * 0.2) * siang;
    }
    uap.forEach(function (s, i) {
      const t = (waktu * 0.3 + i / uap.length) % 1;
      s.position.set(0.42 + Math.sin(t * 5 + i) * 0.025, 0.92 + t * 0.3, -0.18);
      s.scale.setScalar(0.04 + t * 0.1);
      s.material.opacity = Math.sin(t * Math.PI) * 0.32;
    });
    daunGoyang.forEach(function (d) { // tanaman bergoyang pelan seperti tertiup angin
      d.m.rotation.x = d.x + Math.sin(waktu * 1.1 + d.fase) * 0.05;
      d.m.rotation.z = d.z + Math.sin(waktu * 0.8 + d.fase * 1.3) * 0.04;
    });
  }

  /* ============ 12b. TV DI DINDING PINTU: video 3D Jurnal Ramadhan ============ */
  const tv = grup(scene, 1.8, 0, 2.97, Math.PI); // menghadap ke dalam kamar
  papan(tv, W.putih, 1.5, 0.42, 0.38, 0.05, 0, 0.21, 0.2); // meja TV rendah
  bayangan(1.8, 2.76, 1.7, 0.6);
  [-0.36, 0.36].forEach(function (x) {
    papan(tv, W.lavMuda, 0.66, 0.3, 0.02, 0.04, x, 0.21, 0.4);
    bola(tv, W.emas, 0.018, x + (x < 0 ? 0.26 : -0.26), 0.21, 0.42);
  });
  const layarTV = grup(tv, 0, 1.42, 0.04);
  papan(layarTV, 0x6f6788, 1.72, 1.0, 0.05, 0.04, 0, 0, 0);
  // Layar TV menampilkan video 3D Jurnal Ramadhan (film-tv.js), digambar langsung tiap bingkai
  const film = buatFilmTV(THREE, renderer, { logoF: LOGO_F, logoK: LOGO_K });
  const bahanTV = new THREE.MeshBasicMaterial({ map: film.tekstur });
  bahanTV.userData.tetapTerang = true; // layar tetap menyala di kamar gelap
  bidang(layarTV, bahanTV, 1.6, 0.9, 0, 0, 0.03);
  cahayaLembut(tv, 0xd8ccff, 0.35, 2.6, 1.6, 0, 1.42, 0.005); // pendar lembut di dinding

  /* ============ 13. DUA BENDA YANG BISA DIKLIK ============ */
  // Kotak tak terlihat yang lebih besar, supaya mudah disentuh di HP
  function areaKlik(induk, nama, l, t, d, x, y, z) {
    const m = mesh(induk, new THREE.BoxGeometry(l, t, d),
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false }), x, y, z);
    m.userData.benda = nama;
    return m;
  }
  const BENDA = {
    jurnal: { area: areaKlik(jurnal, "jurnal", 0.6, 0.75, 0.4, 0, 0.28, 0), jarak: 1.0, tinggi: 0.3 },
    quran: { area: areaKlik(quran, "quran", 0.8, 0.6, 0.6, 0, 0.2, 0), jarak: 0.95, tinggi: 0.5 }
  };
  // Tempat yang bisa diduduki atau ditiduri. Kotaknya rendah supaya tidak menghalangi buku di meja.
  const TEMPAT = {
    bangku: { area: areaKlik(bangku, "bangku", 0.6, 0.55, 0.6, 0, 0.32, 0), pose: "kursi" },
    kasur: { area: areaKlik(kasur, "kasur", 1.4, 0.5, 2.4, 0, 0.45, 0.05), pose: "kasurDuduk" },
    sajadah: { area: areaKlik(sajadah, "sajadah", 0.75, 0.14, 1.2, 0, 0.07, 0), pose: "sajadahBerdiri" },
    tv: { area: areaKlik(layarTV, "tv", 1.8, 1.1, 0.2, 0, 0, 0.05), pose: "sajadahDuduk", tempat: "sajadah" }, // sentuh TV = duduk menonton
    jendela: { area: areaKlik(jendela, "jendela", JENDELA.l, JENDELA.t, 0.12, 0, 0, 0.06), pose: "jendela" },
    lemari: { area: areaKlik(lemari, "lemari", LEMARI.l, LEMARI.t, 0.08, 0, LEMARI.t / 2, LEMARI.d / 2 + 0.04), pose: "lemari" },
    rak: { area: areaKlik(rak, "rak", 1.3, 1.75, 0.08, 0, 0.87, 0.2), pose: "rak" },
    // Pulpen dan buku catatan: duduk lalu menulis
    pulpen: { area: areaKlik(meja, "pulpen", 0.42, 0.1, 0.14, -0.02, 0.83, 0.36), pose: "menulis", tempat: "bangku" },
    bukuTulis: { area: areaKlik(bukuTulis, "bukuTulis", BUKU.l + 0.04, 0.08, BUKU.d + 0.04, 0, 0.03, 0), pose: "menulis", tempat: "bangku" }
  };
  const daftarArea = [BENDA.jurnal.area, BENDA.quran.area].concat(Object.keys(TEMPAT).map(function (n) { return TEMPAT[n].area; }));
  const cahayaBenda = [
    cahayaLembut(jurnal, 0xffd98a, 0.5, 1.1, 1.1, 0, 0.28, -0.1),
    cahayaLembut(quran, 0xffd98a, 0.5, 1.3, 1.1, 0, 0.22, -0.2)
  ];

  scene.updateMatrixWorld(true);
  Object.keys(BENDA).forEach(function (nama) {
    const b = BENDA[nama];
    b.pusat = b.area.getWorldPosition(new THREE.Vector3());
    b.titikLabel = b.pusat.clone();
    b.titikLabel.y += nama === "jurnal" ? -0.52 : 0.34; // label jurnal di bawah, jendela tetap terlihat
  });

  /* Pose: posisi mata, arah pandang, dan batas menoleh.
     yaw 0 = menghadap dinding jendela, -PI/2 = menghadap kanan, PI = menghadap pintu.
     bebas.yaw = boleh menoleh sejauh ini dari arah awal; pMin/pMax = batas menunduk dan mendongak. */
  const MATA = 1.55; // tinggi mata saat berdiri
  function dariSajadah(lz) { return sajadah.localToWorld(new THREE.Vector3(0, 0, lz)); }
  const sajadahBerdiri = dariSajadah(0.5), sajadahDuduk = dariSajadah(0.4), sajadahKeluar = dariSajadah(1.0);
  const ARAH_SAJADAH = sajadah.rotation.y; // ujung mihrab, lurus ke TV

  // Titik berdiri di samping tiap tempat: tempat kita bangun dan dari mana kita mendekat
  const BANGUN = {
    bangku: { x: 0.72, z: -0.85, yaw: 0 },
    kasur: { x: -1.1, z: -1.1, yaw: -Math.PI / 2 },
    sajadah: { x: sajadahKeluar.x, z: sajadahKeluar.z, yaw: ARAH_SAJADAH },
    jendela: { x: 0, z: -1.4, yaw: 0 },
    rak: { x: -0.45, z: 1.2, yaw: Math.PI / 2 }, // di belakang posisi melihat, jadi berjalan maju ke rak
    lemari: { x: 0.85, z: LEMARI.z, yaw: -Math.PI / 2 }
  };

  const POSE = {
    kursi: {
      tempat: "bangku", judul: "Duduk di kursi belajar",
      x: 0.72, y: 1.24, z: -1.25, yaw: 0.32, pitch: -0.32, // sedikit menoleh ke buku jurnal
      bebas: { yaw: 1.4, pMin: -0.95, pMax: 0.5 },
      pilihan: [["Berdiri", "berdiri"]]
    },
    kasurDuduk: {
      tempat: "kasur", judul: "Duduk di tepi kasur",
      x: -1.76, y: 1.12, z: -1.15, yaw: -Math.PI / 2, pitch: -0.12,
      bebas: { yaw: 1.7, pMin: -0.8, pMax: 0.6 },
      pilihan: [["Rebahan", "kasurTidur"], ["lampu", "lampu"], ["Berdiri", "berdiri"]]
    },
    kasurTidur: { // kepala di bantal, menghadap ke kaki sambil memandang langit-langit
      tempat: "kasur", judul: "Rebahan sebentar",
      x: -2.25, y: 0.9, z: -2.2, yaw: Math.PI + 0.55, pitch: 0.42, // agak ke tengah kamar, lampu gantung terlihat
      bebas: { yaw: 1.0, pMin: 0.1, pMax: 1.5 },
      pilihan: [["lampu", "lampu"], ["Duduk", "kasurDuduk"], ["Berdiri", "berdiri"]]
    },
    sajadahBerdiri: {
      tempat: "sajadah", judul: "Berdiri di atas sajadah",
      x: sajadahBerdiri.x, y: MATA, z: sajadahBerdiri.z, yaw: ARAH_SAJADAH, pitch: -0.3, // sajadah dan TV terlihat
      bebas: { yaw: 1.2, pMin: -0.9, pMax: 0.5 },
      pilihan: [["Duduk", "sajadahDuduk"], ["Selesai", "berdiri"]]
    },
    sajadahDuduk: {
      tempat: "sajadah", judul: "Menonton video Jurnal Ramadhan",
      x: sajadahDuduk.x, y: 0.88, z: sajadahDuduk.z, yaw: ARAH_SAJADAH, pitch: 0.08, // menatap layar TV
      bebas: { yaw: 1.2, pMin: -0.9, pMax: 0.55 },
      pilihan: [["suaraTV", "suaraTV"], ["Ulang video", "ulangTV"], ["Berdiri", "sajadahBerdiri"], ["Selesai", "berdiri"]]
    },
    jendela: { // condong di atas meja, jendela terbuka
      tempat: "jendela", judul: "Melongok dari jendela, geser untuk melihat sekeliling",
      x: 0, y: 1.74, z: -2.74, yaw: 0, pitch: 0.02, // tepat di bibir jendela
      bebas: { yaw: 1.05, pMin: -0.65, pMax: 0.55 },
      pilihan: [["Selesai", "berdiri"]]
    },
    lemari: {
      tempat: "lemari", judul: "Sentuh baju atau sepatu untuk melihat dari dekat",
      x: 0.85, y: 1.45, z: LEMARI.z, yaw: -Math.PI / 2, pitch: -0.2,
      bebas: { yaw: 1.0, pMin: -0.95, pMax: 0.4 },
      pilihan: [["Tutup lemari", "berdiri"]]
    },
    rak: { // berdiri di depan rak buku dekat ranjang
      tempat: "rak", judul: "Tekan buku lalu geser ke tingkat mana saja",
      x: -1.1, y: 1.0, z: 1.2, yaw: Math.PI / 2, pitch: -0.03,
      bebas: { yaw: 0.5, pMin: -0.4, pMax: 0.3 },
      pilihan: [["Susunan awal", "rakAwal"], ["Selesai", "berdiri"]],
      atur: function () { // mundur secukupnya supaya rak muat juga di layar tegak HP
        const tv = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
        const jarak = Math.max(1.6, 0.72 / (tv * Math.min(1, kamera.aspect)));
        this.x = -2.78 + 0.17 + jarak;
      }
    },
    menulis: { // duduk di kursi, menunduk tepat di atas buku catatan
      tempat: "bangku", judul: "Tulis atau coret apa saja dengan jari",
      x: 0, y: 1.1, z: 0, yaw: 0, pitch: -Math.PI / 2 + 0.001,
      bebas: { yaw: 0, pMin: -Math.PI / 2 + 0.001, pMax: -Math.PI / 2 + 0.001 },
      pilihan: [["Hijau", "tinta:#3f6650"], ["Pink", "tinta:#d27b9b"], ["Ungu", "tinta:#8a74c0"], ["Biru", "tinta:#5b8fc4"],
        ["Hapus", "hapus"], ["Selesai", "kursi"]],
      // Tinggi kamera menyesuaikan layar. Layar tegak (HP): satu halaman saja supaya lebih besar.
      atur: function () {
        const p = bukuTulis.getWorldPosition(new THREE.Vector3());
        const tv = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
        const tegak = kamera.aspect < 0.8;
        const lebar = tegak ? BUKU.l / 4 + 0.012 : BUKU.l / 2 + 0.02;
        const tinggi = Math.max(lebar / (tv * kamera.aspect), (BUKU.d / 2 + 0.02) / tv) * 1.04;
        this.x = p.x + (tegak ? (halamanKanan ? 1 : -1) * BUKU.l / 4 : 0);
        this.y = p.y + 0.03 + tinggi;
        this.z = p.z + tinggi * tv * 0.28; // buku sedikit naik di layar, tidak tertutup tombol
      }
    }
  };

  /* ============ 13b. LAMPU MATI: langit langit jadi galaksi ============ */
  // Catat warna asli semua bahan yang tidak terpengaruh cahaya, supaya bisa diredupkan lalu dipulihkan
  const bahanRedup = [];
  scene.traverse(function (o) {
    if (!o.material || Array.isArray(o.material)) return;
    const m = o.material;
    if (!m.isMeshBasicMaterial || m.userData.tetapTerang || m.userData.dicatat) return;
    m.userData.dicatat = true;
    bahanRedup.push({ m: m, warna: m.color.clone(), pekat: m.opacity, pendar: m.map === teksturTitik });
  });
  const cahayaBendaBahan = cahayaBenda.map(function (c) { return c.material; });

  const lukisanGalaksi = lukisan(1024, 1024, function (ctx, l, t) {
    ctx.fillStyle = "#080b1f";
    ctx.fillRect(0, 0, l, t);
    ctx.globalCompositeOperation = "lighter";
    // Awan nebula di sepanjang pita galaksi (miring dari kiri bawah ke kanan atas)
    const WARNA = ["rgba(150,90,230,0.38)", "rgba(255,120,190,0.30)", "rgba(80,160,255,0.32)", "rgba(90,225,210,0.22)"];
    for (let i = 0; i < 46; i++) {
      const p = acak(), x = p * l + (acak() - 0.5) * 220, y = (1 - p) * t + (acak() - 0.5) * 220;
      const r = 60 + acak() * 170;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, WARNA[i % WARNA.length]);
      g.addColorStop(1, "rgba(0,0,0,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // Bintang kecil: tersebar, lebih rapat di pita galaksi
    for (let i = 0; i < 1500; i++) {
      let x, y;
      if (i % 2) { const p = acak(); x = p * l + (acak() - 0.5) * 300; y = (1 - p) * t + (acak() - 0.5) * 300; }
      else { x = acak() * l; y = acak() * t; }
      ctx.fillStyle = "rgba(255,255,255," + (0.25 + acak() * 0.75) + ")";
      ctx.fillRect(x, y, acak() < 0.9 ? 1.5 : 2.5, acak() < 0.9 ? 1.5 : 2.5);
    }
    // Bintang terang dengan kilau silang
    for (let i = 0; i < 26; i++) {
      const x = acak() * l, y = acak() * t, r = 10 + acak() * 16;
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, "rgba(255,250,235,1)");
      g.addColorStop(0.25, "rgba(255,230,250,0.5)");
      g.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
      ctx.fillStyle = "rgba(255,255,255,0.55)";
      ctx.fillRect(x - r * 1.6, y - 0.75, r * 3.2, 1.5);
      ctx.fillRect(x - 0.75, y - r * 1.6, 1.5, r * 3.2);
    }
    // Tepi lingkaran memudar
    ctx.globalCompositeOperation = "destination-in";
    const tepi = ctx.createRadialGradient(l / 2, t / 2, l * 0.38, l / 2, t / 2, l / 2);
    tepi.addColorStop(0, "rgba(0,0,0,1)");
    tepi.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = tepi;
    ctx.fillRect(0, 0, l, t);
  });
  lukisanGalaksi.transparent = true;
  lukisanGalaksi.depthWrite = false;
  lukisanGalaksi.opacity = 0;
  const galaksi = mesh(scene, new THREE.CircleGeometry(2.96, 72), lukisanGalaksi, 0, 2.97, 0);
  galaksi.rotation.x = Math.PI / 2; // menghadap ke bawah
  galaksi.visible = false;

  // Bintang berkelip: dua kelompok bergantian, di langit langit dan dinding bagian atas
  function kelompokBintang(jumlah) {
    const titik = [];
    for (let i = 0; i < jumlah; i++) {
      const sisi = acak();
      if (sisi < 0.6) titik.push((acak() - 0.5) * 5.8, 2.95, (acak() - 0.5) * 5.8);
      else {
        const y = 2.5 + acak() * 0.45, s = (acak() - 0.5) * 5.8;
        if (sisi < 0.7) titik.push(-2.97, y, s);
        else if (sisi < 0.8) titik.push(2.97, y, s);
        else if (sisi < 0.9) titik.push(s, y, -2.97);
        else titik.push(s, y, 2.97);
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.Float32BufferAttribute(titik, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({
      map: teksturTitik, color: 0xfff6e0, size: 0.07, transparent: true, opacity: 0,
      depthWrite: false, blending: THREE.AdditiveBlending
    }));
    p.visible = false;
    scene.add(p);
    return p;
  }
  const kelip = [kelompokBintang(140), kelompokBintang(140)];

  const WARNA_SIANG = { latar: new THREE.Color(0xfff8f6), langit: new THREE.Color(0xffffff), tanah: new THREE.Color(0xfff5ee) };
  const WARNA_MALAM = { latar: new THREE.Color(0x0a0c20), langit: new THREE.Color(0x5a5aa8), tanah: new THREE.Color(0x1c1634), redup: new THREE.Color(0.16, 0.17, 0.32) };
  const putih = new THREE.Color(1, 1, 1), sementara = new THREE.Color();
  let gelap = 0, gelapTuju = 0;

  function aturGelap(g) {
    scene.background.copy(WARNA_SIANG.latar).lerp(WARNA_MALAM.latar, g);
    langit.color.copy(WARNA_SIANG.langit).lerp(WARNA_MALAM.langit, g);
    langit.groundColor.copy(WARNA_SIANG.tanah).lerp(WARNA_MALAM.tanah, g);
    langit.intensity = 0.95 - 0.6 * g;
    matahari.intensity = 0.16 * (1 - g);
    sinarLampu.intensity = 0.35 * (1 - g);
    sementara.copy(putih).lerp(WARNA_MALAM.redup, g); // gambar dan pemandangan jadi biru gelap
    bahanRedup.forEach(function (b) {
      b.m.color.copy(b.warna).multiply(sementara);
      if (b.pendar && cahayaBendaBahan.indexOf(b.m) < 0) b.m.opacity = b.pekat * (1 - g);
    });
    galaksi.visible = g > 0;
    lukisanGalaksi.opacity = g;
    kelip.forEach(function (k) { k.visible = g > 0; });
  }

  function nyalakanLampu(nyala) {
    gelapTuju = nyala ? 0 : 1;
    if (kurangiGerak) { gelap = gelapTuju; aturGelap(gelap); hidupkanSuasana(); gambarUlang(); }
  }

  /* ============ 14. KAMERA DAN KEADAAN ============ */
  let fase = "luar"; // luar -> jalan -> dalam -> jalan -> dekat
  let anim = null;
  let waktu = 0;
  let berhenti = false;
  let geserTampilan = 0; // di luar: gambar digeser naik supaya pintu tidak tertutup tulisan

  const pos = new THREE.Vector3(0, 1.45, 7);
  let yaw = 0, pitch = -0.08;
  const tuju = { x: 0, z: 2.2, yaw: 0, pitch: -0.08 }; // posisi yang dituju saat menjelajah
  let sebelumDekat = null;

  const jepit = function (n, a, b) { return Math.max(a, Math.min(b, n)); };
  const halus = function (t) { return t * t * (3 - 2 * t); };

  function animasikan(lama, tiap, selesai) {
    if (kurangiGerak) {
      tiap(1);
      anim = null;
      if (selesai) selesai();
      gambarUlang();
    } else {
      anim = { lama: lama, t: 0, tiap: tiap, selesai: selesai };
    }
  }

  function aturPosisiLuar() {
    // Mundur secukupnya supaya pintu dan hiasannya masuk layar
    const setengah = Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2)) * kamera.aspect;
    pos.set(0, 1.4, 3.1 + jepit(1.5 / setengah, 4.6, 5.2));
    geserTampilan = kamera.aspect < 0.8 ? 0.1 : 0.2;
    yaw = 0;
    pitch = kamera.aspect < 0.8 ? -0.1 : -0.03;
  }

  function aturUkuran() {
    const l = kanvas.clientWidth, t = kanvas.clientHeight;
    if (!l || !t) return;
    kamera.aspect = l / t;
    kamera.fov = kamera.aspect < 0.8 ? 72 : 58;
    kamera.updateProjectionMatrix();
    kameraLihat.aspect = l / t;
    kameraLihat.updateProjectionMatrix();
    aturKameraLihat();
    renderer.setSize(l, t, false);
    if (fase === "luar") aturPosisiLuar();
    gambarUlang();
  }

  function pasangKamera() {
    const l = kanvas.clientWidth, t = kanvas.clientHeight;
    if (geserTampilan) kamera.setViewOffset(l, t, 0, geserTampilan * t, l, t);
    else kamera.clearViewOffset();
    kamera.position.copy(pos);
    kamera.rotation.set(pitch, yaw, 0);
    kamera.updateMatrixWorld();
  }

  function gambarUlang() {
    aturLabel();
    if (fase === "lihat") { // sedang melihat pakaian dari dekat
      renderer.render(sceneLihat, kameraLihat);
      return;
    }
    pasangKamera();
    renderer.render(scene, kamera);
  }

  function mulaiDiDalam() {
    fase = "dalam";
    pintu.rotation.y = 0; // pintu tertutup lagi di belakang kita
    geserTampilan = 0;
    pos.set(0, MATA, 2.2);
    tuju.x = 0; tuju.z = 2.2; tuju.yaw = yaw = 0; tuju.pitch = pitch = -0.08;
    opsi.saatMasuk();
  }

  function masuk() {
    if (fase !== "luar") return;
    fase = "jalan";
    const awal = pos.clone(), pitchAwal = pitch, geserAwal = geserTampilan;
    animasikan(3.2, function (t) {
      pintu.rotation.y = halus(jepit(t / 0.42, 0, 1)) * 1.75;
      const j = halus(jepit((t - 0.25) / 0.75, 0, 1));
      pos.set(0, awal.y + (MATA - awal.y) * j, awal.z + (2.2 - awal.z) * j);
      pitch = pitchAwal + (-0.08 - pitchAwal) * j;
      geserTampilan = geserAwal * (1 - j);
    }, mulaiDiDalam);
  }

  // Selisih sudut terpendek
  function beda(a, b) {
    return Math.atan2(Math.sin(a - b), Math.cos(a - b));
  }

  function arahKe(titik, dari) {
    const d = titik.clone().sub(dari);
    return { yaw: Math.atan2(-d.x, -d.z), pitch: Math.atan2(d.y, Math.hypot(d.x, d.z)) };
  }

  // Mendekati benda, lalu memberi tahu index.html
  function pilih(nama) {
    if (fase !== "dalam") return;
    const b = BENDA[nama];
    if (pose === "sajadahDuduk") film.tonton(false); // membuka Al Qur'an atau jurnal: suara TV diam
    fase = "jalan";
    sebelumDekat = { pos: pos.clone(), yaw: yaw, pitch: pitch };
    const keTengah = new THREE.Vector3(0, b.pusat.y, 1.2).sub(b.pusat).setY(0).normalize();
    const akhir = b.pusat.clone().addScaledVector(keTengah, b.jarak);
    akhir.y = b.pusat.y + b.tinggi;
    const arah = arahKe(b.pusat, akhir);
    const putar = beda(arah.yaw, yaw), awal = pos.clone(), yawAwal = yaw, pitchAwal = pitch;
    animasikan(1.3, function (t) {
      const j = halus(t);
      pos.lerpVectors(awal, akhir, j);
      yaw = yawAwal + putar * j;
      pitch = pitchAwal + (arah.pitch - pitchAwal) * j;
    }, function () {
      fase = "dekat";
      opsi.saatPilih(nama);
    });
  }

  function kembali() {
    if (fase !== "dekat" || !sebelumDekat) return;
    fase = "jalan";
    const a = { pos: pos.clone(), yaw: yaw, pitch: pitch }, b = sebelumDekat;
    const putar = beda(b.yaw, a.yaw);
    animasikan(1, function (t) {
      const j = halus(t);
      pos.lerpVectors(a.pos, b.pos, j);
      yaw = a.yaw + putar * j;
      pitch = a.pitch + (b.pitch - a.pitch) * j;
    }, function () {
      fase = "dalam";
      tuju.x = pos.x; tuju.z = pos.z; tuju.yaw = yaw; tuju.pitch = pitch;
      if (pose === "sajadahDuduk") film.tonton(true); // kembali menonton
    });
  }

  /* ---- Duduk, rebahan, berdiri di sajadah ---- */
  let pose = "berdiri";
  let pusatYaw = 0; // arah awal pose, batas menoleh dihitung dari sini

  // Berjalan melewati beberapa titik berurutan
  function gerakBertahap(langkah, selesai) {
    if (!langkah.length) { selesai(); return; }
    const t = langkah.shift();
    const awal = pos.clone(), akhir = new THREE.Vector3(t.x, t.y, t.z);
    const yawAwal = yaw, yawAkhir = yaw + beda(t.yaw, yaw), pitchAwal = pitch;
    const lama = jepit(awal.distanceTo(akhir) * 0.8, 0.8, 2);
    animasikan(lama, function (k) {
      const j = halus(k);
      pos.lerpVectors(awal, akhir, j);
      yaw = yawAwal + (yawAkhir - yawAwal) * j;
      pitch = pitchAwal + (t.pitch - pitchAwal) * j;
    }, function () { gerakBertahap(langkah, selesai); });
  }

  function titikBangun(tempat, menghadap) {
    const b = BANGUN[tempat];
    const yawBangun = menghadap ? arahKe(new THREE.Vector3(menghadap.x, 0, menghadap.z), new THREE.Vector3(b.x, 0, b.z)).yaw : b.yaw;
    return { x: b.x, y: MATA, z: b.z, yaw: yawBangun, pitch: -0.15 };
  }

  // Tombol "lampu" berganti tulisan sesuai keadaan
  function pilihanPose(p) {
    let daftar = p.pilihan;
    if (p === POSE.menulis && kamera.aspect < 0.8) { // layar tegak: tombol pindah halaman
      daftar = daftar.slice();
      daftar.splice(4, 0, [halamanKanan ? "‹ Halaman kiri" : "Halaman kanan ›", "halaman"]);
    }
    return daftar.map(function (x) {
      if (x[1] === "lampu") return [gelapTuju ? "Nyalakan lampu" : "Matikan lampu", "lampu"];
      if (x[1] === "suaraTV") return [film.suaraNyala() ? "🔊 Suara nyala" : "🔇 Suara mati", "suaraTV"];
      if (x[1].indexOf("tinta:") === 0) return [x[0], x[1], x[1] === "tinta:" + warnaTinta]; // tanda warna aktif
      return x;
    });
  }

  function ubahPose(nama) {
    if (fase !== "dalam") return;
    if (nama === "rakAwal") { // kembalikan susunan buku seperti semula
      susunanRak = susunanAwal();
      aturRak(susunanRak, -1, kurangiGerak);
      simpanSusunanRak();
      if (kurangiGerak) gambarUlang();
      return;
    }
    if (seretan) selesaiSeret(); // keluar dari rak saat masih menyeret: taruh dulu bukunya
    if (pose === "menulis" && (nama.indexOf("tinta:") === 0 || nama === "hapus" || nama === "halaman")) {
      if (nama === "hapus") hapusCoretan();
      else if (nama === "halaman") { // geser kamera ke halaman sebelah
        halamanKanan = !halamanKanan;
        POSE.menulis.atur();
        tuju.x = POSE.menulis.x;
        if (kurangiGerak) segerakan();
      } else warnaTinta = nama.slice(6);
      opsi.saatPose(pose, POSE.menulis.judul, pilihanPose(POSE.menulis));
      return;
    }
    if (pose === "sajadahDuduk" && (nama === "suaraTV" || nama === "ulangTV")) {
      if (nama === "suaraTV") film.aturSuara(!film.suaraNyala());
      else film.tonton(true); // ulang dari adegan pertama
      opsi.saatPose(pose, POSE[pose].judul, pilihanPose(POSE[pose]));
      return;
    }
    if (nama === "lampu") {
      if (!POSE[pose]) return;
      nyalakanLampu(gelapTuju > 0);
      opsi.saatPose(pose, POSE[pose].judul, pilihanPose(POSE[pose]));
      return;
    }
    if (nama === pose || (nama !== "berdiri" && !POSE[nama])) return;
    const dari = POSE[pose] || null, ke = POSE[nama] || null;
    if (ke && ke.atur) ke.atur();
    if (!ke || ke.tempat !== "kasur") nyalakanLampu(true); // turun dari kasur: lampu menyala lagi
    const pindahTempat = !dari || !ke || dari.tempat !== ke.tempat;
    const langkah = [];
    if (dari && pindahTempat) langkah.push(titikBangun(dari.tempat)); // bangun dulu
    if (ke && pindahTempat) {
      const b = BANGUN[ke.tempat];
      if (dari || Math.hypot(pos.x - b.x, pos.z - b.z) > 0.35) langkah.push(titikBangun(ke.tempat, ke)); // jalan ke sampingnya
    }
    if (ke) langkah.push(ke);

    if (pose === "sajadahDuduk") film.tonton(false); // berhenti menonton: suara TV diam
    pose = nama;
    if (kurangiGerak) gerakPerabot(99); // tanpa animasi: jendela dan lemari langsung terbuka
    fase = "jalan";
    opsi.saatPose(null);
    gerakBertahap(langkah, function () {
      fase = "dalam";
      pusatYaw = yaw;
      tuju.x = pos.x; tuju.z = pos.z; tuju.yaw = yaw; tuju.pitch = pitch;
      if (nama === "sajadahDuduk") film.tonton(true); // duduk di depan TV: video diputar dari awal dengan suara
      opsi.saatPose(nama, ke ? ke.judul : "", ke ? pilihanPose(ke) : []);
    });
  }

  // Sentuh tempat yang sedang diduduki: tidak terjadi apa apa
  function sentuhTempat(nama) {
    if (POSE[pose] && POSE[pose].tempat === nama) return;
    if (nama === "tv" && pose === "sajadahDuduk") return;
    ubahPose(TEMPAT[nama].pose);
  }

  /* ---- Menyeret buku di rak ---- */
  // seretan = { id, kerja: susunan tanpa buku ini, tampil: susunan dengan buku di calon tempatnya (null = tidak muat) }
  let seretan = null;
  const bidangRak = new THREE.Plane(), titikRak = new THREE.Vector3();

  function mulaiSeret(e) {
    if (pose !== "rak") return false;
    arahkanSinar(e);
    const kena = sinar.intersectObjects(bukuRak, true);
    let o = kena.length ? kena[0].object : null;
    while (o && o.userData.bukuRak === undefined) o = o.parent;
    if (!o) return false;
    const id = o.userData.bukuRak;
    // Bidang tegak di depan rak: jari digeser di atas bidang ini
    rak.updateMatrixWorld();
    bidangRak.setFromNormalAndCoplanarPoint(
      new THREE.Vector3(0, 0, 1).transformDirection(rak.matrixWorld),
      rak.localToWorld(new THREE.Vector3(0, 0, 0.16)));
    seretan = {
      id: id,
      kerja: susunanRak.map(function (d) { return d.filter(function (x) { return x !== id; }); }),
      tampil: susunanRak
    };
    gerakSeret(e);
    return true;
  }

  function gerakSeret(e) {
    arahkanSinar(e);
    if (!sinar.ray.intersectPlane(bidangRak, titikRak)) return;
    const p = rak.worldToLocal(titikRak), d = BUKU_RAK[seretan.id], b = bukuRak[seretan.id];
    b.position.set(jepit(p.x, RAK.kiri, -RAK.kiri), jepit(p.y - d.h / 2, 0.3, 1.45), 0.16); // buku ditarik sedikit keluar
    // Tingkat tujuan dari tinggi jari, urutan dari posisi kiri kanan
    const tingkat = p.y < 0.88 ? 0 : p.y < 1.3 ? 1 : 2;
    const daftar = seretan.kerja[tingkat];
    let urutan = 0, x = RAK.kiri;
    daftar.forEach(function (id) { // hitung dari susunan tanpa buku ini, supaya tidak bolak-balik
      if (x + BUKU_RAK[id].t / 2 < p.x) urutan++;
      x += BUKU_RAK[id].t + RAK.celah;
    });
    if (lebarTingkat(daftar) + d.t + RAK.celah > RAK.lebar) {
      seretan.tampil = null; // tingkat penuh
      aturRak(seretan.kerja, seretan.id, false);
    } else {
      seretan.tampil = seretan.kerja.map(function (x) { return x.slice(); });
      seretan.tampil[tingkat].splice(urutan, 0, seretan.id);
      aturRak(seretan.tampil, seretan.id, false); // buku lain bergeser memberi tempat
    }
    if (kurangiGerak) gambarUlang();
  }

  function selesaiSeret() {
    if (seretan.tampil) { // muat: pakai susunan baru. Tidak muat: buku kembali ke tempat asal.
      susunanRak = seretan.tampil;
      simpanSusunanRak();
    }
    aturRak(susunanRak, -1, kurangiGerak);
    seretan = null;
    if (kurangiGerak) gambarUlang();
  }

  function gerakBukuRak(detik) {
    const k = 1 - Math.exp(-14 * detik);
    bukuRak.forEach(function (b, id) {
      if (seretan && seretan.id === id) return;
      b.position.lerp(b.userData.tuju, k);
    });
  }

  /* ---- Menulis di buku catatan ---- */
  let warnaTinta = "#3f6650", goresan = null, tintaBerubah = false, waktuSimpan = 0, halamanKanan = false;

  // Titik di kanvas tinta yang disentuh jari, atau null kalau di luar halaman
  function titikDiBuku(e) {
    arahkanSinar(e);
    const kena = sinar.intersectObject(halamanBuku);
    if (!kena.length || !kena[0].uv) return null;
    return { x: kena[0].uv.x * BUKU.kanvasL, y: (1 - kena[0].uv.y) * BUKU.kanvasT };
  }

  function gores(e, mulai) {
    const t = titikDiBuku(e);
    if (!t) { goresan = null; return; }
    ctxTinta.strokeStyle = ctxTinta.fillStyle = warnaTinta;
    ctxTinta.lineWidth = 5;
    ctxTinta.lineCap = ctxTinta.lineJoin = "round";
    if (mulai || !goresan) { // satu titik saat baru menyentuh
      ctxTinta.beginPath();
      ctxTinta.arc(t.x, t.y, 2.5, 0, Math.PI * 2);
      ctxTinta.fill();
    } else {
      ctxTinta.beginPath();
      ctxTinta.moveTo(goresan.x, goresan.y);
      ctxTinta.lineTo(t.x, t.y);
      ctxTinta.stroke();
    }
    goresan = t;
    tintaBerubah = true; // tekstur diperbarui sekali per bingkai, bukan tiap gerakan jari
    if (kurangiGerak) perbaruiTinta();
  }

  function perbaruiTinta() {
    if (!tintaBerubah) return;
    tintaBerubah = false;
    teksturTinta.needsUpdate = true;
    if (kurangiGerak) gambarUlang();
  }

  function simpanCoretan() {
    clearTimeout(waktuSimpan);
    waktuSimpan = setTimeout(function () {
      try { localStorage.setItem(KUNCI_CORETAN, kanvasTinta.toDataURL("image/png")); } catch (err) { /* penuh atau diblokir */ }
    }, 400);
  }

  function hapusCoretan() {
    ctxTinta.clearRect(0, 0, BUKU.kanvasL, BUKU.kanvasT);
    tintaBerubah = true;
    perbaruiTinta();
    try { localStorage.removeItem(KUNCI_CORETAN); } catch (err) { /* diblokir */ }
  }

  /* ---- Jendela dan pintu lemari terbuka saat didekati ---- */
  let bukaJendela = 0, bukaLemari = 0;
  function gerakPerabot(detik) {
    const tJ = pose === "jendela" ? 1 : 0, tL = pose === "lemari" ? 1 : 0;
    if (bukaJendela !== tJ) {
      bukaJendela = tJ > bukaJendela ? Math.min(1, bukaJendela + detik / 1.2) : Math.max(0, bukaJendela - detik / 1.2);
      daunJendela.forEach(function (d) { d.rotation.y = -d.userData.arah * 1.55 * halus(bukaJendela); });
    }
    // Tirai selalu bergerak sangat pelan; lebih terasa saat jendela dibuka dan angin masuk
    tirai.forEach(function (t, i) { t.rotation.z = Math.sin(waktu * (1 + bukaJendela * 0.4) + i * 0.6) * (0.012 + 0.035 * bukaJendela); });
    if (bukaLemari !== tL) {
      bukaLemari = tL > bukaLemari ? Math.min(1, bukaLemari + detik / 1.0) : Math.max(0, bukaLemari - detik / 1.0);
      pintuLemari.forEach(function (p, i) { p.rotation.y = (i ? 1 : -1) * 1.75 * halus(bukaLemari); });
    }
  }

  /* ---- Melihat pakaian dan sepatu dari dekat, bisa diputar ---- */
  const sceneLihat = new THREE.Scene();
  sceneLihat.background = new THREE.Color(0xfbf3f6);
  sceneLihat.add(new THREE.HemisphereLight(0xffffff, 0xe9dbe6, 0.72));
  const cahayaLihat = new THREE.DirectionalLight(0xffffff, 0.5);
  cahayaLihat.position.set(1, 2, 3);
  sceneLihat.add(cahayaLihat);
  tabung(sceneLihat, W.lavMuda, 0.62, 0.62, 0.04, 0, -0.6, 0);
  mesh(sceneLihat, new THREE.TorusGeometry(0.62, 0.012, 8, 64), W.sage, 0, -0.58, 0).rotation.x = Math.PI / 2;
  const kameraLihat = new THREE.PerspectiveCamera(35, 1, 0.01, 30);
  const pivot = new THREE.Group();
  sceneLihat.add(pivot);
  const putarLihat = { x: 0.1, y: 0.5 };
  let isiLihat = null;

  // Benda berputar di atas alas; geser atas bawah = kamera naik turun mengitari benda
  function aturKameraLihat() {
    // Benda dinormalkan selebar 1 meter; mundur secukupnya supaya muat juga di layar tegak HP
    const d = 0.8 / (Math.tan(THREE.MathUtils.degToRad(kameraLihat.fov / 2)) * Math.min(1, kameraLihat.aspect)) + 0.3;
    const naik = 0.12 + putarLihat.x;
    kameraLihat.position.set(0, Math.sin(naik) * d - 0.1, Math.cos(naik) * d);
    kameraLihat.lookAt(0, -0.1, 0);
  }
  function pasangPutar() {
    pivot.rotation.set(0, putarLihat.y, 0);
    aturKameraLihat();
  }

  function bukaLihat(i) {
    if (fase !== "dalam") return;
    const b = pakaian[i];
    const salinan = b.userData.buat();
    salinan.updateMatrixWorld(true);
    const kotakB = new THREE.Box3().setFromObject(salinan);
    const ukuran = kotakB.getSize(new THREE.Vector3()), pusat = kotakB.getCenter(new THREE.Vector3());
    salinan.position.sub(pusat);
    isiLihat = new THREE.Group();
    isiLihat.add(salinan);
    const skala = 1 / Math.max(ukuran.x, ukuran.y, ukuran.z);
    isiLihat.scale.setScalar(skala);
    isiLihat.position.y = -0.58 + ukuran.y * skala / 2; // berdiri di atas alas
    pivot.add(isiLihat);
    const sepatu = b.position.y < 1; // alas kaki dilihat agak dari atas
    putarLihat.x = sepatu ? 0.45 : 0.08;
    putarLihat.y = sepatu ? 0.7 : 0.4;
    pasangPutar();
    fase = "lihat";
    opsi.saatLihat(b.userData.nama);
    gambarUlang();
  }

  function tutupLihat() {
    if (fase !== "lihat") return;
    pivot.remove(isiLihat);
    isiLihat.traverse(function (o) { if (o.geometry) o.geometry.dispose(); });
    isiLihat = null;
    fase = "dalam";
    opsi.saatLihat(null);
    gambarUlang();
  }

  /* ============ 15. MENJELAJAH: geser, cubit, gulir, tombol ============ */
  // Seluruh lantai boleh dijelajahi, kecuali perabot. Tiap baris: [x kiri, x kanan, z belakang, z depan].
  const BADAN = 0.28; // jarak badan dari perabot dan dinding
  const PENGHALANG = [
    [-1.28, 1.28, -2.95, -1.95], // meja belajar
    [0.47, 0.97, -1.8, -1.3],    // bangku
    [1.62, 2.78, -2.72, -1.68],  // lemari kecil pojok shalat
    [-2.95, -1.55, -2.72, -0.2], // kasur
    [-2.98, -2.58, 0.56, 1.84],  // rak buku
    [-2.85, -2.35, 2.2, 2.7],    // pot bunga
    [2.38, 3, LEMARI.z - LEMARI.l / 2, LEMARI.z + LEMARI.l / 2], // lemari pakaian
    [1.05, 2.55, 2.58, 2.98]     // meja TV
  ];

  function bebasDi(x, z) {
    if (Math.abs(x) > 3 - BADAN || Math.abs(z) > 3 - BADAN) return false;
    return !PENGHALANG.some(function (p) {
      return x > p[0] - BADAN && x < p[1] + BADAN && z > p[2] - BADAN && z < p[3] + BADAN;
    });
  }

  function melangkah(jarak) {
    if (pose !== "berdiri") return; // sedang duduk atau rebahan
    const nx = tuju.x - Math.sin(tuju.yaw) * jarak, nz = tuju.z - Math.cos(tuju.yaw) * jarak;
    // Menabrak perabot: tetap bergeser menyusuri sisinya
    if (bebasDi(nx, nz)) { tuju.x = nx; tuju.z = nz; }
    else if (bebasDi(nx, tuju.z)) tuju.x = nx;
    else if (bebasDi(tuju.x, nz)) tuju.z = nz;
    if (kurangiGerak) segerakan();
  }

  function menoleh(dyaw, dpitch) {
    const b = POSE[pose] && POSE[pose].bebas;
    tuju.yaw += dyaw;
    if (b) {
      tuju.yaw = pusatYaw + jepit(beda(tuju.yaw, pusatYaw), -b.yaw, b.yaw);
      tuju.pitch = jepit(tuju.pitch + dpitch, b.pMin, b.pMax);
    } else {
      tuju.pitch = jepit(tuju.pitch + dpitch, -0.75, 0.6);
    }
    if (kurangiGerak) segerakan();
  }

  function segerakan() {
    pos.x = tuju.x; pos.z = tuju.z; yaw = tuju.yaw; pitch = tuju.pitch;
    gambarUlang();
  }

  const jari = new Map(); // pointer yang sedang menempel
  let geser = 0, jarakCubit = 0;

  kanvas.addEventListener("pointerdown", function (e) {
    jari.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try { kanvas.setPointerCapture(e.pointerId); } catch (err) { /* pointer sudah lepas */ }
    if (jari.size === 1) geser = 0;
    else geser = 99; // dua jari bukan klik
    jarakCubit = 0;
    if (fase === "dalam" && pose === "menulis" && jari.size === 1) gores(e, true);
    if (fase === "dalam" && pose === "rak" && jari.size === 1) mulaiSeret(e); // menekan buku = mulai menyeret
  });

  kanvas.addEventListener("pointermove", function (e) {
    const j = jari.get(e.pointerId);
    if (!j) { // mouse tanpa ditekan: ubah kursor di atas benda
      if (pose === "menulis") { kanvas.style.cursor = "crosshair"; return; }
      if (pose === "rak") { kanvas.style.cursor = "grab"; return; }
      kanvas.style.cursor = fase === "dalam" && (pakaianDi(e) >= 0 || bendaDi(e)) ? "pointer" : "";
      return;
    }
    if (seretan) { // sedang menyeret buku: buku mengikuti jari, kamera diam
      if (jari.size === 1) gerakSeret(e);
      j.x = e.clientX;
      j.y = e.clientY;
      return;
    }
    if (fase === "dalam" && pose === "menulis") { // menulis: jari mencoret, tidak menoleh
      if (jari.size === 1) gores(e, false);
      j.x = e.clientX;
      j.y = e.clientY;
      return;
    }
    const dx = e.clientX - j.x, dy = e.clientY - j.y;
    j.x = e.clientX;
    j.y = e.clientY;
    if (fase === "lihat" && jari.size === 1) { // putar pakaian dengan jari
      putarLihat.y += dx * 0.012;
      putarLihat.x = jepit(putarLihat.x + dy * 0.006, -0.25, 1.0);
      pasangPutar();
      if (kurangiGerak) gambarUlang();
      return;
    }
    if (fase !== "dalam") return;
    if (jari.size === 1) {
      geser += Math.abs(dx) + Math.abs(dy);
      if (geser > 8) menoleh(dx * 0.0045, dy * 0.0035);
    } else if (jari.size === 2) {
      const p = Array.from(jari.values());
      const jarak = Math.hypot(p[0].x - p[1].x, p[0].y - p[1].y);
      if (jarakCubit) melangkah((jarak - jarakCubit) * 0.009);
      jarakCubit = jarak;
    }
  });

  function lepas(e) {
    if (!jari.has(e.pointerId)) return;
    jari.delete(e.pointerId);
    jarakCubit = 0;
    if (seretan) { // jari dilepas: buku ditaruh di tempat barunya
      if (jari.size === 0) selesaiSeret();
      return;
    }
    if (pose === "menulis") { // selesai satu goresan: simpan, jangan dianggap menyentuh benda
      goresan = null;
      simpanCoretan();
      return;
    }
    if (e.type === "pointerup" && jari.size === 0 && geser <= 8 && fase === "dalam") {
      const p = pakaianDi(e);
      if (p >= 0) { bukaLihat(p); return; }
      const nama = bendaDi(e);
      if (BENDA[nama]) pilih(nama);
      else if (TEMPAT[nama]) sentuhTempat(nama);
    }
  }
  kanvas.addEventListener("pointerup", lepas);
  kanvas.addEventListener("pointercancel", lepas);

  kanvas.addEventListener("wheel", function (e) {
    e.preventDefault();
    if (fase === "dalam") melangkah(jepit(-e.deltaY * 0.002, -0.4, 0.4));
  }, { passive: false });

  // Raycaster: sinar dari kamera lewat titik sentuh. Benda pertama yang kena = diklik.
  const sinar = new THREE.Raycaster();
  function arahkanSinar(e) {
    const r = kanvas.getBoundingClientRect();
    sinar.setFromCamera({
      x: ((e.clientX - r.left) / r.width) * 2 - 1,
      y: -((e.clientY - r.top) / r.height) * 2 + 1
    }, kamera);
  }

  function bendaDi(e) {
    arahkanSinar(e);
    const kena = sinar.intersectObjects(daftarArea);
    return kena.length ? kena[0].object.userData.benda : null;
  }

  // Pakaian dan sepatu hanya bisa disentuh saat lemari terbuka. Hasil: nomor pakaian, atau -1.
  function pakaianDi(e) {
    if (pose !== "lemari") return -1;
    arahkanSinar(e);
    const kena = sinar.intersectObjects(pakaian, true);
    let o = kena.length ? kena[0].object : null;
    while (o && o.userData.pakaian === undefined) o = o.parent;
    return o ? o.userData.pakaian : -1;
  }

  // Tombol panah atau WASD
  const tombol = new Set();
  const TOMBOL = { ArrowUp: "maju", w: "maju", ArrowDown: "mundur", s: "mundur", ArrowLeft: "kiri", a: "kiri", ArrowRight: "kanan", d: "kanan" };
  window.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && fase === "lihat") { tutupLihat(); return; }
    const t = TOMBOL[e.key];
    if (!t || fase !== "dalam" || e.ctrlKey || e.metaKey || e.altKey) return;
    e.preventDefault();
    tekan(t);
  });
  window.addEventListener("keyup", function (e) { if (TOMBOL[e.key]) lepasTombol(TOMBOL[e.key]); });
  window.addEventListener("blur", function () { tombol.clear(); });

  function tekan(t) {
    if (kurangiGerak) langkahTombol(t, 0.25);
    else tombol.add(t);
  }
  function lepasTombol(t) { tombol.delete(t); }

  function langkahTombol(t, detik) {
    if (t === "maju") melangkah(1.5 * detik);
    if (t === "mundur") melangkah(-1.5 * detik);
    if (t === "kiri") menoleh(1.3 * detik, 0);
    if (t === "kanan") menoleh(-1.3 * detik, 0);
  }

  /* ============ 16. LABEL HTML DI ATAS BENDA ============ */
  const proyeksi = new THREE.Vector3();

  function aturLabel() {
    const l = kanvas.clientWidth, t = kanvas.clientHeight;
    Object.keys(BENDA).forEach(function (nama, i) {
      const label = opsi.label[nama];
      label.hidden = fase !== "dalam" || pose === "menulis";
      if (label.hidden) return;
      const b = BENDA[nama];
      proyeksi.copy(b.titikLabel).project(kamera);
      const tampak = proyeksi.z < 1 && Math.abs(proyeksi.x) < 0.96 && Math.abs(proyeksi.y) < 0.9;
      b.tampak = tampak;
      if (tampak) {
        const lebar = label.offsetWidth / 2 + 6;
        const x = jepit((proyeksi.x + 1) / 2 * l, lebar, l - lebar);
        label.dataset.arah = "";
        label.style.transform = "translate(" + x + "px," + (1 - proyeksi.y) / 2 * t + "px) translate(-50%,-100%)";
      } else {
        // Di luar layar: label menempel di tepi sebagai penunjuk arah
        const kiri = beda(arahKe(b.pusat, pos).yaw, yaw) > 0;
        label.dataset.arah = kiri ? "kiri" : "kanan";
        label.style.transform = "translate(" + (kiri ? 8 : l - 8) + "px," + t * (0.62 + i * 0.1) + "px) translate(" + (kiri ? "0" : "-100%") + ",-50%)";
      }
    });
  }

  // Label di layar = buka bendanya. Label di tepi = menoleh ke bendanya.
  Object.keys(BENDA).forEach(function (nama) {
    opsi.label[nama].addEventListener("click", function () {
      if (fase !== "dalam") return;
      if (BENDA[nama].tampak) { pilih(nama); return; }
      const a = arahKe(BENDA[nama].pusat, pos);
      menoleh(beda(a.yaw, tuju.yaw), a.pitch - tuju.pitch);
    });
  });

  /* ============ 17. ANIMASI LOOP ============ */
  const jam = new THREE.Clock();

  function loop() {
    const detik = Math.min(jam.getDelta(), 0.1);
    if (berhenti) return; // kitab sedang dibuka: hemat baterai
    waktu += detik;

    if (anim) {
      const a = anim;
      a.t = Math.min(1, a.t + detik / a.lama);
      a.tiap(a.t);
      if (a.t === 1) {
        if (anim === a) anim = null;
        if (a.selesai) a.selesai();
      }
    } else if (fase === "dalam") {
      tombol.forEach(function (t) { langkahTombol(t, detik); });
      const k = 1 - Math.exp(-9 * detik);
      pos.x += (tuju.x - pos.x) * k;
      pos.z += (tuju.z - pos.z) * k;
      yaw += (tuju.yaw - yaw) * k;
      pitch += (tuju.pitch - pitch) * k;
    }

    // Lampu meredup atau menyala perlahan
    if (gelap !== gelapTuju) {
      gelap = gelapTuju > gelap ? Math.min(gelapTuju, gelap + detik / 1.4) : Math.max(gelapTuju, gelap - detik / 0.8);
      aturGelap(halus(gelap));
    }
    if (gelap > 0) {
      galaksi.rotation.z += detik * 0.012; // berputar pelan seperti proyektor
      kelip[0].material.opacity = gelap * (0.55 + 0.45 * Math.sin(waktu * 1.6));
      kelip[1].material.opacity = gelap * (0.55 + 0.45 * Math.sin(waktu * 1.6 + 2.4));
    }
    film.perbarui(detik);
    gerakPerabot(detik);
    perbaruiTinta();
    gerakBukuRak(detik);
    hidupkanSuasana();
    if (fase === "lihat" && jari.size === 0) { // berputar sendiri saat tidak disentuh
      putarLihat.y += detik * 0.5;
      pasangPutar();
    }

    cahayaBenda.forEach(function (c) { c.material.opacity = (0.35 + Math.sin(waktu * 2.2) * 0.2) * (1 - gelap); });
    gambarUlang();
  }

  kanvas.addEventListener("webglcontextlost", function () {
    renderer.setAnimationLoop(null);
    opsi.saatGagal();
  });

  hidupkanSuasana(); // posisi awal debu, uap, dan sinar (juga untuk mode tanpa animasi)
  new ResizeObserver(aturUkuran).observe(kanvas);
  aturUkuran();
  if (opsi.langsungMasuk) {
    mulaiDiDalam();
    gambarUlang();
  }
  if (!kurangiGerak) renderer.setAnimationLoop(loop);

  return {
    masuk: masuk,
    kembali: kembali,
    tekan: function (t) { if (fase === "dalam") tekan(t); },
    lepasTombol: lepasTombol,
    jeda: function (ya) { berhenti = ya; },
    pose: ubahPose,
    tutupLihat: tutupLihat,    // Dipakai saat kembali ke halaman ini lewat tombol "back"
    pulihkan: function () { if (fase === "dekat") kembali(); }
  };
}
