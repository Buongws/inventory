import {
  MOVEMENT_RETRY_WINDOW_MS,
  OPERATION_STATUS,
} from "../constants/movement";
import { inventoryApi } from "../api/inventory-api";
import type {
  InventoryAttempt,
  InventoryOperation,
  MovementPayload,
} from "../types/inventory-types";

export const createMovement = (
  actorId: string,
  productId: string,
  payload: MovementPayload,
  controller: AbortController,
): InventoryOperation => {
  const reason = payload.reason.trim();
  return {
    actorId,
    productId,
    key: crypto.randomUUID(),
    payload: Object.freeze({ ...payload, reason }),
    controller,
    firstDispatchedAt: null,
    retryUntil: Date.now() + MOVEMENT_RETRY_WINDOW_MS,
    status: OPERATION_STATUS.SENDING,
    priorUncertain: false,
    retryableFailureCount: 0,
    nextRetryAt: 0,
    message: "Đang gửi giao dịch…",
    discarded: false,
    attempt: null,
    terminal: null,
  };
};

export const dispatchMovement = async (
  current: InventoryOperation,
  attempt: InventoryAttempt,
  onDispatch: () => void,
) => {
  const { data, status } = await inventoryApi.createMovement(
    current.productId,
    current.payload,
    {
      key: current.key,
      signal: current.controller.signal,
      actorId: current.actorId,
      retryUntil: current.retryUntil,
      onDispatch: () => {
        attempt.dispatched = true;
        onDispatch();
        if (current.firstDispatchedAt === null) {
          current.firstDispatchedAt = Date.now();
          current.retryUntil =
            current.firstDispatchedAt + MOVEMENT_RETRY_WINDOW_MS;
        }
      },
    },
  );
  if (
    status !== 201 ||
    data?.movement?.productId !== current.productId ||
    data.movement.actorId !== current.actorId ||
    data.movement.type !== current.payload.type ||
    data.movement.quantity !== current.payload.quantity ||
    data.movement.reason !== current.payload.reason ||
    !data.movement.id ||
    data.inventory?.productId !== current.productId ||
    !Number.isInteger(data.inventory.onHandQty) ||
    data.inventory.onHandQty !== data.movement.balanceAfter
  ) {
    throw new Error("Unrecognized movement result");
  }
  return data;
};
