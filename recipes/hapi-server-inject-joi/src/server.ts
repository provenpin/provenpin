import Hapi from "@hapi/hapi";
import Joi from "joi";
import Boom from "@hapi/boom";

const failAction: Hapi.Lifecycle.FailAction = (_request, _h, err) => {
  throw Boom.badRequest(err?.message ?? "Invalid request");
};

export function createServer(): Hapi.Server {
  const server = Hapi.server({ port: 0 });

  server.route({
    method: "GET",
    path: "/users/{id}",
    options: {
      validate: {
        params: Joi.object({
          id: Joi.string()
            .pattern(/^u_[a-z0-9]+$/)
            .required(),
        }),
        failAction,
      },
    },
    handler: (request) => {
      const { id } = request.params as { id: string };
      if (id === "u_missing") {
        throw Boom.notFound(`User ${id} was not found`);
      }
      return { id, name: "Ada" };
    },
  });

  server.route({
    method: "POST",
    path: "/users",
    options: {
      validate: {
        payload: Joi.object({
          name: Joi.string().min(1).max(80).required(),
          email: Joi.string().email().required(),
        }),
        failAction,
      },
    },
    handler: (request, h) => {
      const { name, email } = request.payload as {
        name: string;
        email: string;
      };
      return h.response({ id: `u_${name.toLowerCase()}`, name, email }).code(201);
    },
  });

  server.route({
    method: "GET",
    path: "/search",
    options: {
      validate: {
        query: Joi.object({
          q: Joi.string().min(1).max(50).required(),
          limit: Joi.number().integer().min(1).max(50).default(10),
        }),
        failAction,
      },
    },
    handler: (request) => {
      const { q, limit } = request.query as { q: string; limit: number };
      return { q, limit };
    },
  });

  return server;
}
