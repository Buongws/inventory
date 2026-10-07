"use client";

import { useEffect, useEffectEvent, useRef, useState } from "react";
import { USER_ROLE } from "../../auth/constants/auth";
import {
  TERMINAL_OUTCOME,
  OPERATION_BLOCK_REASON,
  MILLISECONDS_PER_SECOND,
  MOVEMENT_QUANTITY_MAX,
  MOVEMENT_QUANTITY_MIN,
  MOVEMENT_REASON_MAX_LENGTH,
  MOVEMENT_REASON_MIN_LENGTH,
  MOVEMENT_TYPE,
  OPERATION_STATUS,
} from "../constants/movement";
import type { InventoryOperationOptions } from "../types/hook-types";
import { createAbortScope } from "../../../lib/abort-scope";
import { createMovement, dispatchMovement } from "../services/movement-command";
import { store } from "../../../lib/store";
import { appToast, type ToastStatus } from "../../../lib/toast";
import type {
  InventoryOperation,
  MovementPayload,
  MovementDraft,
} from "../types/inventory-types";
import { useAuth } from "../../auth/hooks/use-auth";
import { applyMovementError } from "../services/movement-error";

export const useInventoryOperation = ({
  productId,
  isStockReady,
  selectionRef,
  refreshAfterMovement,
}: InventoryOperationOptions) => {
  const { user } = useAuth();
  const operationRef = useRef<InventoryOperation | null>(null);
  const attemptIdRef = useRef(0);
  const [scope] = useState(createAbortScope);
  const [operation, setOperation] = useState<InventoryOperation | null>(null);
  const [draft, setDraft] = useState<MovementDraft>({
    resetVersion: 0,
    errors: {},
  });
  const [retryClock, setRetryClock] = useState(() => Date.now());

  useEffect(() => {
    if (!operation || operation.status === OPERATION_STATUS.TERMINAL) return;
    const timer = window.setInterval(
      () => setRetryClock(Date.now()),
      MILLISECONDS_PER_SECOND,
    );
    return () => window.clearInterval(timer);
  }, [operation]);

  const submitMovement = async (payload: MovementPayload) => {
    const live = operationRef.current;
    if (live && !live.discarded && live.status !== OPERATION_STATUS.TERMINAL)
      return;
    const auth = store.getState().auth;
    if (
      !auth.initialized ||
      auth.user?.role !== USER_ROLE.ADMIN ||
      !productId ||
      !isStockReady() ||
      selectionRef.current !== productId
    )
      return;
    const reason = payload.reason.trim();
    if (
      (payload.type !== MOVEMENT_TYPE.RECEIPT &&
        payload.type !== MOVEMENT_TYPE.ISSUE) ||
      !Number.isInteger(payload.quantity) ||
      payload.quantity < MOVEMENT_QUANTITY_MIN ||
      payload.quantity > MOVEMENT_QUANTITY_MAX ||
      Array.from(reason).length < MOVEMENT_REASON_MIN_LENGTH ||
      Array.from(reason).length > MOVEMENT_REASON_MAX_LENGTH
    )
      return;
    scope.abortAll();
    const current = createMovement(
      auth.user.id,
      productId,
      payload,
      scope.create(),
    );
    // Synchronous reference latch precedes the async Axios interceptor chain.
    operationRef.current = current;
    setDraft((d) => ({ ...d, errors: {} }));
    await sendMovement(current);
  };

  const applyTerminal = (current: InventoryOperation) => {
    const auth = store.getState().auth;
    if (
      current.applied ||
      current.discarded ||
      !current.terminal ||
      auth.user?.role !== USER_ROLE.ADMIN ||
      auth.user.id !== current.actorId ||
      selectionRef.current !== current.productId
    )
      return;
    current.applied = true;
    refreshAfterMovement(current.terminal);
    const kind = current.terminal.kind;
    if (
      kind === TERMINAL_OUTCOME.SUCCESS ||
      kind === TERMINAL_OUTCOME.STOCK_REJECTION
    ) {
      setDraft((d) => ({ resetVersion: d.resetVersion + 1, errors: {} }));
    } else if (kind === TERMINAL_OUTCOME.VALIDATION_REJECTION) {
      setDraft((d) => ({
        ...d,
        errors: {
          type: "Kiểm tra loại giao dịch RECEIPT hoặc ISSUE.",
          quantity: "Kiểm tra số nguyên từ 1 đến 1.000.000.",
          reason:
            "Kiểm tra lý do từ 1 đến 500 ký tự Unicode sau khi bỏ khoảng trắng đầu/cuối.",
        },
      }));
    }
  };

  const sendMovement = async (current: InventoryOperation) => {
    if (
      operationRef.current !== current ||
      current.discarded ||
      current.attempt?.sending
    )
      return;
    const attempt = {
      id: ++attemptIdRef.current,
      sending: true,
      dispatched: false,
      serverUnauthorized: false,
    };
    current.attempt = attempt;
    current.status = OPERATION_STATUS.SENDING;
    setRetryClock(Date.now());
    setOperation({ ...current });
    let dispatchedToken: string | null = null;
    try {
      const data = await dispatchMovement(current, attempt, () => {
        dispatchedToken = store.getState().auth.accessToken;
      });
      if (
        operationRef.current !== current ||
        current.discarded ||
        current.attempt !== attempt
      )
        return;
      current.terminal = { kind: TERMINAL_OUTCOME.SUCCESS, result: data };
      current.status = OPERATION_STATUS.TERMINAL;
      current.message = "Giao dịch đã được ghi nhận.";
    } catch (error: unknown) {
      if (
        operationRef.current !== current ||
        current.discarded ||
        current.attempt !== attempt
      )
        return;
      applyMovementError(current, attempt, error, dispatchedToken);
    } finally {
      if (
        operationRef.current === current &&
        !current.discarded &&
        current.attempt === attempt
      ) {
        // Attempt completion is independent of the current UI authorization.
        attempt.sending = false;
        applyTerminal(current);
        setOperation({ ...current });
        if (
          current.message &&
          selectionRef.current === current.productId &&
          store.getState().auth.user?.id === current.actorId
        ) {
          const toastStatus: ToastStatus =
            current.terminal?.kind === TERMINAL_OUTCOME.SUCCESS
              ? "success"
              : current.status === OPERATION_STATUS.TERMINAL
                ? "error"
                : current.priorUncertain
                  ? "unknown"
                  : "warning";
          appToast[toastStatus](current.message, {
            toastId: `${current.key}:${attempt.id}`,
          });
        }
      }
    }
  };

  const retryMovement = () => {
    const current = operationRef.current;
    if (
      !current ||
      current.attempt?.sending ||
      current.discarded ||
      current.status === OPERATION_STATUS.TERMINAL ||
      current.blockReason === OPERATION_BLOCK_REASON.KEY_REUSED ||
      current.blockReason === OPERATION_BLOCK_REASON.DEADLINE ||
      Date.now() >= current.retryUntil ||
      Date.now() < current.nextRetryAt
    )
      return;
    const auth = store.getState().auth;
    if (
      !auth.initialized ||
      auth.user?.id !== current.actorId ||
      auth.user.role !== USER_ROLE.ADMIN
    )
      return;
    void sendMovement(current);
  };

  const settleTerminal = useEffectEvent(applyTerminal);

  useEffect(() => {
    if (operation?.status === OPERATION_STATUS.TERMINAL && !operation.applied) {
      settleTerminal(operationRef.current ?? operation);
    }
  }, [operation, user?.id, user?.role]);

  const discard = () => {
    const current = operationRef.current;
    scope.abortAll();
    if (current) current.discarded = true;
    operationRef.current = null;
    setOperation(null);
  };
  const clearDraft = () =>
    setDraft((d) => ({ resetVersion: d.resetVersion + 1, errors: {} }));
  const selectProduct = () => {
    setDraft((d) => ({ ...d, errors: {} }));
    if (operationRef.current?.status === OPERATION_STATUS.TERMINAL) discard();
  };
  return {
    operation,
    operationRef,
    discard,
    clearDraft,
    selectProduct,
    submitMovement,
    retryMovement,
    resetDraftVersion: draft.resetVersion,
    validationErrors: draft.errors,
    ownerMismatch: Boolean(operation && user?.id !== operation.actorId),
    retryRemainingMs: Math.max(0, (operation?.nextRetryAt ?? 0) - retryClock),
    retryDisabled: Boolean(
      !operation ||
      operation.attempt?.sending ||
      operation.status === OPERATION_STATUS.TERMINAL ||
      operation.blockReason === OPERATION_BLOCK_REASON.KEY_REUSED ||
      operation.blockReason === OPERATION_BLOCK_REASON.DEADLINE ||
      retryClock < operation.nextRetryAt ||
      retryClock >= operation.retryUntil ||
      user?.role !== USER_ROLE.ADMIN ||
      user.id !== operation.actorId,
    ),
  };
};
