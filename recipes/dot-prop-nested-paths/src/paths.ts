import {
  getProperty,
  setProperty,
  hasProperty,
  deleteProperty,
} from "dot-prop";

export function readPath<T = unknown>(object: unknown, path: string, fallback: T): T {
  const value = getProperty(object, path);
  return value === undefined ? fallback : (value as T);
}

export { getProperty, setProperty, hasProperty, deleteProperty };
