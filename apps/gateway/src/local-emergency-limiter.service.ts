import { Injectable } from "@nestjs/common";

interface Counter {
  count: number;
  expiresAt: number;
}

@Injectable()
export class LocalEmergencyLimiterService {
  private readonly counters = new Map<string, Counter>();

  take(
    key: string,
    maxRequests: number,
    windowSeconds: number,
  ): {
    allowed: boolean;
    retryAfterSeconds: number;
  } {
    const now = Date.now();
    const existing = this.counters.get(key);
    const counter =
      !existing || existing.expiresAt <= now
        ? { count: 0, expiresAt: now + windowSeconds * 1000 }
        : existing;

    if (counter.count >= maxRequests) {
      this.counters.set(key, counter);
      return {
        allowed: false,
        retryAfterSeconds: Math.max(
          1,
          Math.ceil((counter.expiresAt - now) / 1000),
        ),
      };
    }

    counter.count += 1;
    this.counters.set(key, counter);
    return {
      allowed: true,
      retryAfterSeconds: Math.max(
        1,
        Math.ceil((counter.expiresAt - now) / 1000),
      ),
    };
  }
}
