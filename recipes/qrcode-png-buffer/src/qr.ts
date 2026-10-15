import QRCode from "qrcode";

export async function toPngBuffer(text: string, margin = 1) {
  return QRCode.toBuffer(text, {
    type: "png",
    errorCorrectionLevel: "M",
    margin,
    width: 256,
  });
}

export async function toDataUrl(text: string) {
  return QRCode.toDataURL(text, { errorCorrectionLevel: "M", margin: 1 });
}

export async function toAscii(text: string) {
  return QRCode.toString(text, { type: "terminal", small: true });
}
