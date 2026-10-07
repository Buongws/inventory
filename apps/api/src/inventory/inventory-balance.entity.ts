import {
  Check,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from "typeorm";
import { Product } from "../products/product.entity";

@Entity("inventory_balances")
@Check(
  "ck_inventory_balances_quantity",
  '"on_hand_qty" BETWEEN 0 AND 2147483647',
)
export class InventoryBalance {
  @PrimaryColumn({ name: "product_id", type: "uuid" }) productId!: string;
  @OneToOne(() => Product, { onDelete: "RESTRICT" })
  @JoinColumn({
    name: "product_id",
    foreignKeyConstraintName: "fk_inventory_balances_product",
  })
  product!: Product;
  @Column({ name: "on_hand_qty", type: "integer", default: 0 })
  onHandQty!: number;
  @Column({ name: "updated_at", type: "timestamptz" }) updatedAt!: Date;
}
