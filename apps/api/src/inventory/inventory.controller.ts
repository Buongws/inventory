import {
  Controller,
  Body,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Req,
  Res,
  UseFilters,
  UseGuards,
} from "@nestjs/common";
import { InventoryService } from "./inventory.service";
import { AccessTokenGuard, CurrentUser, requireRole } from "../auth/auth.guard";
import { UserRole } from "../auth/entities/user.entity";
import { InventoryHttpExceptionFilter } from "./inventory-http-exception.filter";
import {
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiHeader,
  ApiOperation,
  ApiOkResponse,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import {
  CreateMovementDto,
  InventoryErrorDto,
  InventoryPageDto,
  HistoryListDto,
  NoInventoryQueryDto,
  StockEnvelopeDto,
  StockListDto,
  MovementEnvelopeDto,
} from "./inventory.dto";
import { HttpException } from "@nestjs/common";
import { Request, Response } from "express";
import { AccessClaims } from "../auth/types/auth.types";
import { inventoryError } from "./inventory-http-exception.filter";

@ApiTags("inventory")
@ApiBearerAuth()
@ApiResponse({
  status: 400,
  type: InventoryErrorDto,
  description: "INVALID_INPUT: invalid UUID/query or unknown fields",
})
@ApiResponse({
  status: 401,
  type: InventoryErrorDto,
  description: "UNAUTHORIZED",
})
@ApiResponse({
  status: 403,
  type: InventoryErrorDto,
  description: "FORBIDDEN: admin required",
})
@ApiResponse({
  status: 404,
  type: InventoryErrorDto,
  description: "PRODUCT_NOT_FOUND",
})
@ApiResponse({
  status: 500,
  type: InventoryErrorDto,
  description: "INVENTORY_PERSISTENCE_FAILED",
})
@ApiResponse({
  status: 503,
  type: InventoryErrorDto,
  description: "INVENTORY_BUSY; Retry-After: 1",
})
@ApiResponse({
  status: 429,
  schema: {
    type: "object",
    required: ["statusCode", "code", "message", "retryAfterSeconds"],
    properties: {
      statusCode: { type: "integer", example: 429 },
      code: { type: "string", enum: ["RATE_LIMIT_EXCEEDED"] },
      message: { type: "string" },
      retryAfterSeconds: { type: "integer", minimum: 1 },
    },
  },
  headers: {
    "Retry-After": {
      description: "Existing Gateway retry delay in seconds",
      schema: { type: "string" },
    },
  },
  description:
    "Existing Gateway RATE_LIMIT_EXCEEDED; Retry-After; not retained",
})
@ApiResponse({
  status: 502,
  schema: {
    type: "object",
    required: ["statusCode", "code"],
    properties: {
      statusCode: { type: "integer", example: 502 },
      code: { type: "string", enum: ["UPSTREAM_UNAVAILABLE"] },
    },
  },
  description:
    "Existing Gateway UPSTREAM_UNAVAILABLE; outcome may be uncertain; same-key retry",
})
@UseGuards(AccessTokenGuard, requireRole(UserRole.ADMIN))
@UseFilters(InventoryHttpExceptionFilter)
@Controller("inventory")
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get()
  @ApiOkResponse({
    type: StockListDto,
    description:
      "All active/inactive products, including logical zero; product ID ascending",
  })
  list(@Query() query: InventoryPageDto, @Req() request: Request) {
    this.validateReadBody(request);
    return this.inventory.listStock(query);
  }

  @Get(":productId")
  @ApiOkResponse({
    type: StockEnvelopeDto,
    description:
      "Current stock; an untouched product has zero without creating a row",
  })
  findStock(
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Query() _query: NoInventoryQueryDto,
    @Req() request: Request,
  ) {
    this.validateReadBody(request);
    return this.inventory.findStock(productId.toLowerCase());
  }

  @Get(":productId/movements")
  @ApiOkResponse({
    type: HistoryListDto,
    description:
      "Append-only facts joined with current catalog; createdAt DESC, id DESC; UTC millisecond JSON timestamps, database microsecond sorting; empty history for untouched products",
  })
  history(
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Query() query: InventoryPageDto,
    @Req() request: Request,
  ) {
    this.validateReadBody(request);
    return this.inventory.history(productId.toLowerCase(), query);
  }

  @Post(":productId/movements")
  @ApiOperation({
    summary: "Receive or issue stock (admin)",
    description:
      "Required key scoped to actor + inventory.movement.v1, case-sensitive. Original 201/404/stock-409 response replays for 24 hours without extending expiry. Same-key retry after in-progress/uncertain response; no automatic service retry. Replays still require current authorization.",
  })
  @ApiHeader({
    name: "Idempotency-Key",
    required: true,
    schema: { type: "string", pattern: "^[A-Za-z0-9._:-]{1,128}$" },
    description:
      "Exactly one raw header. Reuse unchanged key/payload for retry within 24h; expired key is a new command.",
  })
  @ApiCreatedResponse({ type: MovementEnvelopeDto })
  @ApiResponse({
    status: 400,
    type: InventoryErrorDto,
    description: "INVALID_INPUT or INVALID_IDEMPOTENCY_KEY; not retained",
  })
  @ApiResponse({
    status: 409,
    type: InventoryErrorDto,
    description:
      "INSUFFICIENT_STOCK/STOCK_LIMIT_EXCEEDED (retained); IDEMPOTENCY_KEY_REUSED; IDEMPOTENCY_IN_PROGRESS + Retry-After: 1 (not retained)",
  })
  async createMovement(
    @Param("productId", new ParseUUIDPipe()) productId: string,
    @Body() dto: CreateMovementDto,
    @Query() _query: NoInventoryQueryDto,
    @CurrentUser() claims: AccessClaims,
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    const values: string[] = [];
    for (let i = 0; i < request.rawHeaders.length; i += 2)
      if (request.rawHeaders[i].toLowerCase() === "idempotency-key")
        values.push(request.rawHeaders[i + 1]);
    if (values.length !== 1 || !/^[A-Za-z0-9._:-]{1,128}$/.test(values[0]))
      throw new HttpException(
        inventoryError(
          400,
          "INVALID_IDEMPOTENCY_KEY",
          "Exactly one valid Idempotency-Key is required",
        ),
        400,
      );
    const result = await this.inventory.createMovement(
      claims.sub.toLowerCase(),
      productId.toLowerCase(),
      values[0],
      dto,
    );
    response.status(result.status);
    if (result.retryAfter) response.setHeader("Retry-After", result.retryAfter);
    return result.body;
  }

  private validateReadBody(request: Request): void {
    if (
      request.body !== undefined &&
      (request.body === null ||
        typeof request.body !== "object" ||
        Array.isArray(request.body) ||
        Object.keys(request.body).length > 0)
    ) {
      throw new HttpException(
        inventoryError(
          400,
          "INVALID_INPUT",
          "Inventory reads do not accept a body",
        ),
        400,
      );
    }
  }
}
