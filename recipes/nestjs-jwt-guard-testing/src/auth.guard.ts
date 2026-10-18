import {
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { AuthService, type SessionUser } from "./auth.service.ts";

type BearerRequest = {
  headers: { authorization?: string };
  user?: SessionUser;
};

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(@Inject(AuthService) private readonly auth: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<BearerRequest>();
    const header = request.headers.authorization;
    if (typeof header !== "string" || !header.startsWith("Bearer ")) {
      throw new UnauthorizedException("Missing bearer token");
    }
    const token = header.slice("Bearer ".length).trim();
    try {
      request.user = this.auth.verify(token);
      return true;
    } catch {
      throw new UnauthorizedException("Invalid bearer token");
    }
  }
}
