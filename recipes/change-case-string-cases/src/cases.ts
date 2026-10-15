import { camelCase, snakeCase, kebabCase, pascalCase, capitalCase } from "change-case";

export function allCases(input: string) {
  return {
    camel: camelCase(input),
    snake: snakeCase(input),
    kebab: kebabCase(input),
    pascal: pascalCase(input),
    capital: capitalCase(input),
  };
}
