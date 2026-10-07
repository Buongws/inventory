import {
  Check,
  Column,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Product } from "../products/product.entity";
import { User } from "../auth/entities/user.entity";

export enum MovementType {
  RECEIPT = "RECEIPT",
  ISSUE = "ISSUE",
}

@Entity("stock_movements")
@Index("idx_stock_movements_product_created_id", [
  "productId",
  "createdAt",
  "id",
])
@Index("idx_stock_movements_actor", ["actorId"])
@Check("ck_stock_movements_type", "\"type\" IN ('RECEIPT', 'ISSUE')")
@Check("ck_stock_movements_quantity", '"quantity" BETWEEN 1 AND 1000000')
@Check(
  "ck_stock_movements_balances",
  '"balance_before" >= 0 AND "balance_after" >= 0',
)
@Check(
  "ck_stock_movements_reason",
  'char_length("reason") BETWEEN 1 AND 500 AND "reason" = btrim("reason") AND btrim("reason") <> \'\'',
)
@Check(
  "ck_stock_movements_delta",
  '("type" = \'RECEIPT\' AND "balance_after"::bigint = "balance_before"::bigint + "quantity"::bigint) OR ("type" = \'ISSUE\' AND "balance_after"::bigint = "balance_before"::bigint - "quantity"::bigint)',
)
export class StockMovement {
  @PrimaryGeneratedColumn("uuid", { name: "id" }) id!: string;
  @Column({ name: "product_id", type: "uuid" }) productId!: string;
  @ManyToOne(() => Product, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "product_id",
    foreignKeyConstraintName: "fk_stock_movements_product",
  })
  product!: Product;
  @Column({ name: "type", type: "varchar", length: 7 }) type!: MovementType;
  @Column({ name: "quantity", type: "integer" }) quantity!: number;
  @Column({ name: "balance_before", type: "integer" }) balanceBefore!: number;
  @Column({ name: "balance_after", type: "integer" }) balanceAfter!: number;
  @Column({ name: "actor_id", type: "uuid" }) actorId!: string;
  @ManyToOne(() => User, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "actor_id",
    foreignKeyConstraintName: "fk_stock_movements_actor",
  })
  actor!: User;
  @Column({ name: "reason", type: "varchar", length: 500 }) reason!: string;
  @Column({ name: "created_at", type: "timestamptz" }) createdAt!: Date;
}
