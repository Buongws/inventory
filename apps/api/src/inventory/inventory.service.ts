import { HttpException, Injectable, Logger } from "@nestjs/common";
import { createHash, randomUUID } from "node:crypto";
import { PoolClient } from "pg";
import { DataSource, EntityManager } from "typeorm";
import {
  CreateMovementDto,
  InventoryErrorDto,
  InventoryPageDto,
  HistoryItemDto,
  MovementEnvelopeDto,
  StockItemDto,
} from "./inventory.dto";
import { inventoryError } from "./inventory-http-exception.filter";
import { MovementType } from "./stock-movement.entity";

const OPERATION = "inventory.movement.v1";
type MovementResult = {
  status: number;
  body: MovementEnvelopeDto | InventoryErrorDto;
  retryAfter?: string;
};
type Outcome =
  | "completed"
  | "replayed"
  | "in_progress"
  | "conflict"
  | "transient_failure"
  | "persistence_failure"
  | "outcome_uncertain";
type StoredResult = {
  id: string;
  request_hash: string;
  http_status: number;
  response_body: MovementResult["body"];
  unexpired: boolean;
};

function databaseCode(error: unknown): string | undefined {
  const e = error as { driverError?: { code?: string }; code?: string } | null;
  return e?.driverError?.code ?? e?.code;
}

const STOCK_SELECT = `SELECT p.id AS "productId", COALESCE(b.on_hand_qty,0) AS "onHandQty",
  jsonb_build_object('id',p.id,'sku',p.sku,'name',p.name,'status',p.status) AS product
  FROM products p LEFT JOIN inventory_balances b ON b.product_id = p.id`;

@Injectable()
export class InventoryService {
  private readonly logger = new Logger(InventoryService.name);
  constructor(private readonly dataSource: DataSource) {}

  async findStock(productId: string) {
    const rows: StockItemDto[] = await this.dataSource.query(
      `${STOCK_SELECT} WHERE p.id = $1`,
      [productId],
    );
    if (!rows.length)
      throw new HttpException(
        inventoryError(404, "PRODUCT_NOT_FOUND", "Product not found"),
        404,
      );
    return { inventory: rows[0] };
  }

  async listStock(query: InventoryPageDto) {
    return this.dataSource.transaction("REPEATABLE READ", async (manager) => {
      await manager.query("SET TRANSACTION READ ONLY");
      const items: StockItemDto[] = await manager.query(
        `${STOCK_SELECT} ORDER BY p.id ASC LIMIT $1 OFFSET $2`,
        [query.limit, (query.page - 1) * query.limit],
      );
      const counts: { total: string }[] = await manager.query(
        "SELECT count(*) AS total FROM products",
      );
      return {
        items,
        page: query.page,
        limit: query.limit,
        total: Number(counts[0].total),
      };
    });
  }

  async history(productId: string, query: InventoryPageDto) {
    return this.dataSource.transaction("REPEATABLE READ", async (manager) => {
      await manager.query("SET TRANSACTION READ ONLY");
      const products: { id: string }[] = await manager.query(
        "SELECT id FROM products WHERE id=$1",
        [productId],
      );
      if (!products.length)
        throw new HttpException(
          inventoryError(404, "PRODUCT_NOT_FOUND", "Product not found"),
          404,
        );
      const rows: (Omit<HistoryItemDto, "createdAt"> & { createdAt: Date })[] =
        await manager.query(
          `SELECT m.id,m.product_id AS "productId",m.type,m.quantity,m.balance_before AS "balanceBefore",m.balance_after AS "balanceAfter",m.actor_id AS "actorId",m.reason,m.created_at AS "createdAt",
        jsonb_build_object('sku',p.sku,'name',p.name,'status',p.status) AS product
        FROM stock_movements m JOIN products p ON p.id=m.product_id
        WHERE m.product_id=$1 ORDER BY m.created_at DESC,m.id DESC LIMIT $2 OFFSET $3`,
          [productId, query.limit, (query.page - 1) * query.limit],
        );
      const counts: { total: string }[] = await manager.query(
        "SELECT count(*) AS total FROM stock_movements WHERE product_id=$1",
        [productId],
      );
      return {
        items: rows.map((row) => ({
          ...row,
          createdAt: row.createdAt.toISOString(),
        })),
        page: query.page,
        limit: query.limit,
        total: Number(counts[0].total),
      };
    });
  }

