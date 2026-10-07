import axios from "axios";
import {
  TERMINAL_OUTCOME,
  OPERATION_BLOCK_REASON,
  MILLISECONDS_PER_SECOND,
  MOVEMENT_ERROR_CODE,
  OPERATION_STATUS,
  RETRY_DELAYS_MS,
  RETRY_JITTER_MAX_MS,
  RETRY_MAX_DELAY_MS,
} from "../constants/movement";
import { InventoryRequestError } from "../../../lib/api";
import { store } from "../../../lib/store";
import { clearSession } from "../../auth/state/auth-slice";
import { clearStoredSession } from "../../auth/services/session-storage";
import type {
  InventoryAttempt,
  InventoryOperation,
} from "../types/inventory-types";

const nextRetryAt = (failures: number) => {
  const delay =
    RETRY_DELAYS_MS[Math.min(failures - 1, RETRY_DELAYS_MS.length - 1)];
  return (
    Date.now() +
    Math.min(
      RETRY_MAX_DELAY_MS,
      delay + Math.floor(Math.random() * (RETRY_JITTER_MAX_MS + 1)),
    )
  );
};

const parseRetryAfter = (value: unknown) => {
  const text = typeof value === "string" ? value.trim() : "";
  const seconds = text !== "" ? Number(text) : NaN;
  const date = text !== "" ? Date.parse(text) : NaN;
  if (Number.isFinite(seconds) && seconds >= 0)
    return Date.now() + seconds * MILLISECONDS_PER_SECOND;
  if (Number.isFinite(date) && date > Date.now()) return date;
  return undefined;
};

