import puppeteer, { type Browser } from "puppeteer";
import Handlebars from "handlebars";
import { readFileSync } from "fs";
import path from "path";

// ===== Types =====

interface InvoiceItem {
  description: string;
  quantity: number;
  unit_price: number;
}

interface InvoicePayload {
  metadata: {
    invoice_number: string;
    issue_date: string;
    due_date: string;
  };
  sender: {
    company_name: string;
    address: string;
  };
  customer: {
    company_name: string;
    address: string;
  };
  items: InvoiceItem[];
  modifiers: {
    tax_rate: number; // e.g. 0.11
    discount: number; // flat amount
  };
}

// ===== Currency Formatter =====

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(value);
}

// ===== Safe Calculation =====
// Server SELALU menghitung ulang. Tidak pernah percaya total dari client.

function calculateInvoice(payload: InvoicePayload) {
  const items = payload.items.map((item) => {
    if (item.quantity < 0 || item.unit_price < 0) {
      throw new Error(
        `Invalid item values: quantity/unit_price tidak boleh negatif (item: ${item.description})`,
      );
    }
    const subtotal = item.quantity * item.unit_price;
    return {
      ...item,
      subtotal,
      formatted_unit_price: formatCurrency(item.unit_price),
      formatted_subtotal: formatCurrency(subtotal),
    };
  });

  const subtotal = items.reduce((sum, item) => sum + item.subtotal, 0);

  const taxRate = payload.modifiers?.tax_rate ?? 0;
  const discount = payload.modifiers?.discount ?? 0;

  if (taxRate < 0 || taxRate > 1) {
    throw new Error("tax_rate harus di antara 0 dan 1");
  }
  if (discount < 0) {
    throw new Error("discount tidak boleh negatif");
  }

  const tax = subtotal * taxRate;
  const grandTotalRaw = subtotal + tax - discount;
  const grandTotal = grandTotalRaw < 0 ? 0 : grandTotalRaw; // guard: jangan sampai minus

  return {
    items,
    calculations: {
      subtotal,
      tax,
      discount,
      grand_total: grandTotal,
      tax_rate_percent: (taxRate * 100).toFixed(0),
      formatted_subtotal: formatCurrency(subtotal),
      formatted_tax: formatCurrency(tax),
      formatted_discount: formatCurrency(discount),
      formatted_grand_total: formatCurrency(grandTotal),
    },
  };
}

// ===== Template Compilation =====

let compiledTemplate: HandlebarsTemplateDelegate | null = null;

function getTemplate(): HandlebarsTemplateDelegate {
  if (compiledTemplate) return compiledTemplate;

  const templatePath = path.join(process.cwd(), "templates", "invoice.hbs");
  const source = readFileSync(templatePath, "utf-8");
  compiledTemplate = Handlebars.compile(source);
  return compiledTemplate;
}

// ===== Puppeteer Browser (reusable instance) =====
// Launch browser sekali, reuse untuk banyak request → jauh lebih cepat
// daripada launch baru tiap request.

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.connected) {
    return browserInstance;
  }
  browserInstance = await puppeteer.launch({
    headless: true,
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage", // penting di container/VPS RAM kecil
    ],
  });
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

// ===== Main Export: Generate PDF Buffer =====

export async function generateInvoicePdf(
  payload: InvoicePayload,
): Promise<Buffer> {
  const { items, calculations } = calculateInvoice(payload);

  const template = getTemplate();
  const html = template({
    metadata: payload.metadata,
    sender: payload.sender,
    customer: payload.customer,
    items,
    calculations,
  });

  const browser = await getBrowser();
  const page = await browser.newPage();

  try {
    await page.setContent(html, { waitUntil: "load" });
    const pdfBuffer = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    });
    return Buffer.from(pdfBuffer);
  } finally {
    await page.close(); // WAJIB: tutup page walau error, cegah memory leak
  }
}
