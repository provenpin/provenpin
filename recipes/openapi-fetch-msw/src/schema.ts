/** Minimal OpenAPI paths typing for openapi-fetch (hand-written stand-in for openapi-typescript output). */
export type paths = {
  "/items": {
    get: {
      parameters: { query?: { q?: string } };
      responses: {
        200: { content: { "application/json": { id: number; name: string }[] } };
      };
    };
    post: {
      requestBody: { content: { "application/json": { name: string } } };
      responses: {
        201: { content: { "application/json": { id: number; name: string } } };
      };
    };
  };
  "/items/{id}": {
    get: {
      parameters: { path: { id: number } };
      responses: {
        200: { content: { "application/json": { id: number; name: string } } };
        404: { content: { "application/json": { error: string } } };
      };
    };
  };
};
