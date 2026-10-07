import axios, { type AxiosError, type InternalAxiosRequestConfig } from "axios";
import { clearSession } from "../components/auth/state/auth-slice";
import {
  accessTokenExpired,
  clearStoredSession,
  loadStoredSession,
} from "../components/auth/services/session-storage";
import { store } from "./store";
import type {
  AccessTokenClaims,
  Session,
} from "../components/auth/types/auth-types";
import { AUTH_ENDPOINT, USER_ROLE } from "../components/auth/constants/auth";
import { baseURL } from "./api-config";
import { refreshSession } from "../components/auth/api/refresh-session";

type AppAxiosRequestConfig = InternalAxiosRequestConfig & {
  _retried?: boolean;
  _inventoryPost401?: boolean;
  suppressAuthorization?: boolean;
};

declare module "axios" {
  interface AxiosRequestConfig {
    inventoryActorId?: string;
    inventoryRetryUntil?: number;
    inventoryOnDispatch?: () => void;
  }
}

export class InventoryRequestError extends Error {
  constructor(
    readonly code:
      "ACTOR" | "ACCESS" | "DEADLINE" | "ABORTED" | "REFRESH_FAILED",
    readonly authSource?: "before-dispatch" | "after-post-401",
  ) {
    super("Inventory request blocked");
    this.name = "InventoryRequestError";
  }
}

// Local dispatch checks only; the API remains the authorization authority.
function checkInventoryRequest(request: AppAxiosRequestConfig) {
  if (!request.inventoryActorId) return;
  const authSource = request._inventoryPost401 ? "after-post-401" : undefined;
  if (request.signal?.aborted)
    throw new InventoryRequestError("ABORTED", authSource);
  if (!request.signal) throw new InventoryRequestError("ABORTED", authSource);
  if (
    !request.inventoryRetryUntil ||
    !Number.isFinite(request.inventoryRetryUntil) ||
    Date.now() >= request.inventoryRetryUntil
  )
    throw new InventoryRequestError("DEADLINE", authSource);
  const auth = store.getState().auth;
  const session = auth.accessToken
    ? { accessToken: auth.accessToken, user: auth.user }
    : loadStoredSession();
  if (!auth.initialized || !session || session.user?.role !== USER_ROLE.ADMIN) {
    throw new InventoryRequestError("ACCESS", authSource);
  }
  if (session.user.id !== request.inventoryActorId) {
    throw new InventoryRequestError("ACTOR", authSource);
  }
  let claims: AccessTokenClaims;
  try {
    claims = JSON.parse(
      atob(
        session.accessToken.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"),
      ),
    );
  } catch {
    throw new InventoryRequestError("ACCESS", authSource);
  }
  if (
    claims.sub !== request.inventoryActorId ||
    claims.role !== USER_ROLE.ADMIN
  ) {
    throw new InventoryRequestError("ACTOR", authSource);
  }
}

export const api = axios.create({ baseURL, withCredentials: true });

// Axios calls the adapter after its async interceptor chain. Recheck here too,
// so a session change/departure in the intervening microtask cannot dispatch.
api.defaults.adapter = (config) => {
  const request = config as AppAxiosRequestConfig;
  checkInventoryRequest(request);
  request.inventoryOnDispatch?.();
  return axios.getAdapter(axios.defaults.adapter)(request);
};

api.interceptors.request.use(async (config) => {
  const request = config as AppAxiosRequestConfig;
  checkInventoryRequest(request);
  const token =
    store.getState().auth.accessToken ?? loadStoredSession()?.accessToken;
  const isAuthEndpoint = request.url?.startsWith(AUTH_ENDPOINT.PREFIX);
  if (!token || request.suppressAuthorization || isAuthEndpoint) return request;
  if (accessTokenExpired(token)) {
    let session: Session;
    try {
      session = await refreshSession();
    } catch (error) {
      clearStoredSession();
      store.dispatch(clearSession());
      if (request.inventoryActorId) {
        if (request.signal?.aborted) throw new InventoryRequestError("ABORTED");
        throw new InventoryRequestError("REFRESH_FAILED", "before-dispatch");
      }
      throw error;
    }
    checkInventoryRequest(request);
    request.headers.Authorization = `Bearer ${session.accessToken}`;
    return request;
  }
  checkInventoryRequest(request);
  request.headers.Authorization = `Bearer ${token}`;
  return request;
});
api.interceptors.response.use(undefined, async (error: AxiosError) => {
  const request = error.config as AppAxiosRequestConfig | undefined;
  if (
    error.response?.status !== 401 ||
    !request ||
    request._retried ||
    request.url?.startsWith(AUTH_ENDPOINT.PREFIX)
  )
    return Promise.reject(error);
  request._inventoryPost401 = Boolean(request.inventoryActorId);
  checkInventoryRequest(request);
  let session: Session;
  try {
    session = await refreshSession();
  } catch (refreshError) {
    clearStoredSession();
    store.dispatch(clearSession());
    if (request.inventoryActorId) {
      if (request.signal?.aborted) throw new InventoryRequestError("ABORTED");
      throw new InventoryRequestError("REFRESH_FAILED", "after-post-401");
    }
    throw refreshError;
  }
  checkInventoryRequest(request);
  request._retried = true;
  request.headers.Authorization = `Bearer ${session.accessToken}`;
  return api(request);
});
export { baseURL };
