import { Body, Controller, Get, Inject, Post, Request, UseGuards } from "@nestjs/common";
import { AuthService, type SessionUser } from "./auth.service.ts";
import { AuthGuard } from "./auth.guard.ts";

@Controller()
export class AuthController {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  @Post("login")
  login(@Body("username") username: string): { access_token: string } {
    return this.auth.login(username);
  }

  @UseGuards(AuthGuard)
  @Get("profile")
  profile(@Request() request: { user?: SessionUser }): { user: SessionUser | undefined } {
    return { user: request.user };
  }
}
