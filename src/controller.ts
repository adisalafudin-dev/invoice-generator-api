import type { Request, Response } from "express";
import { generateInvoicePdf } from "./pdfGenerator";

// ===== Basic Payload Validation =====
// Validasi struktural minimal — memastikan field wajib ada dan
// bertipe benar sebelum masuk ke tahap kalkulasi.

function validateInvoicePayload(body: any): string | null {
  if (!body || typeof body !== "object") {
    return "Request body harus berupa JSON object";
  }

  const { metadata, sender, customer, items, modifiers } = body;

  if (
    !metadata?.invoice_number ||
    !metadata?.issue_date ||
    !metadata?.due_date
  ) {
    return "metadata.invoice_number, issue_date, dan due_date wajib diisi";
  }

  if (!sender?.company_name || !sender?.address) {
    return "sender.company_name dan sender.address wajib diisi";
  }

  if (!customer?.company_name || !customer?.address) {
    return "customer.company_name dan customer.address wajib diisi";
  }

  if (!Array.isArray(items) || items.length === 0) {
    return "items harus berupa array dan tidak boleh kosong";
  }

  for (const [index, item] of items.entries()) {
    if (
      typeof item.description !== "string" ||
      typeof item.quantity !== "number" ||
      typeof item.unit_price !== "number"
    ) {
      return `items[${index}] tidak valid: description (string), quantity (number), unit_price (number) wajib ada`;
    }
  }

  if (
    modifiers &&
    typeof modifiers.tax_rate !== "undefined" &&
    typeof modifiers.tax_rate !== "number"
  ) {
    return "modifiers.tax_rate harus berupa number";
  }

  if (
    modifiers &&
    typeof modifiers.discount !== "undefined" &&
    typeof modifiers.discount !== "number"
  ) {
    return "modifiers.discount harus berupa number";
  }

  return null; // valid
}

// ===== Handler =====

export async function generateInvoiceHandler(req: Request, res: Response) {
  const validationError = validateInvoicePayload(req.body);

  if (validationError) {
    return res.status(400).json({
      error: "Validation failed",
      message: validationError,
    });
  }

  try {
    const pdfBuffer = await generateInvoicePdf(req.body);

    const invoiceNumber = req.body.metadata.invoice_number.replace(
      /[^a-zA-Z0-9-_]/g,
      "_",
    );

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `inline; filename="invoice-${invoiceNumber}.pdf"`,
    );
    res.setHeader("Content-Length", pdfBuffer.length.toString());

    return res.status(200).send(pdfBuffer);
  } catch (err) {
    console.error("[generateInvoiceHandler] PDF generation failed:", err);

    // Kalkulasi invalid (mis. tax_rate di luar range) → 400
    if (
      (err instanceof Error && err.message.includes("tidak boleh")) ||
      (err instanceof Error && err.message.includes("harus di antara"))
    ) {
      return res.status(400).json({
        error: "Calculation error",
        message: err.message,
      });
    }

    // Sisanya (Puppeteer timeout, dll) → 500
    return res.status(500).json({
      error: "Internal server error",
      message: "Gagal membuat PDF invoice",
    });
  }
}
