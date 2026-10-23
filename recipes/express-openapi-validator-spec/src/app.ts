import express, { type NextFunction, type Request, type Response } from "express";
import OpenApiValidator from "express-openapi-validator";

export const apiSpec = {
  openapi: "3.0.3",
  info: { title: "Items API", version: "1.0.0" },
  paths: {
    "/items": {
      post: {
        operationId: "createItem",
        requestBody: {
          required: true,
          content: {
            "application/json": {
              schema: { $ref: "#/components/schemas/NewItem" },
            },
          },
        },
        responses: {
          "201": {
            description: "Item created",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Item" },
              },
            },
          },
        },
      },
    },
    "/items/{id}": {
      get: {
        operationId: "getItem",
        parameters: [
          {
            name: "id",
            in: "path",
            required: true,
            schema: { type: "string", pattern: "^[a-z0-9-]+$" },
          },
          {
            name: "verbose",
            in: "query",
            required: false,
            schema: { type: "boolean" },
          },
        ],
        responses: {
          "200": {
            description: "An item",
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/Item" },
              },
            },
          },
        },
      },
    },
  },
  components: {
    schemas: {
      Item: {
        type: "object",
        required: ["id", "name", "quantity"],
        properties: {
          id: { type: "string" },
          name: { type: "string" },
          quantity: { type: "integer", minimum: 0 },
        },
      },
      NewItem: {
        type: "object",
        required: ["name", "quantity"],
        properties: {
          name: { type: "string", minLength: 1 },
          quantity: { type: "integer", minimum: 0 },
        },
      },
    },
  },
} as const;

export function createApp() {
  const app = express();
  app.use(express.json());
  app.use(
    OpenApiValidator.middleware({
      apiSpec: apiSpec as any,
      validateRequests: true,
      validateResponses: true,
    }),
  );

  app.post("/items", (req, res) => {
    const { name, quantity } = req.body as { name: string; quantity: number };
    res.status(201).json({ id: "generated", name, quantity });
  });

  app.get("/items/:id", (req, res) => {
    // The validator may coerce ?verbose=true to a boolean, so accept both forms.
    const raw: unknown = req.query.verbose;
    const verbose = raw === true || raw === "true";
    res.status(200).json({
      id: req.params.id,
      name: verbose ? `Item ${req.params.id}` : "Item",
      quantity: 1,
    });
  });

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = typeof err.status === "number" ? err.status : 500;
    res.status(status).json({
      message: err.message ?? "Internal Server Error",
      errors: Array.isArray(err.errors) ? err.errors : [],
    });
  });

  return app;
}
