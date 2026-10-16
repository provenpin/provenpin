import superjson, { type SuperJSONResult } from "superjson";

export function encode(value: unknown): string {
  return superjson.stringify(value);
}

export function decode<T>(text: string): T {
  return superjson.parse<T>(text);
}

export function serialize<T>(value: T): SuperJSONResult {
  return superjson.serialize(value);
}

export function deserialize<T>(payload: SuperJSONResult): T {
  return superjson.deserialize<T>(payload);
}
