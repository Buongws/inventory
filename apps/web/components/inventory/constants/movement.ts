export const MOVEMENT_TYPE = {
  RECEIPT: "RECEIPT",
  ISSUE: "ISSUE",
} as const;

export const OPERATION_STATUS = {
  SENDING: "sending",
  RETRYABLE: "retryable",
  IN_PROGRESS: "in_progress",
  UNCERTAIN: "uncertain",
  BLOCKED: "blocked",
  TERMINAL: "terminal",
} as const;

export const MOVEMENT_ERROR_CODE = {
  INSUFFICIENT_STOCK: "INSUFFICIENT_STOCK",
  STOCK_LIMIT_EXCEEDED: "STOCK_LIMIT_EXCEEDED",
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",
  INVALID_INPUT: "INVALID_INPUT",
  IDEMPOTENCY_IN_PROGRESS: "IDEMPOTENCY_IN_PROGRESS",
  IDEMPOTENCY_KEY_REUSED: "IDEMPOTENCY_KEY_REUSED",
  INVENTORY_BUSY: "INVENTORY_BUSY",
} as const;

export const MOVEMENT_QUANTITY_MIN = 1;
export const MOVEMENT_QUANTITY_MAX = 1_000_000;
export const MOVEMENT_REASON_MIN_LENGTH = 1;
export const MOVEMENT_REASON_MAX_LENGTH = 500;
export const MILLISECONDS_PER_SECOND = 1_000;
export const MOVEMENT_RETRY_WINDOW_MS = 24 * 60 * 60 * MILLISECONDS_PER_SECOND;
export const MOVEMENT_TIMEOUT_MS = 15_000;
export const RETRY_DELAYS_MS = [1_000, 2_000, 4_000, 8_000, 16_000, 30_000];
export const RETRY_MAX_DELAY_MS = 30_000;
export const RETRY_JITTER_MAX_MS = 250;
export const MOVEMENT_FIELDS = ["type", "quantity", "reason"] as const;
export const MOVEMENT_TYPE_OPTIONS = [
  { value: MOVEMENT_TYPE.RECEIPT, label: "Nhập (RECEIPT)" },
  { value: MOVEMENT_TYPE.ISSUE, label: "Xuất (ISSUE)" },
];

export const TERMINAL_OUTCOME = {
  SUCCESS: "success",
  STOCK_REJECTION: "stock-rejection",
  PRODUCT_MISSING: "product-missing",
  VALIDATION_REJECTION: "validation-rejection",
  ACCESS_REJECTION: "access-rejection",
} as const;

export const OPERATION_BLOCK_REASON = {
  AUTHORIZATION: "authorization",
  ACTOR: "actor",
  DEADLINE: "deadline",
  KEY_REUSED: "key-reused",
} as const;
