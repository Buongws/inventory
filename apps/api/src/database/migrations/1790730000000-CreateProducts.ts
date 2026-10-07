import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProducts1790730000000 implements MigrationInterface {
  name = "CreateProducts1790730000000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "products" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "sku" varchar(64) NOT NULL,
        "name" varchar(200) NOT NULL,
        "description" varchar(5000),
        "price_vnd" bigint NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'ACTIVE',
        "image_url" varchar(2048),
        "created_at" timestamptz NOT NULL DEFAULT now(),
        "updated_at" timestamptz NOT NULL DEFAULT now(),
        CONSTRAINT "pk_products" PRIMARY KEY ("id"),
        CONSTRAINT "uq_products_sku" UNIQUE ("sku"),
        CONSTRAINT "ck_products_price_vnd" CHECK ("price_vnd" >= 0),
        CONSTRAINT "ck_products_status" CHECK ("status" IN ('ACTIVE', 'INACTIVE'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_products_status_created_id"
      ON "products" ("status", "created_at" DESC, "id" DESC)
    `);
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'DROP INDEX "public"."idx_products_status_created_id"',
    );
    await queryRunner.query('DROP TABLE "products"');
  }
}
