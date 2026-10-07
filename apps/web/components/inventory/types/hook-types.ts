import type { RefObject } from "react";
import type { AbortScope } from "../../../lib/abort-scope";
import type { InventoryOperation, TerminalOutcome } from "./inventory-types";

export type InventoryDataOptions = {
  enabled: boolean;
  actorId?: string;
  productId?: string;
};

export type InventoryResourceOptions<T> = {
  enabled: boolean;
  queryId: string;
  scope: AbortScope;
  load: (signal: AbortSignal) => Promise<T>;
  errorMessage: string;
};

export type InventoryDepartureOptions = {
  pageId?: string;
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
