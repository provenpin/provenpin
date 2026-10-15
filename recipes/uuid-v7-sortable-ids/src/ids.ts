import { v7 as uuidv7, validate, version } from "uuid";

export function newId() {
  return uuidv7();
}

export function isUuidV7(value: string) {
  return validate(value) && version(value) === 7;
}

export function sortedIds(count: number) {
  const ids = Array.from({ length: count }, () => uuidv7());
  return [...ids].sort();
}
