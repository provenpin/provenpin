import { Jimp, JimpMime } from "jimp";

export async function squareThumb(input: Buffer, size = 128) {
  const img = await Jimp.read(input);
  img.cover({ w: size, h: size }); // scale + center-crop
  return img.getBuffer(JimpMime.png);
}

export async function fitWidth(input: Buffer, width: number, quality = 80) {
  const img = await Jimp.read(input);
  if (img.width > width) img.resize({ w: width }); // height follows aspect ratio
  return img.getBuffer(JimpMime.jpeg, { quality });
}

export async function size(buf: Buffer) {
  const img = await Jimp.read(buf);
  return { w: img.width, h: img.height, mime: img.mime };
}