  async createMovement(
    actorId: string,
    productId: string,
    key: string,
    dto: CreateMovementDto,
  ): Promise<MovementResult> {
    const requestHash = createHash("sha256")
      .update(
        JSON.stringify([
          OPERATION,
          productId,
          dto.type,
          dto.quantity,
          dto.reason,
        ]),
      )
      .digest("hex");
    const lockId = createHash("sha256")
      .update(
        JSON.stringify([
          "inventory-idempotency-lock-v1",
          actorId,
          OPERATION,
          key,
        ]),
      )
      .digest()
      .readBigInt64BE(0)
      .toString();
    const runner = this.dataSource.createQueryRunner();
    let connection: PoolClient | undefined;
    let commitAttempted = false;
    let outcome: Outcome = "persistence_failure";
    let result: MovementResult = {
      status: 500,
      body: inventoryError(
        500,
        "INVENTORY_PERSISTENCE_FAILED",
        "Inventory persistence failed; retry with the same key",
      ),
    };
    let discard = false;
    try {
      connection = (await runner.connect()) as PoolClient;
      await runner.startTransaction("READ COMMITTED");
      const manager = runner.manager;
      await manager.query(
        "SET LOCAL idle_in_transaction_session_timeout = '5s'",
      );
      const locks: { acquired: boolean }[] = await manager.query(
        "SELECT pg_try_advisory_xact_lock($1::bigint) AS acquired",
        [lockId],
      );
      if (!locks[0].acquired) {
        result = {
          status: 409,
          body: inventoryError(
            409,
            "IDEMPOTENCY_IN_PROGRESS",
            "Request is still processing; retry with the same key",
          ),
          retryAfter: "1",
        };
        await runner.rollbackTransaction();
        outcome = "in_progress";
      } else {
        const stored: StoredResult[] = await manager.query(
          `SELECT id,request_hash,http_status,response_body,expires_at > clock_timestamp() AS unexpired
          FROM inventory_idempotency_results WHERE actor_id=$1 AND operation=$2 AND key=$3`,
          [actorId, OPERATION, key],
        );
        if (stored[0]?.unexpired) {
          if (stored[0].request_hash === requestHash) {
            result = {
              status: stored[0].http_status,
              body: stored[0].response_body,
            };
            outcome = "replayed";
          } else {
            result = {
              status: 409,
              body: inventoryError(
                409,
                "IDEMPOTENCY_KEY_REUSED",
                "Idempotency key was used with a different payload",
              ),
            };
            outcome = "conflict";
          }
          await runner.rollbackTransaction();
        } else {
          if (stored[0])
            await manager.query(
              "DELETE FROM inventory_idempotency_results WHERE id=$1",
              [stored[0].id],
            );
          result = await this.applyMovement(manager, actorId, productId, dto);
          await this.storeResult(
            manager,
            actorId,
            productId,
            key,
            requestHash,
            result,
          );
          commitAttempted = true;
          await runner.commitTransaction();
          outcome = "completed";
        }
      }
    } catch (error) {
      const code = databaseCode(error);
      // A server SQL rejection proves failed COMMIT. A transport loss does not;
      // even a subsequent ROLLBACK acknowledgment cannot undo an earlier COMMIT.
      const serverRejection =
        !!code &&
        /^[0-9A-Z]{5}$/.test(code) &&
        !code.startsWith("08") &&
        !code.startsWith("57P");
      let rollbackConfirmed = false;
      if (
        !(commitAttempted && !serverRejection) &&
        runner.isTransactionActive &&
        !runner.isReleased
      ) {
        try {
          await runner.rollbackTransaction();
          rollbackConfirmed = true;
        } catch {
          discard = true;
        }
      }
      const uncertain = commitAttempted && !serverRejection;
      discard ||= uncertain || !rollbackConfirmed;
      const transient =
        rollbackConfirmed && ["40P01", "55P03", "57014"].includes(code ?? "");
      outcome =
        uncertain || (!rollbackConfirmed && commitAttempted)
          ? "outcome_uncertain"
          : transient
            ? "transient_failure"
            : "persistence_failure";
      result = transient
        ? {
            status: 503,
            body: inventoryError(
              503,
              "INVENTORY_BUSY",
              "Inventory is busy; retry with the same key",
            ),
            retryAfter: "1",
          }
        : {
            status: 500,
            body: inventoryError(
              500,
              "INVENTORY_PERSISTENCE_FAILED",
              "Inventory persistence failed; retry with the same key",
            ),
          };
    } finally {
      // Ending an uncertain/broken pg client prevents returning it to the pool.
      // Use public pg API; do not depend on private TypeORM release callbacks.
      if (discard && connection) {
        try {
          await connection.end();
        } catch {
          /* Already closed by the driver. */
        }
      }
      if (!runner.isReleased) await runner.release();
      this.logger.log({
        event: "inventory.movement.outcome",
        outcome,
        statusCode: result.status,
        ...("code" in result.body
          ? { errorCategory: result.body.code }
          : { movementId: result.body.movement.id }),
      });
    }
    return result;
  }

