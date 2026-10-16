import Sqids from "sqids";

export type SqidsConfig = {
  alphabet?: string;
  minLength?: number;
  blocklist?: Set<string>;
};

export function createSqids(config: SqidsConfig = {}): Sqids {
  return new Sqids(config);
}

export function encodeNumbers(sqids: Sqids, numbers: number[]): string {
  return sqids.encode(numbers);
}

export function decodeId(sqids: Sqids, id: string): number[] {
  return sqids.decode(id);
}
