import { MigrationInterface, QueryRunner } from "typeorm";

export class IndexRefreshTokenExpiry1790330000000 implements MigrationInterface {
  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      'CREATE INDEX "idx_refresh_tokens_expires_at" ON "refresh_tokens" ("expires_at")',
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query('DROP INDEX "idx_refresh_tokens_expires_at"');
  }
}
