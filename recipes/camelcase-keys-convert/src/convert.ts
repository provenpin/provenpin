import camelCase from "camelcase";
import camelcaseKeys from "camelcase-keys";

export function toCamel(input: string): string {
  return camelCase(input);
}

export function toPascal(input: string): string {
  return camelCase(input, { pascalCase: true });
}

export function convertKeysDeep<T>(input: T): T {
  return camelcaseKeys(input as Record<string, unknown>, { deep: true }) as unknown as T;
}
