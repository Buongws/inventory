import type {
  HistoryItem,
  InventoryOperation,
  MovementPayload,
  MovementValidationErrors,
  Page,
  ReadResource,
  StockItem,
} from "./inventory-types";

export type InventoryTableProps = {
  stock: ReadResource<Page<StockItem>>;
  page: number;
  size: number;
  total: number;
  onPageChange: (page: number, size: number) => void;
  onSelect: (product: StockItem) => void;
  onRetry: () => void;
};

export type InventoryDetailsProps = {
  productId: string;
  stock: ReadResource<StockItem>;
  history: ReadResource<Page<HistoryItem>>;
  historyPage: number;
  historySize: number;
  historyTotal: number;
  onStockRetry: () => void;
  onHistoryRetry: () => void;
  onHistoryPageChange: (page: number, size: number) => void;
  operationLocked?: boolean;
  onSubmit?: (payload: MovementPayload) => void;
  resetDraftVersion?: number;
  validationErrors?: MovementValidationErrors;
  retryRemainingMs?: number;
  onRetry?: () => void;
  retryDisabled?: boolean;
  operationStatus?: InventoryOperation["status"];
  operationPayload?: MovementPayload;
  firstDispatchedAt?: number | null;
  retryUntil?: number;
};
