import { pack, unpack } from "msgpackr";

export type Payload = {
  id: number;
  name: string;
  tags: string[];
  meta: { ok: boolean; score: number };
};

export function encode(value: Payload): Buffer {
  return pack(value) as Buffer;
}

export function decode(buf: Buffer): Payload {
  return unpack(buf) as Payload;
}
