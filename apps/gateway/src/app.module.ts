import { Module } from "@nestjs/common";

import { GatewayHealthController } from "./gateway-health.controller";
import { JwtSubjectService } from "./jwt-subject.service";
import { LocalEmergencyLimiterService } from "./local-emergency-limiter.service";
import { PolicyService } from "./policy.service";
import { RateLimitMiddleware } from "./rate-limit.middleware";
import { RateLimitService } from "./rate-limit.service";

@Module({
  controllers: [GatewayHealthController],
  providers: [
    JwtSubjectService,
    LocalEmergencyLimiterService,
    PolicyService,
    RateLimitMiddleware,
    RateLimitService,
  ],
})
export class AppModule {}
