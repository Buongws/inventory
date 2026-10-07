import { Injectable, Logger, OnModuleDestroy } from "@nestjs/common";
import Redis from "ioredis";

import { config } from "./config";
import { LocalEmergencyLimiterService } from "./local-emergency-limiter.service";
import { RateLimitPolicy, RateLimitResult } from "./rate-limit.types";

const FIXED_WINDOW_SCRIPT = `
local current = redis.call('GET', KEYS[1])
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])
if not current then
  redis.call('SET', KEYS[1], 1, 'PX', ttl)
  return {1, 1, ttl}
end
local count = tonumber(current)
local remainingTtl = redis.call('PTTL', KEYS[1])
if count >= limit then
  return {0, count, remainingTtl}
end
count = redis.call('INCR', KEYS[1])
return {1, count, remainingTtl}
`;

@Injectable()
export class RateLimitService implements OnModuleDestroy {
  private readonly logger = new Logger(RateLimitService.name);
  private readonly redis = new Redis(config.REDIS_URL, {
    connectTimeout: 500,
    commandTimeout: 500,
    lazyConnect: true,
    enableOfflineQueue: false,
    maxRetriesPerRequest: 0,
    retryStrategy: () => null,
  });
  private redisUnavailableLogged = false;

  constructor(
    private readonly emergencyLimiter: LocalEmergencyLimiterService,
  ) {}

  async take(
    policy: RateLimitPolicy,
    subject: string,
  ): Promise<RateLimitResult> {
    const key = `rate-limit:${config.NODE_ENV}:${policy.key}:${policy.subjectType.toLowerCase()}:${subject}`;
    const windowMilliseconds = policy.timeWindowSeconds * 1000;

    try {
      if (this.redis.status === "wait" || this.redis.status === "end") {
        await this.redis.connect();
      }
      const result = (await this.redis.eval(
        FIXED_WINDOW_SCRIPT,
        1,
        key,
        policy.maxRequests,
        windowMilliseconds,
      )) as [number, number, number];
      this.redisUnavailableLogged = false;
      return {
        allowed: result[0] === 1,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil(Math.max(0, result[2]) / 1000),
        ),
        mode: "redis",
      };
    } catch (error) {
      if (!this.redisUnavailableLogged) {
        this.redisUnavailableLogged = true;
        this.logger.warn(
          `Redis unavailable; using per-instance emergency limiter: ${String(error)}`,
        );
      }
      const emergencyMax = Math.max(1, Math.ceil(policy.maxRequests / 4));
      const emergency = this.emergencyLimiter.take(
        key,
        emergencyMax,
        policy.timeWindowSeconds,
      );
      return { ...emergency, mode: "emergency" };
    }
  }

  async onModuleDestroy(): Promise<void> {
    this.redis.disconnect();
  }
}
