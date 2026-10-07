import type { AxiosResponse } from "axios";
import { api } from "../../../lib/api";
import { MOVEMENT_TIMEOUT_MS } from "../constants/movement";
import type {
  CreateMovementRequest,
  CreateMovementResponse,
  InventoryPageParams,
  InventoryListParams,
  MovementHistoryResponse,
  MovementRequestOptions,
  StockListResponse,
  StockResponse,
} from "./api-types";

export const inventoryApi = {
  listStock: async (
    params: InventoryListParams,
    signal: AbortSignal,
  ): Promise<StockListResponse> => {
    const { data } = await api.get<StockListResponse>("/inventory", {
      params,
      signal,
    });
    return data;
  },

  getStock: async (
    productId: string,
    signal: AbortSignal,
  ): Promise<StockResponse> => {
    const { data } = await api.get<StockResponse>(`/inventory/${productId}`, {
      signal,
    });
    return data;
  },

  listMovements: async (
    productId: string,
    params: InventoryPageParams,
    signal: AbortSignal,
  ): Promise<MovementHistoryResponse> => {
    const { data } = await api.get<MovementHistoryResponse>(
      `/inventory/${productId}/movements`,
      { params, signal },
    );
    return data;
  },

  createMovement: (
    productId: string,
    payload: CreateMovementRequest,
    options: MovementRequestOptions,
  ): Promise<AxiosResponse<CreateMovementResponse>> =>
    api.post<CreateMovementResponse>(
      `/inventory/${productId}/movements`,
      payload,
      {
        headers: { "Idempotency-Key": options.key },
        signal: options.signal,
        timeout: MOVEMENT_TIMEOUT_MS,
        inventoryActorId: options.actorId,
        inventoryRetryUntil: options.retryUntil,
        inventoryOnDispatch: options.onDispatch,
      },
    ),
};
