import openapiTS, { astToString } from "openapi-typescript";
import type { OpenAPI3 } from "openapi-typescript";

export const usersSpec: OpenAPI3 = {
  openapi: "3.1.0",
  info: { title: "Users API", version: "1.0.0" },
  paths: {
    "/users": {
      get: {
        operationId: "listUsers",
        responses: {
          "200": {
            description: "A list of users",
            content: {
              "application/json": {
                schema: {
                  type: "array",
                  items: { $ref: "#/components/schemas/User" },
                },
              },
            },
          },
        },
      },
      post: {
        operationId: "createUser",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewUser" },
            },
          },
        },
        responses: {
          "201": {
            description: "Created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
    },
    "/users/{id}": {
      get: {
        operationId: "getUser",
        parameters: [
          { name: "id", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: {
          "200": {
            description: "A single user",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/User" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      User: {
        type: "object",
        required: ["id", "name"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
        },
      },
      NewUser: {
        type: "object",
        required: ["name"],
        properties: {
          name: { type: "string" },
        },
      },
    },
  },
};

export async function generateTypes(
  spec: OpenAPI3 = usersSpec,
): Promise<string> {
  const ast = await openapiTS(spec);
  return astToString(ast);
}
