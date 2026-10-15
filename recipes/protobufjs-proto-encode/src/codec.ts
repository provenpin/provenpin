import protobuf from "protobufjs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

export type Person = { name: string; id: number; email: string };

export async function loadPersonType() {
  const root = await protobuf.load(join(here, "person.proto"));
  return root.lookupType("demo.Person");
}

export function encodePerson(Type: protobuf.Type, person: Person) {
  const err = Type.verify(person);
  if (err) throw new Error(err);
  const message = Type.create(person);
  return Type.encode(message).finish();
}

export function decodePerson(Type: protobuf.Type, buf: Uint8Array): Person {
  return Type.toObject(Type.decode(buf), { defaults: true }) as Person;
}
