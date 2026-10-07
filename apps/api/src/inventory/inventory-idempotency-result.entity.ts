import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "../auth/entities/user.entity";
import { StockMovement } from "./stock-movement.entity";

@Entity("inventory_idempotency_results")
@Unique("uq_inventory_idempotency_scope", ["actorId", "operation", "key"])
@Unique("uq_inventory_idempotency_movement", ["movementId"])
@Index("idx_inventory_idempotency_expiry", ["expiresAt", "id"])
@Check(
  "ck_inventory_idempotency_operation",
  "\"operation\" = 'inventory.movement.v1'",
)
@Check("ck_inventory_idempotency_key", "\"key\" ~ '^[A-Za-z0-9._:-]{1,128}$'")
@Check("ck_inventory_idempotency_hash", "\"request_hash\" ~ '^[0-9a-f]{64}$'")
@Check("ck_inventory_idempotency_status", '"http_status" IN (201,404,409)')
@Check(
  "ck_inventory_idempotency_body",
  "jsonb_typeof(\"response_body\") = 'object'",
)
@Check(
  "ck_inventory_idempotency_outcome",
  '("http_status" = 201) = ("movement_id" IS NOT NULL)',
)
@Check(
  "ck_inventory_idempotency_expiry",
  '"expires_at" = "completed_at" + interval \'24 hours\'',
)
export class InventoryIdempotencyResult {
  @PrimaryGeneratedColumn("uuid", { name: "id" }) id!: string;
  @Column({ name: "actor_id", type: "uuid" }) actorId!: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "fk_inventory_idempotency_actor",
  })
  actor!: User;
  @Column({ name: "operation", type: "varchar", length: 32 })
  operation!: string;
  @Column({ name: "key", type: "varchar", length: 128, collation: "C" })
  key!: string;
  @Column({ name: "request_product_id", type: "uuid" })
  requestProductId!: string;
  @Column({ name: "request_hash", type: "char", length: 64 })
  requestHash!: string;
  @Column({ name: "http_status", type: "smallint" }) httpStatus!: number;
  @Column({ name: "response_body", type: "jsonb" }) responseBody!: Record<
    string,
    unknown
  >;
  @Column({ name: "movement_id", type: "uuid", nullable: true }) movementId!:
    string | null;
  @ManyToOne(() => StockMovement, { onDelete: "RESTRICT", nullable: true })
  @JoinColumn({
    name: "movement_id",
    foreignKeyConstraintName: "fk_inventory_idempotency_movement",
  })
  movement!: StockMovement | null;
  @Column({ name: "completed_at", type: "timestamptz" }) completedAt!: Date;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
}
