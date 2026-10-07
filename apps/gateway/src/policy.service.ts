import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Pool } from "pg";

import { config } from "./config";
import { RateLimitPolicy, SubjectType } from "./rate-limit.types";

interface PolicyRow {
  policy_key: string;
  subject_type: SubjectType;
  time_window_seconds: number;
  max_requests: number;
}

const REQUIRED_POLICY_KEYS = [
  "global-ip",
  "auth-login-ip",
  "auth-register-ip",
  "auth-refresh-ip",
  "google-oauth-ip",
  "product-write-user",
];

@Injectable()
export class PolicyService implements OnModuleInit, OnModuleDestroy {
  private readonly pool = new Pool({ connectionString: config.DATABASE_URL });
  private policies = new Map<string, RateLimitPolicy>();

  async onModuleInit(): Promise<void> {
    const result = await this.pool.query<PolicyRow>(
      `SELECT policy_key, subject_type, time_window_seconds, max_requests
       FROM rate_limit_policies
       WHERE enabled = true`,
    );

    const policies = new Map<string, RateLimitPolicy>();
    for (const row of result.rows) {
      policies.set(row.policy_key, {
        key: row.policy_key,
        subjectType: row.subject_type,
        timeWindowSeconds: row.time_window_seconds,
        maxRequests: row.max_requests,
      });
    }

    const missing = REQUIRED_POLICY_KEYS.filter((key) => !policies.has(key));
    if (missing.length > 0) {
      throw new Error(
        `Missing enabled rate-limit policies: ${missing.join(", ")}`,
      );
    }

    this.policies = policies;
  }

  get(key: string): RateLimitPolicy {
    const policy = this.policies.get(key);
    if (!policy) {
      throw new Error(`Rate-limit policy is unavailable: ${key}`);
    }
    return policy;
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
