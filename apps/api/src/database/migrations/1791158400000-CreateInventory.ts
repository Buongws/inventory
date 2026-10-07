import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateInventory1791158400000 implements MigrationInterface {
  name = "CreateInventory1791158400000";

  async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE TABLE inventory_balances (
      product_id uuid CONSTRAINT pk_inventory_balances PRIMARY KEY,
      on_hand_qty integer NOT NULL DEFAULT 0,
      updated_at timestamptz NOT NULL,
      CONSTRAINT fk_inventory_balances_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      CONSTRAINT ck_inventory_balances_quantity CHECK (on_hand_qty BETWEEN 0 AND 2147483647)
    )`);
    await queryRunner.query(`CREATE TABLE stock_movements (
      id uuid DEFAULT gen_random_uuid() CONSTRAINT pk_stock_movements PRIMARY KEY,
      product_id uuid NOT NULL, type varchar(7) NOT NULL, quantity integer NOT NULL,
      balance_before integer NOT NULL, balance_after integer NOT NULL,
      actor_id uuid NOT NULL, reason varchar(500) NOT NULL, created_at timestamptz NOT NULL,
      CONSTRAINT fk_stock_movements_product FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE RESTRICT,
      CONSTRAINT fk_stock_movements_actor FOREIGN KEY (actor_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT ck_stock_movements_type CHECK (type IN ('RECEIPT','ISSUE')),
      CONSTRAINT ck_stock_movements_quantity CHECK (quantity BETWEEN 1 AND 1000000),
      CONSTRAINT ck_stock_movements_balances CHECK (balance_before >= 0 AND balance_after >= 0),
      CONSTRAINT ck_stock_movements_reason CHECK (char_length(reason) BETWEEN 1 AND 500 AND reason = btrim(reason) AND btrim(reason) <> ''),
      CONSTRAINT ck_stock_movements_delta CHECK (
        (type = 'RECEIPT' AND balance_after::bigint = balance_before::bigint + quantity::bigint) OR
        (type = 'ISSUE' AND balance_after::bigint = balance_before::bigint - quantity::bigint))
    )`);
    await queryRunner.query(
      `CREATE INDEX idx_stock_movements_product_created_id ON stock_movements(product_id,created_at DESC,id DESC)`,
    );
    await queryRunner.query(
      `CREATE INDEX idx_stock_movements_actor ON stock_movements(actor_id)`,
    );
    await queryRunner.query(`CREATE TABLE inventory_idempotency_results (
      id uuid DEFAULT gen_random_uuid() CONSTRAINT pk_inventory_idempotency_results PRIMARY KEY,
      actor_id uuid NOT NULL, operation varchar(32) NOT NULL, key varchar(128) COLLATE "C" NOT NULL,
      request_product_id uuid NOT NULL, request_hash char(64) NOT NULL,
      http_status smallint NOT NULL, response_body jsonb NOT NULL, movement_id uuid,
      completed_at timestamptz NOT NULL, expires_at timestamptz NOT NULL,
      CONSTRAINT fk_inventory_idempotency_actor FOREIGN KEY(actor_id) REFERENCES users(id) ON DELETE RESTRICT,
      CONSTRAINT fk_inventory_idempotency_movement FOREIGN KEY(movement_id) REFERENCES stock_movements(id) ON DELETE RESTRICT,
      CONSTRAINT uq_inventory_idempotency_scope UNIQUE(actor_id,operation,key),
      CONSTRAINT uq_inventory_idempotency_movement UNIQUE(movement_id),
      CONSTRAINT ck_inventory_idempotency_operation CHECK(operation = 'inventory.movement.v1'),
      CONSTRAINT ck_inventory_idempotency_key CHECK(key ~ '^[A-Za-z0-9._:-]{1,128}$'),
      CONSTRAINT ck_inventory_idempotency_hash CHECK(request_hash ~ '^[0-9a-f]{64}$'),
      CONSTRAINT ck_inventory_idempotency_status CHECK(http_status IN (201,404,409)),
      CONSTRAINT ck_inventory_idempotency_body CHECK(jsonb_typeof(response_body) = 'object'),
      CONSTRAINT ck_inventory_idempotency_outcome CHECK((http_status = 201) = (movement_id IS NOT NULL)),
      CONSTRAINT ck_inventory_idempotency_expiry CHECK(expires_at = completed_at + interval '24 hours')
    )`);
    await queryRunner.query(
      `CREATE INDEX idx_inventory_idempotency_expiry ON inventory_idempotency_results(expires_at,id)`,
    );
  }

  async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query("DROP TABLE inventory_idempotency_results");
    await queryRunner.query("DROP TABLE stock_movements");
    await queryRunner.query("DROP TABLE inventory_balances");
  }
}
