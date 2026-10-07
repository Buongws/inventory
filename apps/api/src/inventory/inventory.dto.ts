import { Transform } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsString,
  Max,
  Min,
  ValidateBy,
  ValidateIf,
} from "class-validator";
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

const isCalendarDate = (value: unknown): value is string => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value))
    return false;
  const [year, month, day] = value.split("-").map(Number);
  if (year < 1) return false;
  const date = new Date(0);
  date.setUTCFullYear(year, month - 1, day);
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

const calendarDateValidation = {
  name: "inventoryCalendarDate",
  validator: {
    validate: isCalendarDate,
    defaultMessage: () =>
      "date must be a real YYYY-MM-DD calendar date (0001–9999)",
  },
};

export class InventoryListQueryDto extends InventoryPageDto {
  @ApiPropertyOptional({
    type: "integer",
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  limit = 10;

  @ApiPropertyOptional({
    maxLength: 200,
    description:
      "Trimmed literal name or SKU substring; case-insensitive, max200 Unicode code points",
  })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === "string" ? value.trim() : value,
  )
  @ValidateIf((_object, value) => value !== undefined)
  @IsString()
  @ValidateBy({
    name: "inventorySearchLength",
    validator: {
      validate: (value: unknown) =>
        typeof value === "string" && Array.from(value).length <= 200,
      defaultMessage: () =>
        "q must contain at most200 Unicode code points after trimming",
    },
  })
  q?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({
    type: String,
    format: "date",
    example: "2026-10-07",
    description: "Inclusive Product.createdAt day start at UTC+7; YYYY-MM-DD",
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateBy(calendarDateValidation)
  createdFrom?: string;

  @ApiPropertyOptional({
    type: String,
    format: "date",
    example: "2026-10-07",
    description: "Exclusive start of day after To at UTC+7; YYYY-MM-DD",
  })
  @ValidateIf((_object, value) => value !== undefined)
  @ValidateBy(calendarDateValidation)
  @ValidateBy({
    name: "inventoryDateRange",
    validator: {
      validate: (value: unknown, args) => {
        const from = (args?.object as InventoryListQueryDto).createdFrom;
        return !isCalendarDate(from) || !isCalendarDate(value) || from <= value;
      },
      defaultMessage: () => "createdFrom must not be after createdTo",
    },
  })
  createdTo?: string;
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
