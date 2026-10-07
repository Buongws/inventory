export type SubjectType = "IP" | "USER";

export interface RateLimitPolicy {
  key: string;
  subjectType: SubjectType;
  timeWindowSeconds: number;
  maxRequests: number;
}

export interface RateLimitResult {
  allowed: boolean;
  retryAfterSeconds: number;
  mode: "redis" | "emergency";
}
