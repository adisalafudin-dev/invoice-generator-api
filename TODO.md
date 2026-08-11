# TODO — Invoice Generator API

Roadmap pengembangan setelah MVP (Fase 1-4) selesai.

## Prioritas Tinggi — Mengatasi Limitasi Arsitektur Sinkron

- [ ] **Async job queue (BullMQ + Redis)**
      Client POST → dapat `job_id` langsung → polling/webhook saat PDF siap. Menghindari blocking saat banyak request bersamaan, sekaligus membuka jalan untuk retry otomatis jika render gagal.

- [ ] **Rate limiting**
      Pasang `express-rate-limit` per IP/API key. Endpoint Puppeteer mahal secara komputasi dan rawan disalahgunakan.

- [ ] **Autentikasi API key**
      Tambahkan validasi header `X-API-Key` minimal, atau JWT jika butuh dukungan multi-tenant.

## Fitur Produk

- [ ] **Multi-template / branding**
  - Beberapa desain invoice (`invoice.hbs`, `invoice-minimal.hbs`, dll), dipilih via field `template_id`
  - Logo perusahaan lewat URL atau base64 di `sender.logo`
  - Custom accent color dikirim di payload

- [ ] **Multi-currency & i18n**
      Tambahkan field `currency` dan `locale` di payload supaya `Intl.NumberFormat` dinamis, bukan hardcode `id-ID`/IDR.

- [ ] **Multiple tax lines**
      Dukungan lebih dari satu jenis pajak (mis. PPN + PPh), atau tax rate berbeda per-item.

- [ ] **Item-level discount**
      Diskon per-item (persen atau flat), bukan cuma di level invoice.

## Reliability & Observability

- [ ] **Caching hasil PDF**
      Cek cache berdasarkan `invoice_number` sebelum render ulang, untuk menghindari kerja ganda saat client retry.

- [ ] **Structured logging**
      Ganti `console.log`/`console.error` dengan Pino atau Winston untuk memudahkan debugging di production.

- [ ] **Metrics**
      Endpoint `/metrics` (Prometheus) untuk memantau rata-rata waktu render, jumlah request gagal, dan jumlah browser restart.

## Storage & Delivery

- [ ] **Simpan PDF ke storage (S3/R2/local)**
      Simpan hasil render ke object storage dan kembalikan URL, bukan cuma buffer — untuk histori invoice dan download ulang.

- [ ] **Email delivery**
      Endpoint tambahan yang generate PDF lalu kirim langsung via email (Resend/Nodemailer) ke `customer.email`.
