import sharp from "sharp";
import { encode, decode, isBlurhashValid } from "blurhash";

export type Variant = { width: number; format: "webp" | "avif" | "jpeg"; buffer: Buffer; bytes: number; height: number };

/** Rotates by EXIF, strips metadata, and renders responsive widths without upscaling. */
export async function makeVariants(input: Buffer, widths = [320, 640, 1280], format: Variant["format"] = "webp"): Promise<Variant[]> {
  const base = sharp(input).rotate(); // apply EXIF orientation, then metadata is dropped by default
  const meta = await sharp(input).metadata();
  // metadata() reports stored dimensions; orientations 5 to 8 swap width and height once rotated.
  const uprightWidth = (meta.orientation ?? 1) >= 5 ? meta.height : meta.width;
  const out: Variant[] = [];
  for (const w of widths) {
    if (uprightWidth && w > uprightWidth) continue;
    const { data, info } = await base.clone().resize({ width: w, withoutEnlargement: true }).toFormat(format, { quality: 70 }).toBuffer({ resolveWithObject: true });
    out.push({ width: info.width, height: info.height, format, buffer: data, bytes: info.size });
  }
  return out;
}

/** BlurHash placeholder: downscale to 32px wide, feed raw RGBA pixels to blurhash.encode. */
export async function blurhashOf(input: Buffer, componentsX = 4, componentsY = 3): Promise<string> {
  const { data, info } = await sharp(input).rotate().resize(32, 32, { fit: "inside" }).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  return encode(new Uint8ClampedArray(data), info.width, info.height, componentsX, componentsY);
}

/** Decodes a BlurHash back into a tiny PNG, e.g. to inline as a data URL. */
export async function placeholderPng(hash: string, width = 16, height = 12): Promise<Buffer> {
  if (!isBlurhashValid(hash).result) throw new Error("invalid blurhash");
  const pixels = decode(hash, width, height);
  return sharp(Buffer.from(pixels), { raw: { width, height, channels: 4 } }).png().toBuffer();
}
