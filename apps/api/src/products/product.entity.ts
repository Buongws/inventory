import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";

export enum ProductStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
}

@Entity("products")
@Index("idx_products_status_created_id", ["status", "createdAt", "id"])
export class Product {
  @ApiProperty({ format: "uuid" })
  @PrimaryGeneratedColumn("uuid")
  id!: string;

  @ApiProperty({ example: "USB-C-CABLE-1M" })
  @Column({ type: "varchar", length: 64, unique: true })
  sku!: string;

  @ApiProperty({ example: "USB-C cable 1m" })
  @Column({ type: "varchar", length: 200 })
  name!: string;

  @ApiPropertyOptional({ nullable: true, example: "Braided cable" })
  @Column({ type: "varchar", length: 5000, nullable: true })
  description!: string | null;

  @ApiProperty({ type: String, example: "129000" })
  @Column({ name: "price_vnd", type: "bigint" })
  priceVnd!: string;

  @ApiProperty({ enum: ProductStatus })
  @Column({ type: "varchar", length: 16, default: ProductStatus.ACTIVE })
  status!: ProductStatus;

  @ApiPropertyOptional({
    nullable: true,
    example: "https://images.example.com/cable.jpg",
  })
  @Column({ name: "image_url", type: "varchar", length: 2048, nullable: true })
  imageUrl!: string | null;

  @ApiProperty({ format: "date-time" })
  @CreateDateColumn({ name: "created_at", type: "timestamptz" })
  createdAt!: Date;

  @ApiProperty({ format: "date-time" })
  @UpdateDateColumn({ name: "updated_at", type: "timestamptz" })
  updatedAt!: Date;
}
