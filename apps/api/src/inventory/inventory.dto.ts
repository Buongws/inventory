import { Transform } from "class-transformer";
import { IsEnum, IsInt, IsString, Max, Min, ValidateBy } from "class-validator";
import { ApiProperty, ApiPropertyOptional, OmitType } from "@nestjs/swagger";
import { ProductStatus } from "../products/product.entity";
import { MovementType } from "./stock-movement.entity";

export class NoInventoryQueryDto {}

const queryInteger = ({ value }: { value: unknown }) =>
  typeof value === "string" && /^\d+$/.test(value) ? Number(value) : value;

export class InventoryPageDto {
  @ApiPropertyOptional({ type: "integer", default: 1, minimum: 1 })
  @Transform(queryInteger)
  @IsInt()
  @Min(1)
  @ValidateBy({
    name: "safeInventoryOffset",
    validator: {
      validate(value: unknown, args) {
        const limit = (args?.object as InventoryPageDto).limit;
        return (
          typeof value === "number" &&
          Number.isSafeInteger(value) &&
          Number.isSafeInteger((value - 1) * limit)
        );
      },
      defaultMessage: () => "page and offset must be safe positive integers",
    },
  })
  page = 1;

  @ApiPropertyOptional({
    type: "integer",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Transform(queryInteger)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;
}

export class CreateMovementDto {
  @ApiProperty({ enum: MovementType })
  @IsEnum(MovementType)
  type!: MovementType;
  @ApiProperty({ minimum: 1, maximum: 1000000, type: "integer" })
  @IsInt()
  @Min(1)
  @Max(1000000)
  quantity!: number;
  @ApiProperty({
    minLength: 1,
    maxLength: 500,
    description: "Trimmed reason, measured in Unicode code points",
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @IsString()
  @ValidateBy({
    name: "inventoryReasonLength",
    validator: {
      validate: (value: unknown) =>
        typeof value === "string" &&
        Array.from(value).length >= 1 &&
        Array.from(value).length <= 500,
      defaultMessage: () =>
        "reason must contain 1–500 Unicode code points after trimming",
    },
  })
  reason!: string;
}

export class InventoryProductDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty() sku!: string;
  @ApiProperty() name!: string;
  @ApiProperty({ enum: ProductStatus }) status!: ProductStatus;
}
export class StockItemDto {
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty({ type: "integer", minimum: 0, maximum: 2147483647 })
  onHandQty!: number;
  @ApiProperty({ type: InventoryProductDto }) product!: InventoryProductDto;
}
export class StockEnvelopeDto {
  @ApiProperty({ type: StockItemDto }) inventory!: StockItemDto;
}
export class StockListDto {
  @ApiProperty({ type: StockItemDto, isArray: true }) items!: StockItemDto[];
  @ApiProperty({ type: "integer" }) page!: number;
  @ApiProperty({ type: "integer" }) limit!: number;
  @ApiProperty({ type: "integer" }) total!: number;
}
export class MovementDto {
  @ApiProperty({ format: "uuid" }) id!: string;
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty({ enum: MovementType }) type!: MovementType;
  @ApiProperty({ type: "integer" }) quantity!: number;
  @ApiProperty({ type: "integer" }) balanceBefore!: number;
  @ApiProperty({ type: "integer" }) balanceAfter!: number;
  @ApiProperty({ format: "uuid" }) actorId!: string;
  @ApiProperty() reason!: string;
  @ApiProperty({ format: "date-time" }) createdAt!: string;
}
export class MovementStockDto {
  @ApiProperty({ format: "uuid" }) productId!: string;
  @ApiProperty({ type: "integer" }) onHandQty!: number;
}
export class MovementEnvelopeDto {
  @ApiProperty({ type: MovementDto }) movement!: MovementDto;
  @ApiProperty({ type: MovementStockDto }) inventory!: MovementStockDto;
}
export class HistoryProductDto extends OmitType(InventoryProductDto, [
  "id",
] as const) {}
export class HistoryItemDto extends MovementDto {
  @ApiProperty({ type: HistoryProductDto }) product!: HistoryProductDto;
}
export class HistoryListDto {
  @ApiProperty({ type: HistoryItemDto, isArray: true })
  items!: HistoryItemDto[];
  @ApiProperty({ type: "integer" }) page!: number;
  @ApiProperty({ type: "integer" }) limit!: number;
  @ApiProperty({ type: "integer" }) total!: number;
}
export class InventoryErrorDto {
  @ApiProperty({ type: "integer" }) statusCode!: number;
  @ApiProperty() code!: string;
  @ApiProperty() message!: string;
}
