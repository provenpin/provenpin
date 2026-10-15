import { parse } from "@babel/parser";
import * as traverseModule from "@babel/traverse";
import * as generatorModule from "@babel/generator";
import * as t from "@babel/types";
import type { NodePath } from "@babel/traverse";

const traverse = (traverseModule as any).default ?? traverseModule;
const generate = (generatorModule as any).default ?? generatorModule;

export type RenameSpec = {
  from: string;
  to: string;
};

export type CodemodOptions = {
  rename?: RenameSpec;
  removeConsoleLogs?: boolean;
};

export type CodemodResult = {
  code: string;
  renamed: number;
  removedLogs: number;
};

function isConsoleLogCallee(path: NodePath<t.CallExpression>): boolean {
  const callee = path.get("callee") as unknown as {
    isMemberExpression(): boolean;
    isOptionalMemberExpression(): boolean;
    node: t.Node;
  };
  if (!callee.isMemberExpression() && !callee.isOptionalMemberExpression()) {
    return false;
  }
  const node = callee.node as t.MemberExpression;
  if (!t.isIdentifier(node.object, { name: "console" })) {
    return false;
  }
  if (node.computed) {
    return t.isStringLiteral(node.property, { value: "log" });
  }
  return t.isIdentifier(node.property, { name: "log" });
}

export function codemod(source: string, options: CodemodOptions = {}): CodemodResult {
  const ast = parse(source, {
    sourceType: "module",
    plugins: ["typescript"],
  });

  let renamed = 0;
  let removedLogs = 0;

  traverse(ast, {
    Scopable(path: NodePath<any>) {
      const spec = options.rename;
      if (spec && spec.from !== spec.to && path.scope.hasOwnBinding(spec.from)) {
        path.scope.rename(spec.from, spec.to);
        renamed += 1;
      }
    },
    CallExpression(path: NodePath<t.CallExpression>) {
      if (!options.removeConsoleLogs) {
        return;
      }
      if (!isConsoleLogCallee(path)) {
        return;
      }
      const statement = path.parentPath;
      if (statement && statement.isExpressionStatement()) {
        statement.remove();
        removedLogs += 1;
      }
    },
  });

  const { code } = generate(ast);
  return { code, renamed, removedLogs };
}

export function renameIdentifier(source: string, from: string, to: string): string {
  return codemod(source, { rename: { from, to } }).code;
}

export function removeConsoleLogs(source: string): string {
  return codemod(source, { removeConsoleLogs: true }).code;
}
