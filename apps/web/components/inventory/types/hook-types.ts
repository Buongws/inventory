import type { RefObject } from "react";
import type { AbortScope } from "../../../lib/abort-scope";
import type {
  InventoryOperation,
  StockItem,
  TerminalOutcome,
} from "./inventory-types";

export type InventoryDataOptions = {
  enabled: boolean;
  actorId?: string;
  product: StockItem | null;
};

export type InventoryResourceOptions<T> = {
  enabled: boolean;
  queryId: string;
  scope: AbortScope;
  load: (signal: AbortSignal) => Promise<T>;
  errorMessage: string;
};

export type InventoryDepartureOptions = {
  operationRef: RefObject<InventoryOperation | null>;
  operation: InventoryOperation | null;
  discard: () => void;
  clearPage: () => void;
};

export type InventoryOperationOptions = {
  productId?: string;
  isStockReady: () => boolean;
  selectionRef: RefObject<string | null>;
  refreshAfterMovement: (outcome: TerminalOutcome) => void;
};
