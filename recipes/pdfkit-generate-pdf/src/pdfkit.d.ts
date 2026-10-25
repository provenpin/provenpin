// pdfkit 0.20.2 ships no types and @types/pdfkit is for 0.17, so this declares only the
// calls the recipe makes, as pdfkit 0.20.2 js/pdfkit.node.mjs defines them.
declare module "pdfkit" {
  import { Readable } from "node:stream";
  interface PDFDocumentOptions {
    size?: string | [number, number];
    margin?: number;
    compress?: boolean;
  }
  interface TextOptions {
    align?: "left" | "center" | "right" | "justify";
    width?: number;
  }
  class PDFDocument extends Readable {
    constructor(options?: PDFDocumentOptions);
    x: number;
    y: number;
    font(src: string, family?: string, size?: number): this;
    fontSize(size: number): this;
    text(text: string, options?: TextOptions): this;
    text(text: string, x?: number, y?: number, options?: TextOptions): this;
    moveDown(lines?: number): this;
    moveTo(x: number, y: number): this;
    lineTo(x: number, y: number): this;
    stroke(color?: string): this;
    end(): void;
  }
  export default PDFDocument;
}
