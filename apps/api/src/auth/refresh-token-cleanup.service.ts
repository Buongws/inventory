import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Client } from "pg";

// Stable, shared across API instances; reserved for refresh-token cleanup.
const CLEANUP_LOCK_ID = 81724001;

@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(private readonly config: ConfigService) {}

  async cleanup(signal: AbortSignal): Promise<void> {
    const startedAt = Date.now();
    const batchSize = this.config.getOrThrow<number>(
      "REFRESH_TOKEN_CLEANUP_BATCH_SIZE",
    );
    const maxBatches = this.config.getOrThrow<number>(
      "REFRESH_TOKEN_CLEANUP_MAX_BATCHES",
    );
    const retentionDays = this.config.getOrThrow<number>(
      "REFRESH_TOKEN_CLEANUP_RETENTION_DAYS",
    );
    // Dedicated session: closing it releases the advisory lock even if unlock fails.
    const client = new Client({
      connectionString: this.config.getOrThrow<string>("DATABASE_URL"),
      connectionTimeoutMillis: 3000,
      statement_timeout: 5000,
      application_name: "refresh-token-cleanup",
    });
    client.on("error", () =>
      this.logger.error("Cleanup database connection failed"),
    );
    let locked = false;

    try {
      await client.connect();
      const lock = await client.query<{ acquired: boolean }>(
        "SELECT pg_try_advisory_lock($1) AS acquired",
        [CLEANUP_LOCK_ID],
      );
      locked = lock.rows[0].acquired;
      if (!locked) {
        this.logger.debug("Cleanup skipped: another instance holds the lock");
        return;
      }

      const cutoffResult = await client.query<{ cutoff: Date }>(
        "SELECT clock_timestamp() - ($1::int * interval '1 day') AS cutoff",
        [retentionDays],
      );
      const cutoff = cutoffResult.rows[0].cutoff;
      let deletedCount = 0;
      let batchCount = 0;

      while (!signal.aborted && batchCount < maxBatches) {
        const result = await client.query(
          `WITH expired_tokens AS (
             SELECT id FROM refresh_tokens
             WHERE expires_at <= $1
             ORDER BY expires_at ASC
             LIMIT $2
             FOR UPDATE SKIP LOCKED
           )
           DELETE FROM refresh_tokens
           WHERE id IN (SELECT id FROM expired_tokens)`,
          [cutoff, batchSize],
        );
        const deleted = result.rowCount ?? 0;
        deletedCount += deleted;
        batchCount += 1;
        if (deleted < batchSize) break;
      }

      this.logger.log({
        job: "refresh-token-cleanup",
        deletedCount,
        batchCount,
        durationMs: Date.now() - startedAt,
        cutoff: cutoff.toISOString(),
        interrupted: signal.aborted,
        batchLimitReached:
          batchCount === maxBatches && deletedCount === batchSize * maxBatches,
      });
    } finally {
      try {
        if (locked)
          await client.query("SELECT pg_advisory_unlock($1)", [
            CLEANUP_LOCK_ID,
          ]);
      } finally {
        await client.end();
      }
    }
  }
}
