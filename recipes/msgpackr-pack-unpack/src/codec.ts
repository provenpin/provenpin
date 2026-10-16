import { pack, unpack, Packr, Unpackr } from "msgpackr";

export { pack, unpack, Packr, Unpackr };

export type PackrOptions = ConstructorParameters<typeof Packr>[0];
export type UnpackrOptions = ConstructorParameters<typeof Unpackr>[0];

export type EventRecord = {
  id: string;
  at: Date;
  labels: Map<string, string>;
  payload: Buffer;
};

export function encodeEvent(event: EventRecord, options?: PackrOptions): Buffer {
  return new Packr(options).pack(event);
}

export function decodeEvent(data: Buffer, options?: UnpackrOptions): EventRecord {
  return new Unpackr(options).unpack(data) as EventRecord;
}

export function packedSize(value: unknown): number {
  return pack(value).length;
}

export function jsonSize(value: unknown): number {
  return Buffer.byteLength(JSON.stringify(value), "utf8");
}
