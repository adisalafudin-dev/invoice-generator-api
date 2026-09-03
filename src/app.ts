import express from "express";
import { generateInvoiceHandler } from "./controller";
import { closeBrowser } from "./pdfGenerator";

const app = express();
const PORT = process.env.PORT || 3001;

// Body parser — batasi ukuran payload biar aman dari abuse
app.use(express.json({ limit: "1mb" }));

// ===== Routes =====

app.post("/api/v1/invoices/generate", generateInvoiceHandler);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// ===== 404 Handler =====

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

// ===== Global Error Handler (fallback) =====

app.use(
  (
    err: any,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    console.error("[Unhandled Error]", err);
    res.status(500).json({ error: "Internal server error" });
  },
);

// ===== Start Server =====

const server = app.listen(PORT, () => {
  console.log(`🚀 Invoice Generator API berjalan di http://localhost:${PORT}`);
});

// ===== Graceful Shutdown =====
// Penting: matikan Puppeteer browser dengan benar saat server berhenti,
// supaya tidak ada zombie Chromium process yang tertinggal.

async function gracefulShutdown(signal: string) {
  console.log(`\n${signal} diterima. Menutup server...`);
  server.close(async () => {
    await closeBrowser();
    console.log("Server dan browser instance ditutup dengan bersih.");
    process.exit(0);
  });
}

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
