import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";

export const INVENTORY_CLEANUP_BATCH_SIZE = 1000;
export const INVENTORY_CLEANUP_MAX_BATCHES = 20;

@Injectable()
export class InventoryIdempotencyCleanupService {
  private readonly logger = new Logger(InventoryIdempotencyCleanupService.name);
  constructor(private readonly dataSource: DataSource) {}

  async cleanup(signal: AbortSignal): Promise<void> {
    const startedAt = Date.now();
    let deletedCount = 0;
    let batchCount = 0;
    let failed = false;
    try {
      while (!signal.aborted && batchCount < INVENTORY_CLEANUP_MAX_BATCHES) {
        const deleted: { id: string }[] = await this.dataSource.transaction(
          async (manager) => {
            await manager.query(
              "SET LOCAL idle_in_transaction_session_timeout = '5s'",
            );
            // SELECT returns deleted IDs rather than TypeORM's DELETE raw tuple.
            return manager.query(
              `WITH expired AS (
            SELECT id FROM inventory_idempotency_results WHERE expires_at <= clock_timestamp()
            ORDER BY expires_at,id LIMIT $1 FOR UPDATE SKIP LOCKED
          ), removed AS (
            DELETE FROM inventory_idempotency_results WHERE id IN (SELECT id FROM expired) RETURNING id
          ) SELECT id FROM removed`,
              [INVENTORY_CLEANUP_BATCH_SIZE],
            );
          },
        );
        batchCount++;
        deletedCount += deleted.length;
        if (deleted.length < INVENTORY_CLEANUP_BATCH_SIZE) break;
      }
    } catch {
      failed = true;
      throw new Error("Inventory cleanup failed");
    } finally {
      this.logger.log({
        event: "inventory.idempotency.cleanup",
        deletedCount,
        batchCount,
        durationMs: Date.now() - startedAt,
        interrupted: signal.aborted,
        batchLimitReached:
          batchCount === INVENTORY_CLEANUP_MAX_BATCHES &&
          deletedCount ===
            INVENTORY_CLEANUP_BATCH_SIZE * INVENTORY_CLEANUP_MAX_BATCHES,
        ...(failed ? { errorCategory: "persistence_failure" } : {}),
      });
    }
  }
}
