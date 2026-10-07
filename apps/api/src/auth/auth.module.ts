import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AccessTokenGuard } from "./auth.guard";
import { AuthIdentity } from "./entities/auth-identity.entity";
import { RefreshToken } from "./entities/refresh-token.entity";
import { User } from "./entities/user.entity";
import { GoogleService } from "./google.service";
import { RefreshTokenCleanupJob } from "./refresh-token-cleanup.job";
import { RefreshTokenCleanupService } from "./refresh-token-cleanup.service";

@Module({
  imports: [TypeOrmModule.forFeature([User, AuthIdentity, RefreshToken])],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleService,
    AccessTokenGuard,
    RefreshTokenCleanupJob,
    RefreshTokenCleanupService,
  ],
  exports: [AuthService, AccessTokenGuard],
})
export class AuthModule {}