export const applyMovementError = (
  current: InventoryOperation,
  attempt: InventoryAttempt,
  error: unknown,
  dispatchedToken: string | null,
) => {
  const status = axios.isAxiosError(error) ? error.response?.status : undefined;
  const code = axios.isAxiosError(error)
    ? (error.response?.data as { code?: string } | undefined)?.code
    : undefined;
  const localError = error instanceof InventoryRequestError;
  const retryHeader = axios.isAxiosError(error)
    ? error.response?.headers["retry-after"]
    : undefined;
  const serverRetryAt = parseRetryAfter(retryHeader);
  attempt.serverUnauthorized =
    status === 401 || (localError && error.authSource === "after-post-401");
  const auth = store.getState().auth;
  if (
    (status === 401 || status === 403) &&
    dispatchedToken !== null &&
    auth.user?.id === current.actorId &&
    auth.accessToken === dispatchedToken
  ) {
    clearStoredSession();
    store.dispatch(clearSession());
  }
  if (
    status === 409 &&
    (code === MOVEMENT_ERROR_CODE.INSUFFICIENT_STOCK ||
      code === MOVEMENT_ERROR_CODE.STOCK_LIMIT_EXCEEDED)
  ) {
    current.status = OPERATION_STATUS.TERMINAL;
    current.terminal = { kind: TERMINAL_OUTCOME.STOCK_REJECTION, code };
    current.message =
      code === MOVEMENT_ERROR_CODE.INSUFFICIENT_STOCK
        ? "INSUFFICIENT_STOCK: không đủ tồn kho. Đang tải lại tồn hiện tại."
        : "STOCK_LIMIT_EXCEEDED: vượt giới hạn tồn kho. Đang tải lại tồn hiện tại.";
  } else if (status === 404 && code === MOVEMENT_ERROR_CODE.PRODUCT_NOT_FOUND) {
    current.status = OPERATION_STATUS.TERMINAL;
    current.terminal = { kind: TERMINAL_OUTCOME.PRODUCT_MISSING };
    current.message = "PRODUCT_NOT_FOUND: sản phẩm không còn sẵn sàng.";
  } else if (
    status === 400 &&
    code === MOVEMENT_ERROR_CODE.INVALID_INPUT &&
    !current.priorUncertain
  ) {
    current.status = OPERATION_STATUS.TERMINAL;
    current.terminal = { kind: TERMINAL_OUTCOME.VALIDATION_REJECTION };
    current.message =
      "INVALID_INPUT: kiểm tra các trường trước khi gửi giao dịch mới.";
  } else if (
    status === 409 &&
    code === MOVEMENT_ERROR_CODE.IDEMPOTENCY_IN_PROGRESS
  ) {
    current.status = current.priorUncertain
      ? OPERATION_STATUS.UNCERTAIN
      : OPERATION_STATUS.IN_PROGRESS;
    current.nextRetryAt = serverRetryAt ?? Date.now() + MILLISECONDS_PER_SECOND;
    current.message =
      "IDEMPOTENCY_IN_PROGRESS: giao dịch cùng khóa vẫn đang được xử lý. Giữ nguyên thao tác.";
  } else if (
    status === 409 &&
    code === MOVEMENT_ERROR_CODE.IDEMPOTENCY_KEY_REUSED
  ) {
    current.status = OPERATION_STATUS.BLOCKED;
    current.blockReason = OPERATION_BLOCK_REASON.KEY_REUSED;
    current.message =
      "IDEMPOTENCY_KEY_REUSED: máy chủ từ chối payload của khóa này. Không tạo khóa mới cho thao tác này.";
  } else if (localError && error.code !== "ABORTED") {
    current.status = current.priorUncertain
      ? OPERATION_STATUS.UNCERTAIN
      : OPERATION_STATUS.BLOCKED;
    current.blockReason =
      error.code === "DEADLINE"
        ? OPERATION_BLOCK_REASON.DEADLINE
        : error.code === "ACTOR"
          ? OPERATION_BLOCK_REASON.ACTOR
          : OPERATION_BLOCK_REASON.AUTHORIZATION;
    current.message =
      error.code === "DEADLINE"
        ? "Hết thời hạn thử lại của thao tác. Cần đối chiếu lịch sử trước khi tiếp tục."
        : error.code === "ACTOR"
          ? "Phiên quản trị không khớp với người khởi tạo thao tác. Đăng nhập lại bằng đúng tài khoản."
          : current.priorUncertain
            ? "Quyền truy cập chưa sẵn sàng; kết quả trước đó vẫn chưa rõ. Khôi phục phiên quản trị gốc để tiếp tục cùng thao tác."
            : attempt.serverUnauthorized
              ? "Máy chủ đã từ chối lần gửi với 401 và làm mới phiên thất bại. Giữ thao tác để khôi phục phiên quản trị gốc; chưa gửi lại."
              : "Yêu cầu chưa được gửi vì phiên quản trị chưa sẵn sàng. Khôi phục phiên quản trị gốc để tiếp tục cùng thao tác.";
  } else if (status === 401 || status === 403) {
    if (current.priorUncertain) {
      current.status = OPERATION_STATUS.UNCERTAIN;
      current.message =
        "Phiên hoặc quyền truy cập thay đổi; kết quả cũ vẫn chưa rõ. Khôi phục phiên quản trị gốc và giữ nguyên khóa.";
    } else {
      current.status = OPERATION_STATUS.TERMINAL;
      current.terminal = { kind: TERMINAL_OUTCOME.ACCESS_REJECTION };
      current.message =
        status === 401
          ? "UNAUTHORIZED: máy chủ từ chối phiên hiện tại."
          : "FORBIDDEN: máy chủ từ chối quyền thực hiện.";
    }
  } else if (
    status === 429 ||
    (status === 503 && code === MOVEMENT_ERROR_CODE.INVENTORY_BUSY)
  ) {
    current.status = current.priorUncertain
      ? OPERATION_STATUS.UNCERTAIN
      : OPERATION_STATUS.RETRYABLE;
    current.retryableFailureCount += 1;
    current.nextRetryAt =
      serverRetryAt ?? nextRetryAt(current.retryableFailureCount);
    current.message =
      status === 429
        ? "MÁY CHỦ ĐANG GIỚI HẠN TẦN SUẤT: giữ nguyên thao tác và chờ thời gian thử lại."
        : "INVENTORY_BUSY: kho đang bận. Giữ nguyên thao tác và thử lại theo hướng dẫn máy chủ.";
  } else {
    current.status = OPERATION_STATUS.UNCERTAIN;
    current.priorUncertain = true;
    current.retryableFailureCount += 1;
    current.nextRetryAt = nextRetryAt(current.retryableFailureCount);
    current.message =
      "Chưa xác định được kết quả. Giữ thao tác này và đối chiếu lịch sử; không tạo giao dịch mới.";
  }
};
