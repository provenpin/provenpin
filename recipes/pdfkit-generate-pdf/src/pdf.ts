import PDFDocument from "pdfkit";
import { PassThrough } from "node:stream";

export type Row = [string, string, string];

/**
 * Renders a small document (heading, paragraph, table-like rows) into a buffer.
 * Uses only pdfkit's built-in standard fonts, so no network access is required.
 */
export function generatePdf(title: string, body: string, rows: Row[]): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: 50 });
    const stream = new PassThrough();
    const chunks: Buffer[] = [];

    stream.on("data", (chunk: Buffer) => chunks.push(chunk));
    stream.on("end", () => resolve(Buffer.concat(chunks)));
    stream.on("error", reject);

    doc.pipe(stream);

    doc.font("Helvetica-Bold").fontSize(20).text(title);
    doc.moveDown();
    doc.font("Helvetica").fontSize(11).text(body, { align: "justify" });
    doc.moveDown();

    const columns = [50, 260, 410];
    let y = doc.y;

    rows.forEach((row, index) => {
      doc.font(index === 0 ? "Helvetica-Bold" : "Helvetica").fontSize(11);
      doc.text(row[0], columns[0], y);
      doc.text(row[1], columns[1], y);
      doc.text(row[2], columns[2], y);
      y += 20;
      doc.moveTo(50, y - 6).lineTo(545, y - 6).stroke();
    });

    doc.end();
  });
}
