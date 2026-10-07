import type {
  HistoryItem,
  MovementPayload,
  MovementResult,
  Page,
  StockItem,
} from "../types/inventory-types";

export type InventoryPageParams = { page: number; limit: number };
export type InventoryFilters = {
  q?: string;
  status?: StockItem["product"]["status"];
  createdFrom?: string;
  createdTo?: string;
};
export type InventoryListParams = InventoryPageParams & InventoryFilters;

// GET /inventory: { items: StockItem[], page, limit, total }.
export type StockListResponse = Page<StockItem>;

// GET /inventory/:productId: { inventory: StockItem }.
export type StockResponse = { inventory: StockItem };

// GET /inventory/:productId/movements: { items: HistoryItem[], page, limit, total }.
export type MovementHistoryResponse = Page<HistoryItem>;

// POST /inventory/:productId/movements: body { type, quantity, reason }.
export type CreateMovementRequest = MovementPayload;
// 201: { movement: Movement, inventory: { productId, onHandQty } }.
export type CreateMovementResponse = MovementResult;

// Required dispatch metadata for same-operation retry and authorization checks.
export type MovementRequestOptions = {
  key: string;
  actorId: string;
  retryUntil: number;
  signal: AbortSignal;
  onDispatch: () => void;
};
