# Jurnal Ramadhan 1448 H, FMDKI x KARIMAH 2027

Web app jurnal Ramadhan "Space to Breathe". Semua file statis: tanpa server, database, atau proses build. Isian setiap orang hanya tersimpan di browser masing-masing.

## A. Cara deploy ke GitHub Pages

### 1. Buat repository

1. Daftar atau masuk ke [github.com](https://github.com).
2. Klik tanda **+** di kanan atas, lalu **New repository**.
3. Isi **Repository name**: `jurnal-ramadhan-fmdki-1448h`
4. Pilih **Public**, lalu klik **Create repository**.

### 2. Unggah file

**Cara mudah, lewat web (disarankan):**

1. Di halaman repository, klik **uploading an existing file**.
2. Buka folder proyek di laptop dan pilih **semua isinya** (Ctrl+A), termasuk folder `assets` dan `jurnal`. Jangan seret folder induknya.
3. Seret ke halaman GitHub dan tunggu sampai semua file muncul di daftar.
4. Klik **Commit changes**.

Pastikan `index.html` terlihat di halaman depan repository, bukan di dalam folder lain.

**Cara kedua, lewat Git.** Ganti `[username]` dengan nama akun GitHub:

```powershell
git init -b main
git add .
git commit -m "Jurnal Ramadhan 1448 H"
git remote add origin https://github.com/[username]/jurnal-ramadhan-fmdki-1448h.git
git push -u origin main
```

### 3. Aktifkan GitHub Pages

1. Buka **Settings**, lalu **Pages** di menu kiri.
2. Pada **Source**, pilih **Deploy from a branch**.
3. Pada **Branch**, pilih **main** dan folder **/ (root)**, lalu klik **Save**.

### 4. Buka link jurnal

Tunggu 1 sampai 3 menit, lalu buka:

```
https://[username].github.io/jurnal-ramadhan-fmdki-1448h/
```

Link ini bisa dibagikan ke seluruh FMDKI. Siapa pun yang punya link bisa membukanya, tetapi tidak bisa melihat isian orang lain.

## B. Mengubah isi jurnal tanpa coding

1. Di GitHub, klik file yang ingin diubah (lihat tabel).
2. Klik ikon **pensil** di kanan atas.
3. Ubah **hanya tulisan di antara tanda petik** `"..."`. Jangan hapus tanda petik, koma, atau kurung.
4. Klik **Commit changes**.
5. Tunggu 1 sampai 3 menit, lalu muat ulang jurnal (di laptop tekan Ctrl+F5).

| Yang ingin diubah | File |
| --- | --- |
| Pertanyaan refleksi, challenge, judul harian | `jurnal/data.js` |
| Tanggal 1 Ramadhan setelah sidang isbat | `jurnal/data.js`, bagian `AWAL_RAMADHAN` dan `TANGGAL_PASTI` |
| Daftar amalan tracker | `tracker-data.js` (ubah `nama` saja, jangan `kunci`) |
| Langkah dan target amalan ibadah | `infografis-data.js`, bagian `AMALAN` |
| Warna | `style.css`, bagian 2 |
| Logo | `assets/logo-fmdki.png` dan `assets/logo-karimah.png` |

**Jangan diubah:** teks Arab, terjemahan, dan sanad di `ayat.js`, `infografis-data.js` bagian `DALIL`, dan `ayat` di `jurnal/data.js`.

Kalau logo diganti, sampul buku 3D masih memakai logo lama karena gambarnya juga tersimpan di `assets/logo-data.js`.

Kalau jurnal rusak setelah diedit, buka file itu di GitHub, klik **History**, lalu salin kembali isi versi sebelumnya.

## C. Yang perlu diketahui pengguna

1. **Isian tersimpan per browser.** Ganti HP, ganti browser, mode penyamaran, atau menghapus data situs membuat isian tidak tampil. Simpan rekap PDF di halaman Penutup secara berkala.
2. **Satu HP sebaiknya untuk satu orang.** Dua orang di browser yang sama akan berbagi isian.
3. **Internet** dibutuhkan untuk membuka halaman, font, dan tampilan 3D.
4. **Mencetak:** pilih kertas A5 dan skala 100%.

## D. Sebelum dibagikan

1. Ayat, terjemahan, hadits, dan pertanyaan refleksi ditinjau ustadzah.
2. Tanggal 1 Ramadhan disesuaikan dengan hasil sidang isbat.
3. Jurnal dicoba di beberapa HP.

## E. Isi folder

| File | Fungsi |
| --- | --- |
| `index.html`, `kamar.js`, `ayat.js` | Pintu, kamar 3D, dan 30 ayat |
| `cover.html` | Buku jurnal 3D yang terbuka |
| `menu.html` | Daftar isi, progres, dan Cetak Semua |
| `profil.html` | Profil muslimah, dua halaman |
| `infografis.html`, `infografis-data.js` | Keutamaan puasa, sahur, amalan, dan isi pop up |
| `tracker.html`, `tracker-data.js` | Tracker amalan 30 hari |
| `bab1-visual.html` sampai `bab3-visual.html`, `bab3d.js` | Pembuka Level 3D |
| `jurnal/` | Jurnal harian 30 hari |
| `proyek-kebaikan.html` | Empat pilihan proyek dan rencana aksi |
| `penutup.html`, `rekap.js` | Penutup dan rekap PDF |
| `lembar.js` | Lembar cetak jurnal |
| `storage.js` | Simpan dan baca isian di browser |
| `transisi.js` | Transisi halaman, suara, dan aksen bergerak |
| `style.css`, `print.css` | Tampilan layar dan cetak A5 |
| `assets/` | Logo dan ikon |
| `jalankan-di-hp.bat` | Untuk mencoba di HP lewat WiFi, tidak perlu diunggah |

Saat menambah halaman, tulis semua link sebagai path relatif (`style.css`, bukan `/style.css`) dan samakan huruf besar kecilnya dengan nama file.

## F. Sumber

1. Teks Arab Al Qur'an: mushaf Madinah (Hafs) lewat Quran.com
2. Terjemahan Al Qur'an: Kementerian Agama RI lewat equran.id
3. Hadits: database hadits digital hadith-api
4. Tampilan 3D: Three.js r128
