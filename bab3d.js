/* ==========================================================================
   bab3d.js : adegan 3D untuk bab1-visual, bab2-visual, dan bab3-visual
   Tiap halaman memilih adegannya lewat <body data-bab="1"> (atau 2, 3).
   Butuh transisi.js (suara) dan jurnal/data.js (ayat).
   ========================================================================== */

/* ============ 1. TULISAN AYAT — dari data yang sama dengan jurnal harian ============ */
(function () {
  const hari = { 1: 1, 2: 14, 3: 24 }[document.body.dataset.bab];
  document.getElementById("ayat").textContent = JURNAL[hari].ayat;
  document.getElementById("sumber").textContent = JURNAL[hari].sumber;
})();

/* ============ 2. ADEGAN 3D ============ */
function mulaiBab3D() {
  const bab = document.body.dataset.bab;
  const kanvas = document.getElementById("kanvas");
  const ruang = document.getElementById("ruang");
  const tombol = document.getElementById("tombolMulai");
  const layarKecil = window.matchMedia("(max-width: 767px)").matches;
  const kurangiGerak = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* --- Dasar: renderer, scene, kamera, cahaya --- */
  const renderer = new THREE.WebGLRenderer({ canvas: kanvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, layarKecil ? 1.5 : 2));
  const scene = new THREE.Scene();
  const kamera = new THREE.PerspectiveCamera(30, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xf3e9f2, 0.9));
  const matahari = new THREE.DirectionalLight(0xfff6e8, 0.3);
  matahari.position.set(3, 5, 6);
  scene.add(matahari);

  const W = { sage: 0xb7d3bc, sageTua: 0x8fb89b, rose: 0xecc2d0, lav: 0xd3c7e6, madu: 0xefd3a0, emas: 0xdcb26b, putih: 0xfffdfa };

  function bahan(warna, tembus) {
    return new THREE.MeshLambertMaterial({ color: warna, transparent: tembus < 1, opacity: tembus, depthWrite: !(tembus < 1) });
  }

  function mesh(induk, geo, material, x, y, z) {
    const m = new THREE.Mesh(geo, material);
    m.position.set(x, y, z);
    induk.add(m);
    return m;
  }

  // Gambar titik bulat lembut untuk partikel dan cahaya
  const titik = (function () {
    const c = document.createElement("canvas");
    c.width = c.height = 64;
    const ctx = c.getContext("2d");
    const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
    g.addColorStop(0, "rgba(255,255,255,1)");
    g.addColorStop(0.4, "rgba(255,255,255,0.7)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();

  function cahayaLembut(induk, warna, pekat, besar, z) {
    return mesh(induk, new THREE.PlaneGeometry(besar, besar), new THREE.MeshBasicMaterial({
      map: titik, color: warna, transparent: true, opacity: pekat, depthWrite: false
    }), 0, 0, z);
  }

  const acak = function (lebar) { return (Math.random() - 0.5) * lebar; };
  const halus = function (t) { t = Math.max(0, Math.min(1, t)); return t * t * (3 - 2 * t); };

  /* PARTIKEL: posisi ratusan titik disimpan dalam satu array [x,y,z, x,y,z, ...]
     lalu digambar sekaligus sebagai satu objek Points, jadi tetap ringan. */
  const LUAS = { x: 22, y: 14 };
  function buatPartikel(jumlah, warna, besar, pekat) {
    const posisi = new Float32Array(jumlah * 3);
    for (let i = 0; i < jumlah; i++) posisi.set([acak(LUAS.x), acak(LUAS.y), acak(6) - 2.5], i * 3);
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(posisi, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({
      color: warna, size: besar, map: titik, transparent: true, opacity: pekat, depthWrite: false
    }));
    p.frustumCulled = false;
    scene.add(p);
    return p;
  }

  // Menaikkan partikel; yang lewat atas muncul lagi dari bawah
  function naikkan(p, jarak) {
    const a = p.geometry.attributes.position;
    for (let i = 1; i < a.array.length; i += 3) {
      a.array[i] += jarak;
      if (a.array[i] > LUAS.y / 2) a.array[i] -= LUAS.y;
    }
    a.needsUpdate = true;
  }

  const utama = new THREE.Group(); // objek utama yang dipaskan ke kotak .ruang
  scene.add(utama);
  const bisaDisentuh = [];         // objek yang bereaksi saat disentuh
  const banyak = layarKecil ? 0.55 : 1;

  function sentuhan(objek) {
    objek.userData.ukuran = 0; // 0 = normal, 1 = membesar
    bisaDisentuh.push(objek);
  }

  /* ---------- Adegan 1: bola-bola tembus pandang mengorbit, partikel emas naik ---------- */
  function adegan1() {
    const emas = buatPartikel(Math.round(220 * banyak), W.emas, 0.27, 0.9);
    const halusEmas = buatPartikel(Math.round(120 * banyak), W.madu, 0.42, 0.7);
    cahayaLembut(utama, 0xfff0cf, 0.9, 5, -1.5);

    const inti = mesh(utama, new THREE.SphereGeometry(0.72, 40, 30), bahan(W.madu, 0.75), 0, 0, 0);
    mesh(inti, new THREE.SphereGeometry(0.42, 30, 22), bahan(W.putih, 0.9), 0, 0, 0);
    sentuhan(inti);

    const orbit = [
      [1.25, 0.24, W.sage, 0.6, 0.35], [1.6, 0.34, W.rose, -0.42, 0.62], [2.0, 0.28, W.lav, 0.34, 0.5],
      [2.0, 0.17, W.sageTua, 0.34, 0.5], [2.35, 0.38, W.madu, -0.26, 0.12], [1.25, 0.14, W.rose, 0.6, 0.35]
    ].map(function (o, i) {
      const poros = new THREE.Group();
      poros.rotation.set(o[4] * 1.1 + 0.4, 0, (o[0] === 1.6 || o[0] === 2.35 ? -1 : 1) * o[4]);
      utama.add(poros);
      const lingkar = mesh(poros, new THREE.TorusGeometry(o[0], 0.006, 6, 90), new THREE.MeshBasicMaterial({ color: W.emas, transparent: true, opacity: 0.45 }), 0, 0, 0);
      lingkar.rotation.x = Math.PI / 2;
      const planet = mesh(poros, new THREE.SphereGeometry(o[1], 30, 22), bahan(o[2], 0.72), o[0], 0, 0);
      mesh(planet, new THREE.SphereGeometry(o[1] * 0.45, 18, 14), bahan(W.putih, 0.75), -o[1] * 0.2, o[1] * 0.25, o[1] * 0.2);
      sentuhan(planet);
      return { planet: planet, jari: o[0], laju: o[3], sudut: i * 1.9 };
    });

    return function (detik, waktu, laju) {
      naikkan(emas, detik * 0.35 * laju);
      naikkan(halusEmas, detik * 0.2 * laju);
      orbit.forEach(function (o) {
        o.sudut += detik * o.laju * (0.6 + laju * 0.4);
        o.planet.position.set(Math.cos(o.sudut) * o.jari, 0, Math.sin(o.sudut) * o.jari);
      });
      inti.rotation.y = waktu * 0.3;
      utama.rotation.y = Math.sin(waktu * 0.25) * 0.15;
    };
  }

  /* ---------- Adegan 2: pilar tumbuh dari bawah, partikel kristal ---------- */
  function adegan2() {
    const JUMLAH = Math.round(90 * banyak);
    // InstancedMesh: satu bentuk kristal digambar banyak kali sekaligus
    const kristal = new THREE.InstancedMesh(new THREE.OctahedronGeometry(0.09), new THREE.MeshLambertMaterial({ color: 0xffffff }), JUMLAH);
    const warnaKristal = [W.madu, W.sage, W.rose, W.lav].map(function (w) { return new THREE.Color(w); });
    const data = [];
    for (let i = 0; i < JUMLAH; i++) {
      data.push({ x: acak(LUAS.x), y: acak(LUAS.y), z: acak(6) - 3, putar: Math.random() * 6, besar: 0.6 + Math.random() * 1.1 });
      kristal.setColorAt(i, warnaKristal[i % 4]);
    }
    kristal.frustumCulled = false;
    scene.add(kristal);
    const bantu = new THREE.Object3D();

    cahayaLembut(utama, 0xfff0cf, 0.8, 6, -2);
    const dasar = mesh(utama, new THREE.CylinderGeometry(2.35, 2.5, 0.18, 64), bahan(W.putih, 1), 0, -2, 0);
    mesh(dasar, new THREE.CylinderGeometry(2.0, 2.0, 0.04, 64), bahan(0xe2efe2, 1), 0, 0.1, 0);

    const pilar = [-3, -2, -1, 0, 1, 2, 3].map(function (n, i) {
      const tinggi = [1.5, 2.1, 2.8, 3.7, 2.8, 2.1, 1.5][i];
      const warna = [W.lav, W.rose, W.sage, W.madu, W.sage, W.rose, W.lav][i];
      const g = new THREE.Group();
      g.position.set(n * 0.6, -1.88, -Math.abs(n) * 0.28 + 0.4);
      utama.add(g);
      const tiang = mesh(g, new THREE.CylinderGeometry(0.17, 0.19, 1, 28), bahan(warna, 1), 0, 0.5, 0);
      const kepala = new THREE.Group();
      g.add(kepala);
      mesh(kepala, new THREE.CylinderGeometry(0.25, 0.2, 0.12, 28), bahan(W.putih, 1), 0, 0.06, 0);
      mesh(kepala, new THREE.SphereGeometry(0.2, 28, 16, 0, Math.PI * 2, 0, Math.PI / 2), bahan(warna, 1), 0, 0.12, 0);
      mesh(kepala, new THREE.ConeGeometry(0.035, 0.18, 12), bahan(W.emas, 1), 0, 0.4, 0);
      mesh(g, new THREE.CylinderGeometry(0.25, 0.28, 0.1, 28), bahan(W.putih, 1), 0, 0.05, 0);
      sentuhan(tiang);
      return { tiang: tiang, kepala: kepala, tinggi: tinggi, mulai: 0.3 + Math.abs(n) * 0.22 };
    });

    return function (detik, waktu, laju) {
      data.forEach(function (k, i) {
        k.y += detik * 0.22 * laju;
        k.putar += detik * (0.5 + laju * 0.4);
        if (k.y > LUAS.y / 2) k.y -= LUAS.y;
        bantu.position.set(k.x, k.y, k.z);
        bantu.rotation.set(k.putar * 0.6, k.putar, 0);
        bantu.scale.set(k.besar * 0.75, k.besar * 1.3, k.besar * 0.75);
        bantu.updateMatrix();
        kristal.setMatrixAt(i, bantu.matrix);
      });
      kristal.instanceMatrix.needsUpdate = true;

      pilar.forEach(function (p) {
        const tumbuh = kurangiGerak ? 1 : halus((waktu - p.mulai) / 1.8);
        const t = Math.max(0.02, p.tinggi * tumbuh + p.tiang.userData.ukuran * 0.3);
        p.tiang.scale.y = t;
        p.tiang.position.y = t / 2;
        p.kepala.position.y = t;
      });
      utama.rotation.y = Math.sin(waktu * 0.3) * 0.22;
    };
  }

  /* ---------- Adegan 3: bulan sabit, bintang, cincin berkilau, bintang berdenyut ---------- */
  function adegan3() {
    // Empat kelompok bintang dengan irama berkedip berbeda
    const kelompok = [[W.emas, 0.36], [0xffffff, 0.48], [W.madu, 0.3], [0xffffff, 0.34]].map(function (k) {
      return buatPartikel(Math.round(75 * banyak), k[0], k[1], 0.8);
    });
    cahayaLembut(utama, 0xfff3d6, 0.95, 5.6, -1.5);

    function sabit(R) {
      const r = R * 0.8, geser = R * 0.37;
      const x = (R * R - r * r + geser * geser) / (2 * geser), y = Math.sqrt(R * R - x * x);
      const a = Math.atan2(y, x), b = Math.atan2(y, x - geser), s = new THREE.Shape();
      s.absarc(0, 0, R, a, Math.PI * 2 - a, false);
      s.absarc(geser, 0, r, -b, b, true);
      return s;
    }
    function bintang(luar, dalam, sudut) {
      const s = new THREE.Shape();
      for (let i = 0; i < sudut * 2; i++) {
        const j = i % 2 ? dalam : luar, a = (i / (sudut * 2)) * Math.PI * 2 + Math.PI / 2;
        if (i === 0) s.moveTo(Math.cos(a) * j, Math.sin(a) * j);
        else s.lineTo(Math.cos(a) * j, Math.sin(a) * j);
      }
      s.closePath();
      return s;
    }
    const opsi = { depth: 0.22, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.04, bevelSegments: 4, curveSegments: 48 };
    const geoBulan = new THREE.ExtrudeGeometry(sabit(1.15), opsi);
    geoBulan.translate(0, 0, -0.11);
    const emas = bahan(0xdfb978, 1);
    const bulan = mesh(utama, geoBulan, emas, -0.08, 0, 0);
    bulan.rotation.z = 0.35;
    sentuhan(bulan);
    const geoBintang = new THREE.ExtrudeGeometry(bintang(0.34, 0.15, 5), opsi);
    geoBintang.translate(0, 0, -0.11);
    const tengah = mesh(utama, geoBintang, bahan(W.rose, 1), 0.48, 0.28, 0);
    sentuhan(tengah);

    const cincin = [[1.85, 0.5, 0.25, W.emas], [2.2, -0.35, 0.6, W.lav]].map(function (c, n) {
      const g = new THREE.Group();
      g.rotation.set(Math.PI / 2 + c[1], c[2], 0);
      utama.add(g);
      mesh(g, new THREE.TorusGeometry(c[0], 0.018, 8, 120), new THREE.MeshBasicMaterial({ color: c[3] }), 0, 0, 0);
      // Permata kecil di sepanjang cincin
      const permata = [];
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * Math.PI * 2;
        const p = mesh(g, new THREE.OctahedronGeometry(i % 3 ? 0.045 : 0.085), bahan([W.madu, W.rose, W.putih, W.sage][(i + n) % 4], 1), Math.cos(a) * c[0], Math.sin(a) * c[0], 0);
        permata.push(p);
      }
      return { g: g, permata: permata, arah: n ? -1 : 1 };
    });

    let putaran = 0;
    return function (detik, waktu, laju) {
      kelompok.forEach(function (k, i) {
        naikkan(k, detik * 0.05 * laju);
        k.material.opacity = 0.5 + 0.45 * Math.sin(waktu * (0.8 + i * 0.25) * (0.7 + laju * 0.3) + i * 1.7);
      });
      // Berputar ke kanan dan ke kiri, supaya bentuk sabitnya selalu terlihat
      putaran += detik * 0.6 * (0.6 + laju * 0.4);
      bulan.rotation.y = Math.sin(putaran) * 0.85;
      tengah.rotation.y = -Math.sin(putaran * 1.3) * 0.9;
      cincin.forEach(function (c) {
        c.g.rotation.z += detik * 0.22 * c.arah * (0.6 + laju * 0.4);
        c.permata.forEach(function (p, i) { p.scale.setScalar(1 + 0.35 * Math.sin(waktu * 2.4 + i * 1.3)); });
      });
      utama.position.y = Math.sin(waktu * 0.9) * 0.07;
    };
  }

  const gerakkan = { 1: adegan1, 2: adegan2, 3: adegan3 }[bab]();

  /* ---------- Ukuran: objek dipaskan ke kotak .ruang ---------- */
  function aturUkuran() {
    const k = kanvas.getBoundingClientRect(), r = ruang.getBoundingClientRect();
    if (!k.width || !k.height) return;
    const atas = Math.max(r.top, k.top), bawah = Math.min(r.bottom, k.bottom - k.height * 0.06);
    const tinggi = Math.max(bawah - atas, 80), lebar = Math.max(r.width, 80);
    const perTinggi = 2 * Math.tan(THREE.MathUtils.degToRad(kamera.fov / 2));
    const jarak = Math.max((5.6 * k.height) / (tinggi * perTinggi), (5.8 * k.height) / (lebar * perTinggi));
    kamera.position.set(0, jarak * 0.1, jarak);
    kamera.lookAt(0, 0, 0);
    kamera.aspect = k.width / k.height;
    const cx = r.left - k.left + r.width / 2, cy = atas - k.top + tinggi / 2;
    kamera.setViewOffset(k.width, k.height, k.width / 2 - cx, k.height / 2 - cy, k.width, k.height);

    // Sebaran partikel mengikuti seluruh layar, bukan hanya kotak .ruang
    LUAS.y = Math.max(14, perTinggi * jarak * 1.9);
    renderer.setSize(k.width, k.height, false);
    renderer.render(scene, kamera);
  }

  /* ---------- Interaksi ----------
     RAYCASTING: sinar lurus ditembakkan dari kamera melewati posisi kursor.
     Objek pertama yang terkena sinar = objek yang sedang disentuh. */
  const sinar = new THREE.Raycaster();
  let disentuh = null, kursor = null, tombolAktif = false;

  function cariObjek() {
    if (!kursor) return null;
    sinar.setFromCamera(kursor, kamera);
    const kena = sinar.intersectObjects(bisaDisentuh, false);
    return kena.length ? kena[0].object : null;
  }

  function catatKursor(e) {
    const k = kanvas.getBoundingClientRect();
    kursor = { x: ((e.clientX - k.left) / k.width) * 2 - 1, y: -((e.clientY - k.top) / k.height) * 2 + 1 };
  }

  kanvas.addEventListener("pointermove", function (e) { if (e.pointerType === "mouse") catatKursor(e); });
  kanvas.addEventListener("pointerleave", function () { kursor = null; });
  kanvas.addEventListener("pointerdown", function (e) {
    catatKursor(e);
    if (cariObjek()) Suara.lonceng();
    // Di layar sentuh tidak ada hover: efeknya bertahan sebentar lalu hilang
    if (e.pointerType !== "mouse") setTimeout(function () { kursor = null; }, 900);
  });

  // Tombol disorot: partikel bergerak lebih cepat (event hover biasa)
  [["pointerenter", true], ["pointerleave", false], ["focus", true], ["blur", false]].forEach(function (p) {
    tombol.addEventListener(p[0], function () { tombolAktif = p[1]; });
  });

  /* ---------- Animasi loop ---------- */
  const jam = new THREE.Clock();
  let waktu = 0, laju = 1;

  function loop() {
    const detik = Math.min(jam.getDelta(), 0.1);
    waktu += detik;
    disentuh = cariObjek();
    kanvas.style.cursor = disentuh ? "pointer" : "";

    const tujuan = tombolAktif ? 5 : disentuh ? 2.2 : 1;
    laju += (tujuan - laju) * (1 - Math.exp(-4 * detik)); // berubah halus, tidak mendadak
    kanvas.dataset.laju = laju.toFixed(1);

    bisaDisentuh.forEach(function (o) {
      const u = o.userData;
      u.ukuran += ((o === disentuh ? 1 : 0) - u.ukuran) * (1 - Math.exp(-8 * detik));
      if (bab !== "2") o.scale.setScalar(1 + u.ukuran * 0.22); // pilar bertambah tinggi, bukan membesar
    });

    gerakkan(detik, waktu, laju);
    renderer.render(scene, kamera);
  }

  const pengamat = new ResizeObserver(aturUkuran);
  pengamat.observe(kanvas);
  pengamat.observe(ruang);
  gerakkan(0, 0, 1);
  aturUkuran();

  kanvas.addEventListener("webglcontextlost", function () {
    renderer.setAnimationLoop(null);
    kanvas.classList.remove("siap");
  });

  // "Kurangi gerakan": satu gambar diam
  if (!kurangiGerak) renderer.setAnimationLoop(loop);
  kanvas.classList.add("siap");
}

/* ============ 3. MEMUAT THREE.JS + FALLBACK ============
   Kalau gagal, yang tampil hanya gradient pastel dan tulisan. */
(function () {
  const skrip = document.createElement("script");
  skrip.src = "https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js";
  skrip.onload = function () {
    try {
      mulaiBab3D();
    } catch (err) {
      console.info("Adegan 3D tidak didukung:", err.message);
    }
  };
  skrip.onerror = function () { console.info("Three.js tidak termuat, memakai gradient."); };
  document.head.appendChild(skrip);
})();
