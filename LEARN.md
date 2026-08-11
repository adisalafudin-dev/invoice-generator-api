# TODO-LEARN.md — Materi Belajar: Library Pendukung Invoice Generator API

Kamu sudah paham Bun & Express. Berikut roadmap belajar untuk 3 hal yang dipakai
di proyek ini tapi belum familiar: **HTML/CSS untuk cetak (print/PDF)**,
**Handlebars**, dan **Puppeteer**. Urutan di bawah sengaja disusun dari fondasi
ke praktik, karena Puppeteer & Handlebars sebenarnya cuma "alat" — pemahaman
inti yang paling menentukan kualitas invoice-mu ada di HTML/CSS print.

---

## 1. HTML/CSS untuk Print & PDF (Fondasi Paling Penting)

Ini yang paling krusial dipelajari duluan, karena Puppeteer pada dasarnya
cuma "screenshot" halaman HTML jadi PDF. Kalau CSS print-nya jelek, PDF-nya
ikut jelek — sebagus apapun Puppeteer/Handlebars-nya.

**Konsep inti yang wajib dipahami:**

- `@page` rule (margin halaman, ukuran kertas A4/Letter)
- `page-break-before` / `page-break-after` / `page-break-inside: avoid`
  (mencegah tabel item invoice terpotong di tengah halaman)
- Flexbox untuk layout header/footer (yang sudah dipakai di `invoice.hbs`)
- Unit `mm`/`in` vs `px` — penting untuk print supaya ukuran fisik akurat

**Resource:**

- [MDN — CSS Paged Media (@page)](https://developer.mozilla.org/en-US/docs/Web/CSS/@page) — dokumentasi resmi, referensi cepat
- [CSS-Tricks — A Guide to Print Stylesheets](https://css-tricks.com/a-guide-to-print-stylesheets/) — panduan praktis, banyak contoh kasus nyata
- [Smashing Magazine — Print-Friendly CSS](https://www.smashingmagazine.com/2018/05/print-stylesheets-in-2018/) — lebih dalam soal page-break dan pitfalls umum

---

## 2. Handlebars (Template Engine)

Setelah paham HTML/CSS-nya, Handlebars sendiri sebenarnya ringan — cuma
sistem templating dengan sintaks `{{ }}`. Yang perlu dikuasai:

**Konsep inti:**

- Expression dasar `{{variable}}` dan nested object `{{sender.address}}`
- Block helper `{{#each}}...{{/each}}` (dipakai buat looping `items`)
- Conditional `{{#if}}...{{else}}...{{/if}}`
- Custom helper (fungsi JS yang bisa dipanggil dari template — berguna kalau
  nanti mau format tanggal langsung di template, bukan di `pdfGenerator.ts`)
- Partials `{{> partialName}}` (berguna untuk pecah template jadi komponen,
  misal header invoice dipisah dari body)

**Resource:**

- [Handlebars.js — Official Guide](https://handlebarsjs.com/guide/) — dokumentasi resmi, cukup singkat untuk dibaca full dalam 1-2 jam
- [Handlebars.js — Block Helpers](https://handlebarsjs.com/guide/block-helpers.html) — fokus ke bagian ini karena paling sering dipakai (`#each`, `#if`)
- [Handlebars.js — Expressions](https://handlebarsjs.com/guide/expressions.html) — sintaks dasar

---

## 3. Puppeteer (PDF Engine)

Setelah dua di atas dikuasai, Puppeteer tinggal soal "bagaimana browser
headless mengubah HTML jadi PDF" — API-nya sendiri tidak terlalu besar
untuk use case invoice generator.

**Konsep inti yang relevan buat proyek ini:**

- `page.setContent()` vs `page.goto()` — kita pakai `setContent` karena
  render dari string HTML, bukan URL
- `page.pdf()` options: `format`, `printBackground`, `margin`
- Lifecycle: `launch()` → `newPage()` → `page.close()` → (browser tetap hidup)
- `waitUntil` options (`networkidle0`, `domcontentloaded`) — penting kalau
  nanti template pakai gambar/font eksternal
- Kenapa `--no-sandbox` diperlukan di environment container/VPS

**Resource:**

- [Puppeteer — Official Docs](https://pptr.dev/) — dokumentasi resmi, navigasi ke bagian `page.pdf()` dan `page.setContent()`
- [Puppeteer — Getting Started Guide](https://pptr.dev/guides/getting-started) — mulai dari sini untuk konsep dasar
- [Puppeteer — PDF Generation Guide](https://pptr.dev/guides/pdf-generation) — spesifik soal generate PDF, paling relevan untuk proyekmu
- [web.dev — Generating PDFs with Puppeteer](https://web.dev/articles/generate-pdfs) — tutorial praktis dari tim Chrome, banyak contoh kasus dunia nyata

---

## Urutan Belajar yang Disarankan

1. **HTML/CSS Print** dulu (1-2 hari) — coba edit `templates/invoice.hbs`
   langsung, ubah layout, buka hasilnya di browser (Ctrl+P → Print Preview
   untuk cek tanpa perlu Puppeteer)
2. **Handlebars** (setengah hari) — baca guide resmi, coba tambah helper baru
   di template yang sudah ada (misal `{{#if}}` untuk tampilkan/sembunyikan
   diskon kalau nilainya 0)
3. **Puppeteer** (setengah hari) — sudah otomatis lebih mudah dipahami karena
   dua fondasi di atas sudah dikuasai; fokus baca `page.pdf()` options

## Latihan Kecil untuk Menguji Pemahaman

- [ ] Ubah `invoice.hbs` supaya baris diskon disembunyikan kalau `discount === 0` (pakai `{{#if}}`)
- [ ] Tambahkan halaman kedua secara paksa (banyak item) dan pastikan header tabel tidak terpotong — praktik `page-break-inside`
- [ ] Ganti salah satu opsi di `page.pdf()` (misal `format: "Letter"`) dan lihat efeknya
