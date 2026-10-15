import { z } from "zod";
import { extendZodWithOpenApi, OpenAPIRegistry, OpenApiGeneratorV31 } from "@asteasolutions/zod-to-openapi";
import { stringify } from "yaml";

extendZodWithOpenApi(z);

/** The same Zod schemas validate requests at runtime and describe them in the OpenAPI document. */
export const registry = new OpenAPIRegistry();

const bearer = registry.registerComponent("securitySchemes", "bearerAuth", { type: "http", scheme: "bearer", bearerFormat: "JWT" });

export const UserId = registry.registerParameter("UserId", z.uuid().openapi({ param: { name: "id", in: "path" }, example: "7f9c2a4e-0b7d-4c1a-9a51-2f3c1d9e8b10" }));

export const User = registry.register("User", z.object({
  id: z.uuid(),
  email: z.email().openapi({ example: "ada@example.test" }),
  name: z.string().min(1).max(100),
  role: z.enum(["admin", "member"]).default("member"),
  createdAt: z.iso.datetime(),
}).openapi({ description: "A registered user" }));

export const CreateUser = registry.register("CreateUser", User.pick({ email: true, name: true, role: true }));

export const Problem = registry.register("Problem", z.object({
  type: z.string(), title: z.string(), status: z.number().int(),
  errors: z.array(z.object({ path: z.string(), message: z.string() })).optional(),
}));

registry.registerPath({
  method: "get", path: "/users/{id}", operationId: "getUser", tags: ["users"], summary: "Fetch one user",
  security: [{ [bearer.name]: [] }],
  request: { params: z.object({ id: UserId }) },
  responses: {
    200: { description: "The user", content: { "application/json": { schema: User } } },
    404: { description: "Not found", content: { "application/problem+json": { schema: Problem } } },
  },
});

registry.registerPath({
  method: "post", path: "/users", operationId: "createUser", tags: ["users"], summary: "Create a user",
  security: [{ [bearer.name]: [] }],
  request: { body: { required: true, content: { "application/json": { schema: CreateUser } } } },
  responses: {
    201: { description: "Created", content: { "application/json": { schema: User } } },
    422: { description: "Validation failed", content: { "application/problem+json": { schema: Problem } } },
  },
});

registry.registerPath({
  method: "get", path: "/users", operationId: "listUsers", tags: ["users"],
  request: { query: z.object({ role: z.enum(["admin", "member"]).optional(), limit: z.coerce.number().int().min(1).max(100).default(20) }) },
  responses: { 200: { description: "Users", content: { "application/json": { schema: z.array(User) } } } },
});

export function buildDocument() {
  return new OpenApiGeneratorV31(registry.definitions).generateDocument({
    openapi: "3.1.0",
    info: { title: "Users API", version: "1.0.0" },
    servers: [{ url: "https://api.example.test" }],
  });
}

export const toYaml = () => stringify(buildDocument());