  private async applyMovement(
    manager: EntityManager,
    actorId: string,
    productId: string,
    dto: CreateMovementDto,
  ): Promise<MovementResult> {
    const products: { id: string }[] = await manager.query(
      "SELECT id FROM products WHERE id=$1",
      [productId],
    );
    if (!products.length)
      return {
        status: 404,
        body: inventoryError(404, "PRODUCT_NOT_FOUND", "Product not found"),
      };
    await manager.query("SAVEPOINT inventory_balance");
    await manager.query(
      `INSERT INTO inventory_balances(product_id,on_hand_qty,updated_at) VALUES($1,0,clock_timestamp()) ON CONFLICT(product_id) DO NOTHING`,
      [productId],
    );
    const balances: { on_hand_qty: number }[] = await manager.query(
      "SELECT on_hand_qty FROM inventory_balances WHERE product_id=$1 FOR UPDATE",
      [productId],
    );
    const before = balances[0].on_hand_qty;
    const after =
      dto.type === MovementType.RECEIPT
        ? before + dto.quantity
        : before - dto.quantity;
    if (after < 0 || after > 2147483647) {
      await manager.query("ROLLBACK TO SAVEPOINT inventory_balance");
      return {
        status: 409,
        body: inventoryError(
          409,
          after < 0 ? "INSUFFICIENT_STOCK" : "STOCK_LIMIT_EXCEEDED",
          after < 0 ? "Insufficient stock" : "Stock limit exceeded",
        ),
      };
    }
    const id = randomUUID();
    // Keep timestamp precision inside SQL throughout the update and insertion.
    const movements: { created_at: Date }[] = await manager.query(
      `WITH updated AS (
      UPDATE inventory_balances SET on_hand_qty=$2, updated_at=GREATEST(clock_timestamp(),
        (SELECT created_at + interval '1 microsecond' FROM stock_movements WHERE product_id=$1 ORDER BY created_at DESC,id DESC LIMIT 1))
      WHERE product_id=$1 RETURNING updated_at
    ) INSERT INTO stock_movements(id,product_id,type,quantity,balance_before,balance_after,actor_id,reason,created_at)
      SELECT $3,$1,$4,$5,$6,$2,$7,$8,updated_at FROM updated RETURNING created_at`,
      [
        productId,
        after,
        id,
        dto.type,
        dto.quantity,
        before,
        actorId,
        dto.reason,
      ],
    );
    return {
      status: 201,
      body: {
        movement: {
          id,
          productId,
          type: dto.type,
          quantity: dto.quantity,
          balanceBefore: before,
          balanceAfter: after,
          actorId,
          reason: dto.reason,
          createdAt: movements[0].created_at.toISOString(),
        },
        inventory: { productId, onHandQty: after },
      },
    };
  }

  private async storeResult(
    manager: EntityManager,
    actorId: string,
    productId: string,
    key: string,
    requestHash: string,
    result: MovementResult,
  ) {
    const movementId =
      "movement" in result.body ? result.body.movement.id : null;
    await manager.query(
      `WITH completion AS (SELECT clock_timestamp() AS ts)
      INSERT INTO inventory_idempotency_results(actor_id,operation,key,request_product_id,request_hash,http_status,response_body,movement_id,completed_at,expires_at)
      SELECT $1,$2,$3,$4,$5,$6,$7::jsonb,$8,ts,ts + interval '24 hours' FROM completion`,
      [
        actorId,
        OPERATION,
        key,
        productId,
        requestHash,
        result.status,
        JSON.stringify(result.body),
        movementId,
      ],
    );
  }
}
