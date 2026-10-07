import type { PRODUCT_STATUS, READ_STATUS } from "../constants/inventory";
import type {
  MOVEMENT_TYPE,
  OPERATION_STATUS,
  MOVEMENT_ERROR_CODE,
  TERMINAL_OUTCOME,
  OPERATION_BLOCK_REASON,
} from "../constants/movement";

export type ProductSummary = {
  id: string;
  sku: string;
  name: string;
  status: (typeof PRODUCT_STATUS)[keyof typeof PRODUCT_STATUS];
};

export type StockItem = {
  productId: string;
  onHandQty: number;
  product: ProductSummary;
};

export type MovementPayload = Readonly<{
  type: (typeof MOVEMENT_TYPE)[keyof typeof MOVEMENT_TYPE];
  quantity: number;
  reason: string;
}>;

export type Movement = MovementPayload & {
  id: string;
  productId: string;
  balanceBefore: number;
  balanceAfter: number;
  actorId: string;
  createdAt: string;
};

export type HistoryItem = Movement & { product: Omit<ProductSummary, "id"> };
export type Page<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
};
export type MovementResult = {
  movement: Movement;
  inventory: { productId: string; onHandQty: number };
};
export type ReadResource<T> =
  | { status: typeof READ_STATUS.LOADING; queryId: string }
  | { status: typeof READ_STATUS.READY; queryId: string; data: T }
  | { status: typeof READ_STATUS.ERROR; queryId: string; message: string };

export type InventoryAttempt = {
  id: number;
  sending: boolean;
  dispatched: boolean;
  serverUnauthorized: boolean;
};

export type TerminalOutcome =
  | { kind: typeof TERMINAL_OUTCOME.SUCCESS; result: MovementResult }
  | {
      kind: typeof TERMINAL_OUTCOME.STOCK_REJECTION;
      code:
        | typeof MOVEMENT_ERROR_CODE.INSUFFICIENT_STOCK
        | typeof MOVEMENT_ERROR_CODE.STOCK_LIMIT_EXCEEDED;
    }
  | { kind: typeof TERMINAL_OUTCOME.PRODUCT_MISSING }
  | { kind: typeof TERMINAL_OUTCOME.VALIDATION_REJECTION }
  | { kind: typeof TERMINAL_OUTCOME.ACCESS_REJECTION };

export type InventoryOperation = {
  readonly actorId: string;
  readonly productId: string;
  readonly key: string;
  readonly payload: MovementPayload;
  readonly controller: AbortController;
  firstDispatchedAt: number | null;
  retryUntil: number;
  status: (typeof OPERATION_STATUS)[keyof typeof OPERATION_STATUS];
  priorUncertain: boolean;
  retryableFailureCount: number;
  nextRetryAt: number;
  message: string;
  discarded: boolean;
  attempt: InventoryAttempt | null;
  terminal: TerminalOutcome | null;
  applied?: boolean;
  blockReason?: (typeof OPERATION_BLOCK_REASON)[keyof typeof OPERATION_BLOCK_REASON];
};

export type MovementValidationErrors = Partial<
  Record<keyof MovementPayload, string>
>;

export type MovementDraft = {
  resetVersion: number;
  errors: MovementValidationErrors;
};
