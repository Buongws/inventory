import { Injectable, NestMiddleware } from "@nestjs/common";
import { NextFunction, Request, Response } from "express";

import { JwtSubjectService } from "./jwt-subject.service";
import { PolicyService } from "./policy.service";
import { RateLimitResult } from "./rate-limit.types";
import { RateLimitService } from "./rate-limit.service";

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly policies: PolicyService,
    private readonly rateLimit: RateLimitService,
    private readonly jwtSubject: JwtSubjectService,
  ) {}

  async use(
    request: Request,
    response: Response,
    next: NextFunction,
  ): Promise<void> {
    if (this.isExempt(request)) {
      next();
      return;
    }

    const ip = this.clientIp(request);
    const globalResult = await this.rateLimit.take(
      this.policies.get("global-ip"),
      ip,
    );
    if (!globalResult.allowed) {
      this.respondTooManyRequests(response, globalResult);
      return;
    }

    const policyKey = this.extraPolicyKey(request);
    if (!policyKey) {
      next();
      return;
    }

    const policy = this.policies.get(policyKey);
    const subject =
      policy.subjectType === "USER"
        ? await this.jwtSubject.fromRequest(request)
        : ip;

    if (policy.subjectType === "USER" && !subject) {
      next();
      return;
    }

    const result = await this.rateLimit.take(policy, subject!);
    if (!result.allowed) {
      this.respondTooManyRequests(response, result);
      return;
    }
    next();
  }

  private isExempt(request: Request): boolean {
    if (request.method === "OPTIONS") {
      return true;
    }
    return [
      "/gateway/health",
      "/docs",
      "/docs-json",
      "/api/v1/health/live",
      "/api/v1/health/ready",
    ].some(
      (path) => request.path === path || request.path.startsWith(`${path}/`),
    );
  }

  private extraPolicyKey(request: Request): string | null {
    if (request.method === "POST" && request.path === "/api/v1/auth/login")
      return "auth-login-ip";
    if (request.method === "POST" && request.path === "/api/v1/auth/register")
      return "auth-register-ip";
    if (request.method === "POST" && request.path === "/api/v1/auth/refresh")
      return "auth-refresh-ip";
    if (request.path.startsWith("/api/v1/auth/google/"))
      return "google-oauth-ip";
    if (
      ["POST", "PATCH", "DELETE"].includes(request.method) &&
      (request.path === "/api/v1/products" ||
        request.path.startsWith("/api/v1/products/"))
    )
      return "product-write-user";
    return null;
  }

  private clientIp(request: Request): string {
    const remoteAddress = request.socket.remoteAddress ?? "unknown";
    return remoteAddress.startsWith("::ffff:")
      ? remoteAddress.slice(7)
      : remoteAddress;
  }

  private respondTooManyRequests(
    response: Response,
    result: RateLimitResult,
  ): void {
    response.setHeader("Retry-After", String(result.retryAfterSeconds));
    response.setHeader("X-Rate-Limit-Mode", result.mode);
    response.status(429).json({
      statusCode: 429,
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests",
      retryAfterSeconds: result.retryAfterSeconds,
    });
  }
}
