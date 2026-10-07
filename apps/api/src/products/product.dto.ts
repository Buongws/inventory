import { Transform, Type } from "class-transformer";
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
  ValidateBy,
  ValidateIf,
  ValidationOptions,
} from "class-validator";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Product, ProductStatus } from "./product.entity";

const POSTGRES_BIGINT_MAX = BigInt("9223372036854775807");

function IsPostgresBigIntString(options?: ValidationOptions) {
  return ValidateBy(
    {
      name: "isPostgresBigIntString",
      validator: {
        validate(value: unknown) {
          return (
            typeof value === "string" &&
            /^\d+$/.test(value) &&
            BigInt(value) <= POSTGRES_BIGINT_MAX
          );
        },
        defaultMessage: () =>
          "priceVnd must be a non-negative integer string within the PostgreSQL bigint range",
      },
    },
    options,
  );
}

const normalizeSku = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim().toUpperCase() : value;
const trimString = ({ value }: { value: unknown }) =>
  typeof value === "string" ? value.trim() : value;

export class CreateProductDto {
  @ApiProperty({ example: "usb-c-cable-1m", maxLength: 64 })
  @Transform(normalizeSku)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[A-Z0-9_-]+$/)
  sku!: string;

  @ApiProperty({ example: "USB-C cable 1m", maxLength: 200 })
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 5000 })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiProperty({ type: String, example: "129000" })
  @IsPostgresBigIntString()
  priceVnd!: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  imageUrl?: string | null;
}

export class UpdateProductDto {
  @ApiPropertyOptional({ maxLength: 64 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(normalizeSku)
  @IsString()
  @MinLength(1)
  @MaxLength(64)
  @Matches(/^[A-Z0-9_-]+$/)
  sku?: string;

  @ApiPropertyOptional({ maxLength: 200 })
  @ValidateIf((_object, value) => value !== undefined)
  @Transform(trimString)
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  name?: string;

  @ApiPropertyOptional({ nullable: true, maxLength: 5000 })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(5000)
  description?: string | null;

  @ApiPropertyOptional({ type: String })
  @ValidateIf((_object, value) => value !== undefined)
  @IsPostgresBigIntString()
  priceVnd?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @ValidateIf((_object, value) => value !== undefined)
  @IsEnum(ProductStatus)
  status?: ProductStatus;

  @ApiPropertyOptional({ nullable: true, maxLength: 2048 })
  @ValidateIf((_object, value) => value !== undefined && value !== null)
  @IsString()
  @MaxLength(2048)
  @IsUrl({ protocols: ["http", "https"], require_protocol: true })
  imageUrl?: string | null;
}

export class ListProductsQueryDto {
  @ApiPropertyOptional({ default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page = 1;

  @ApiPropertyOptional({ default: 20, minimum: 1, maximum: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit = 20;

  @ApiPropertyOptional({ maxLength: 100 })
  @IsOptional()
  @Transform(trimString)
  @IsString()
  @MaxLength(100)
  search?: string;

  @ApiPropertyOptional({ enum: ProductStatus })
  @IsOptional()
  @IsEnum(ProductStatus)
  status?: ProductStatus;
}

export class ProductEnvelopeDto {
  @ApiProperty({ type: Product })
  product!: Product;
}

export class ProductListDto {
  @ApiProperty({ type: Product, isArray: true })
  items!: Product[];

  @ApiProperty() page!: number;
  @ApiProperty() limit!: number;
  @ApiProperty() total!: number;
}
