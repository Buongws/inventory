import Joi from "joi";
import { validateCronExpression } from "cron";
export const envSchema = Joi.object({
  REFRESH_TOKEN_CLEANUP_ENABLED: Joi.boolean().default(true),
  REFRESH_TOKEN_CLEANUP_CRON: Joi.string()
    .custom((value: string, helpers) =>
      value.trim().split(/\s+/).length === 6 &&
      validateCronExpression(value).valid
        ? value
        : helpers.error("any.invalid"),
    )
    .default("0 0 * * * *"),
  REFRESH_TOKEN_CLEANUP_BATCH_SIZE: Joi.number()
    .integer()
    .min(100)
    .max(10000)
    .default(1000),
  REFRESH_TOKEN_CLEANUP_MAX_BATCHES: Joi.number()
    .integer()
    .min(1)
    .max(1000)
    .default(20),
  REFRESH_TOKEN_CLEANUP_RETENTION_DAYS: Joi.number()
    .integer()
    .min(0)
    .max(3650)
    .default(0),
  NODE_ENV: Joi.string()
    .valid("development", "test", "production")
    .default("development"),
  PORT: Joi.number().integer().min(1).max(65535).default(3001),
  DATABASE_URL: Joi.string()
    .uri({ scheme: ["postgres", "postgresql"] })
    .required(),
  REDIS_URL: Joi.string()
    .uri({ scheme: ["redis", "rediss"] })
    .required(),
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_ISSUER: Joi.string().default("inventory-api"),
  JWT_AUDIENCE: Joi.string().default("inventory-api"),
  APP_ORIGIN: Joi.string().uri().default("http://localhost:3002"),
  GOOGLE_CLIENT_ID: Joi.string().optional(),
  GOOGLE_CLIENT_SECRET: Joi.string().optional(),
  GOOGLE_REDIRECT_URI: Joi.string()
    .uri()
    .default("http://localhost:3004/api/v1/auth/google/callback"),
});
