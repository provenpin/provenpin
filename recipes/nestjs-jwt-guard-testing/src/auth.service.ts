import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";

export type SessionUser = { sub: string; username: string };

@Injectable()
export class AuthService {
  constructor(@Inject(JwtService) private readonly jwt: JwtService) {}

  login(username: string): { access_token: string } {
    const payload: SessionUser = { sub: username, username };
    return { access_token: this.jwt.sign(payload) };
  }

  verify(token: string): SessionUser {
    return this.jwt.verify<SessionUser>(token);
  }
}
