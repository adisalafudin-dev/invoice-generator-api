// Bun provides this module at runtime; its type declarations are not available
// in the current TypeScript configuration.
// @ts-expect-error Bun runtime module
import { describe, expect, test } from "bun:test";

// NOTE: calculateInvoice saat ini tidak di-export dari pdfGenerator.ts.
// Export dulu fungsinya (tambahkan `export` di depan `function calculateInvoice`)
// supaya bisa di-test terpisah dari proses render PDF.
import { calculateInvoice } from "../src/pdfGenerator";

describe("calculateInvoice", () => {
  test("menghitung subtotal, pajak, diskon, dan grand total dengan benar", () => {
    const result = calculateInvoice({
      metadata: {
        invoice_number: "TEST-1",
        issue_date: "2026-01-01",
        due_date: "2026-01-15",
      },
      sender: { company_name: "A", address: "B" },
      customer: { company_name: "C", address: "D" },
      items: [
        { description: "Item A", quantity: 2, unit_price: 100000 },
        { description: "Item B", quantity: 1, unit_price: 50000 },
      ],
      modifiers: { tax_rate: 0.11, discount: 25000 },
    });

    expect(result.calculations.subtotal).toBe(250000);
    expect(result.calculations.tax).toBe(27500);
    expect(result.calculations.grand_total).toBe(252500);
  });

  test("mengabaikan total dari client dan tetap hitung ulang dari quantity x unit_price", () => {
    const result = calculateInvoice({
      metadata: {
        invoice_number: "TEST-2",
        issue_date: "2026-01-01",
        due_date: "2026-01-15",
      },
      sender: { company_name: "A", address: "B" },
      customer: { company_name: "C", address: "D" },
      items: [
        {
          description: "Item",
          quantity: 1,
          unit_price: 1000,
          total: 999999999,
        },
      ],
      modifiers: { tax_rate: 0, discount: 0 },
    });

    expect(result.calculations.grand_total).toBe(1000); // bukan 999999999
  });

  test("melempar error jika tax_rate di luar range 0-1", () => {
    expect(() =>
      calculateInvoice({
        metadata: {
          invoice_number: "TEST-3",
          issue_date: "2026-01-01",
          due_date: "2026-01-15",
        },
        sender: { company_name: "A", address: "B" },
        customer: { company_name: "C", address: "D" },
        items: [{ description: "Item", quantity: 1, unit_price: 1000 }],
        modifiers: { tax_rate: 1.5, discount: 0 },
      }),
    ).toThrow("tax_rate harus di antara 0 dan 1");
  });

  test("grand_total tidak boleh negatif walau diskon lebih besar dari subtotal", () => {
    const result = calculateInvoice({
      metadata: {
        invoice_number: "TEST-4",
        issue_date: "2026-01-01",
        due_date: "2026-01-15",
      },
      sender: { company_name: "A", address: "B" },
      customer: { company_name: "C", address: "D" },
      items: [{ description: "Item", quantity: 1, unit_price: 1000 }],
      modifiers: { tax_rate: 0, discount: 999999 },
    });

    expect(result.calculations.grand_total).toBe(0);
  });
});
