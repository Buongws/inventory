import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateRateLimitPolicies1727251300000 implements MigrationInterface {
  name = "CreateRateLimitPolicies1727251300000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "rate_limit_policies" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "policy_key" varchar(100) NOT NULL,
        "description" varchar(255) NOT NULL,
        "subject_type" varchar(20) NOT NULL,
        "algorithm" varchar(30) NOT NULL DEFAULT 'FIXED_WINDOW',
        "time_window_seconds" integer NOT NULL,
        "max_requests" integer NOT NULL,
        "enabled" boolean NOT NULL DEFAULT true,
        "version" integer NOT NULL DEFAULT 1,
        "updated_by_user_id" uuid,
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_rate_limit_policies" PRIMARY KEY ("id"),
        CONSTRAINT "uq_rate_limit_policies_policy_key" UNIQUE ("policy_key"),
        CONSTRAINT "ck_rate_limit_policies_subject_type" CHECK ("subject_type" IN ('IP', 'USER')),
        CONSTRAINT "ck_rate_limit_policies_algorithm" CHECK ("algorithm" IN ('FIXED_WINDOW')),
        CONSTRAINT "ck_rate_limit_policies_window" CHECK ("time_window_seconds" > 0),
        CONSTRAINT "ck_rate_limit_policies_max_requests" CHECK ("max_requests" > 0),
        CONSTRAINT "fk_rate_limit_policies_updated_by" FOREIGN KEY ("updated_by_user_id") REFERENCES "users"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(`
      INSERT INTO "rate_limit_policies" ("policy_key", "description", "subject_type", "time_window_seconds", "max_requests") VALUES
        ('global-ip', 'All proxied API requests per IP', 'IP', 60, 120),
        ('auth-login-ip', 'Login requests per IP', 'IP', 60, 10),
        ('auth-register-ip', 'Registration requests per IP', 'IP', 60, 5),
        ('auth-refresh-ip', 'Refresh requests per IP', 'IP', 60, 30),
        ('google-oauth-ip', 'Google OAuth routes per IP', 'IP', 60, 20),
        ('product-write-user', 'Product write requests per authenticated user', 'USER', 60, 30)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP TABLE "rate_limit_policies"');
  }
}
