import { test } from "node:test";
import assert from "node:assert/strict";
import { inMemoryProject, generateClient, renameAndModernize, stripConsoleLogs, typeErrors } from "../src/codemod.ts";

const routes = [
  { name: "listCourses", method: "GET" as const, path: "/courses", returns: "Course[]" },
  { name: "createCourse", method: "POST" as const, path: "/courses", returns: "Course" },
];

test("generates a typed client module", () => {
  const project = inMemoryProject();
  const sf = generateClient(project, routes);
  const text = sf.getFullText();
  assert.match(text, /export interface Course \{\n  id: string;\n  hours: number;\n\}/);
  assert.match(text, /export async function createCourse\(body: unknown\): Promise<Course> \{/);
  assert.deepEqual(sf.getFunctions().map((f) => f.getName()), ["listCourses", "createCourse"]);
});

test("generated code type-checks, broken code does not", () => {
  const project = inMemoryProject();
  project.createSourceFile("/lib.d.ts", "declare function fetch(u: string, i?: object): Promise<{ json(): Promise<unknown> }>;");
  generateClient(project, routes);
  assert.deepEqual(typeErrors(project), []);
  project.createSourceFile("/bad.ts", "const n: number = 'nope';");
  const bad = typeErrors(project);
  assert.equal(bad.length, 1);
  assert.match(bad[0], /not assignable to type 'number'/);
});

test("rename updates call sites and var becomes const", () => {
  const project = inMemoryProject();
  const sf = project.createSourceFile("/src/a.ts", "export function oldName(x: number) { return x * 2; }\nvar y = oldName(2);\nexport var z = oldName(y);\n");
  renameAndModernize(sf, "oldName", "double");
  assert.equal(sf.getFullText(), "export function double(x: number) { return x * 2; }\nconst y = double(2);\nexport const z = double(y);\n");
});

test("rename crosses files through imports", () => {
  const project = inMemoryProject();
  const a = project.createSourceFile("/src/a.ts", "export function oldName() { return 1; }\n");
  const b = project.createSourceFile("/src/b.ts", 'import { oldName } from "./a";\nexport const v = oldName();\n');
  renameAndModernize(a, "oldName", "one");
  assert.equal(b.getFullText(), 'import { one } from "./a";\nexport const v = one();\n');
});

test("strip console.log statements", () => {
  const project = inMemoryProject();
  const sf = project.createSourceFile("/c.ts", "function f() {\n  console.log('a');\n  return 1;\n}\nconsole.log(f());\nconsole.error('keep');\n");
  assert.equal(stripConsoleLogs(sf), 2);
  // ts-morph keeps the blank-line separation that followed the function
  assert.equal(sf.getFullText(), "function f() {\n  return 1;\n}\n\nconsole.error('keep');\n");
});
