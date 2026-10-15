import { PDFDocument, StandardFonts, rgb } from "pdf-lib";

export type Invoice = {
  number: string;
  customer: string;
  lines: { description: string; amount: string }[];
};

export async function buildInvoicePdf(invoice: Invoice) {
  const doc = await PDFDocument.create();
  const page = doc.addPage([612, 792]);
  const font = await doc.embedFont(StandardFonts.Helvetica);
  const bold = await doc.embedFont(StandardFonts.HelveticaBold);

  page.drawText(`Invoice ${invoice.number}`, { x: 50, y: 740, size: 18, font: bold });
  page.drawText(`Bill to: ${invoice.customer}`, { x: 50, y: 710, size: 12, font });
  page.drawRectangle({ x: 50, y: 680, width: 512, height: 1, color: rgb(0.7, 0.7, 0.7) });

  let y = 650;
  for (const line of invoice.lines) {
    page.drawText(line.description, { x: 50, y, size: 11, font });
    page.drawText(line.amount, { x: 480, y, size: 11, font });
    y -= 20;
  }

  const bytes = await doc.save();
  return Buffer.from(bytes);
}

export async function pageCount(pdfBytes: Uint8Array) {
  const doc = await PDFDocument.load(pdfBytes);
  return doc.getPageCount();
}
