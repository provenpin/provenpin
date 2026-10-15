import {
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  Table,
  TableCell,
  TableRow,
} from "docx";

export async function generateDocx(): Promise<Buffer> {
  const doc = new Document({
    sections: [
      {
        children: [
          new Paragraph({
            text: "Quarterly Report",
            heading: HeadingLevel.HEADING_1,
          }),
          new Paragraph({
            text: "This document is generated entirely in memory for roundtrip testing.",
          }),
          new Table({
            rows: [
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Item")] }),
                  new TableCell({ children: [new Paragraph("Qty")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Widgets")] }),
                  new TableCell({ children: [new Paragraph("3")] }),
                ],
              }),
              new TableRow({
                children: [
                  new TableCell({ children: [new Paragraph("Gadgets")] }),
                  new TableCell({ children: [new Paragraph("5")] }),
                ],
              }),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}
