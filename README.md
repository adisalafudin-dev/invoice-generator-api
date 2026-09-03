# Invoice Generator API

API sederhana untuk generate invoice PDF secara real-time. Kirim data invoice dalam format JSON, server menghitung subtotal/pajak/diskon secara aman, lalu langsung mengembalikan file PDF sebagai response.

<p align="left">
  <img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />
  <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js" />
  <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Puppeteer-40B5A4?style=for-the-badge&logo=puppeteer&logoColor=white" alt="Puppeteer" />
  <img src="https://img.shields.io/badge/Handlebars.js-000000?style=for-the-badge&logo=handlebarsdotjs&logoColor=white" alt="Handlebars.js" />
</p>

## Tech Stack

- **Runtime & Package Manager:** [Bun](https://bun.sh)
- **Framework:** [Express.js](https://expressjs.com) + TypeScript
- **PDF Engine:** [Puppeteer](https://pptr.dev)
- **Template Engine:** [Handlebars](https://handlebarsjs.com)
- **Styling:** [Tailwind CSS](https://tailwindcss.com) via PostCSS

## Fitur

- Generate PDF invoice secara sinkron dari payload JSON
- Kalkulasi subtotal, pajak, dan diskon dilakukan sepenuhnya di server (client tidak bisa memanipulasi total)
- Validasi payload dasar sebelum diproses
- Graceful shutdown untuk mencegah zombie process Puppeteer
- Unit test untuk logika kalkulasi (`bun test`)

## Struktur Proyek

```
.
├── src/
│   ├── app.ts            # Setup server & routing
│   ├── controller.ts     # HTTP request/response handler
│   ├── pdfGenerator.ts   # Kalkulasi data & render PDF via Puppeteer
│   └── pdfGenerator.test.ts
├── templates/
│   └── invoice.hbs       # Template visual invoice
├── package.json
└── tsconfig.json
```

## Instalasi

```bash
git clone https://github.com/<username>/invoice-generator-api.git
cd invoice-generator-api
bun install
```

## Menjalankan Server

```bash
# Development (auto-reload)
bun run dev

# Production
bun run start
```

CSS Tailwind dikompilasi otomatis sebelum server development atau production dijalankan. Untuk menjalankannya secara manual:

```bash
bun run build:css
```

Server berjalan di `http://localhost:3000` secara default. Ubah lewat environment variable `PORT` jika perlu.

## Menjalankan Test

```bash
bun test
```

## API Reference

### `POST /api/v1/invoices/generate`

Menerima data invoice dan mengembalikan file PDF.

**Request Body:**

```json
{
  "metadata": {
    "invoice_number": "INV-2026-001",
    "issue_date": "2026-08-10",
    "due_date": "2026-08-24"
  },
  "sender": {
    "company_name": "PT Sistem Integrasi",
    "address": "Jakarta"
  },
  "customer": {
    "company_name": "PT Klien Sejahtera",
    "address": "Jakarta"
  },
  "items": [
    {
      "description": "Lisensi Tahunan",
      "quantity": 1,
      "unit_price": 2500000
    }
  ],
  "modifiers": {
    "tax_rate": 0.11,
    "discount": 500000
  }
}
```

**Response:**

- `200 OK` — file PDF (`Content-Type: application/pdf`)
- `400 Bad Request` — payload tidak valid atau nilai kalkulasi di luar batas wajar
- `504 Gateway Timeout` — proses render PDF melebihi batas waktu
- `500 Internal Server Error` — kegagalan tak terduga saat render

> **Catatan keamanan:** client hanya mengirim `quantity` dan `unit_price` per item. Subtotal, pajak, diskon, dan grand total selalu dihitung ulang oleh server — total dari client (jika ada) diabaikan.

### `GET /health`

Health check sederhana, mengembalikan `{ "status": "ok" }`.

## Contoh Penggunaan (curl)

```bash
curl -X POST http://localhost:3000/api/v1/invoices/generate \
  -H "Content-Type: application/json" \
  -d @payload.json \
  --output invoice.pdf
```

## Roadmap

Rencana pengembangan fitur ke depan ada di [`TODO.md`](./TODO.md).

## Lisensi

MIT
