import "reflect-metadata";
import { Body, Controller, Module, Post } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { z } from "zod";
import { ZodPipe } from "./zod-pipe.ts";

export const CreateUser = z.object({
  email: z.email(),
  name: z.string().min(2).max(80),
  age: z.coerce.number().int().min(13).optional(),
});

@Controller("users")
class UsersController {
  @Post()
  create(@Body(new ZodPipe(CreateUser)) body: z.infer<typeof CreateUser>) {
    return { id: 1, ...body };
  }
}

@Module({ controllers: [UsersController] })
class AppModule {}

export async function createApp() {
  const app = await NestFactory.create(AppModule, { logger: false });
  await app.init();
  return app;
}
