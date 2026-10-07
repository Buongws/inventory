import { Module } from "@nestjs/common";
import { InventoryController } from "./inventory.controller";
import { InventoryService } from "./inventory.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { AuthModule } from "../auth/auth.module";
import { InventoryBalance } from "./inventory-balance.entity";
import { StockMovement } from "./stock-movement.entity";
import { InventoryIdempotencyResult } from "./inventory-idempotency-result.entity";
import { InventoryHttpExceptionFilter } from "./inventory-http-exception.filter";
import { InventoryIdempotencyCleanupService } from "./inventory-idempotency-cleanup.service";
import { InventoryIdempotencyCleanupJob } from "./inventory-idempotency-cleanup.job";

@Module({
  imports: [
    AuthModule,
    TypeOrmModule.forFeature([
      InventoryBalance,
      StockMovement,
      InventoryIdempotencyResult,
    ]),
  ],
  controllers: [InventoryController],
  providers: [
    InventoryService,
    InventoryHttpExceptionFilter,
    InventoryIdempotencyCleanupService,
    InventoryIdempotencyCleanupJob,
  ],
})
export class InventoryModule {}
