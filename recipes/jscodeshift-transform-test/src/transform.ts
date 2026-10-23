import jscodeshift from "jscodeshift";
import type { API, FileInfo } from "jscodeshift";

const PARSER = "tsx";

export type RenameOptions = {
  from: string;
  to: string;
};

export default function transform(
  file: FileInfo,
  _api: API,
  options: RenameOptions,
): string {
  const j = jscodeshift.withParser(PARSER);
  const root = j(file.source);
  const { from, to } = options;

  root.find(j.Identifier).forEach((path) => {
    if (path.node.name !== from) return;
    const parent = path.parentPath ? path.parentPath.node : null;
    if (parent) {
      if (
        parent.type === "MemberExpression" &&
        parent.property === path.node &&
        !parent.computed
      ) {
        return;
      }
      if (
        (parent.type === "ObjectProperty" || parent.type === "Property") &&
        parent.key === path.node &&
        !parent.computed
      ) {
        return;
      }
    }
    path.node.name = to;
  });

  root.find(j.VariableDeclaration).forEach((path) => {
    const declaration = path.node;
    if (declaration.declarations.length !== 1) return;
    const declarator = declaration.declarations[0];
    if (declarator.type !== "VariableDeclarator") return;
    const init = declarator.init;
    if (init == null || init.type !== "CallExpression") return;
    if (init.callee.type !== "Identifier" || init.callee.name !== "require") return;
    if (init.arguments.length !== 1) return;

    const source = init.arguments[0];
    if (source.type !== "StringLiteral" && source.type !== "Literal") return;
    if (typeof source.value !== "string") return;

    const specifiers = [];
    const id = declarator.id;
    if (id.type === "Identifier") {
      specifiers.push(j.importDefaultSpecifier(j.identifier(id.name)));
    } else if (id.type === "ObjectPattern") {
      for (const property of id.properties) {
        if (property.type !== "ObjectProperty" && property.type !== "Property") {
          return;
        }
        if (property.computed) return;
        if (property.key.type !== "Identifier") return;
        const importedName = property.key.name;
        const localName =
          property.value.type === "Identifier"
            ? property.value.name
            : importedName;
        specifiers.push(
          j.importSpecifier(j.identifier(importedName), j.identifier(localName)),
        );
      }
    } else {
      return;
    }

    j(path).replaceWith(j.importDeclaration(specifiers, source));
  });

  return root.toSource();
}

export function runTransform(source: string, options: RenameOptions): string {
  const api = {} as API;
  return transform({ path: "input.tsx", source }, api, options);
}
