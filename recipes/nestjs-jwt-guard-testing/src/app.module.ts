import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { AuthService } from "./auth.service.ts";
import { AuthController } from "./auth.controller.ts";
import { AuthGuard } from "./auth.guard.ts";

@Module({
  imports: [
    JwtModule.register({
      secret: "provenpin-test-secret",
      signOptions: { expiresIn: "1h" },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, AuthGuard],
})
export class AppModule {}
