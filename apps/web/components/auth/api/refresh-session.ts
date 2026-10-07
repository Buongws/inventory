import axios from "axios";
import { baseURL } from "../../../lib/api-config";
import { store } from "../../../lib/store";
import { setSession } from "../state/auth-slice";
import { saveStoredSession } from "../services/session-storage";
import { AUTH_ENDPOINT } from "../constants/auth";
import type { RefreshResponse } from "./api-types";

// Use a separate client to avoid recursively triggering auth interceptors.
// POST /auth/refresh → 200 { accessToken, user }; one shared in-flight request.
const refreshClient = axios.create({ baseURL, withCredentials: true });
let refreshPromise: Promise<RefreshResponse> | null = null;

export async function refreshSession(): Promise<RefreshResponse> {
  refreshPromise ??= refreshClient
    .post<RefreshResponse>(AUTH_ENDPOINT.REFRESH)
    .then((response) => response.data)
    .finally(() => {
      refreshPromise = null;
    });
  const session = await refreshPromise;
  saveStoredSession(session);
  store.dispatch(setSession(session));
  return session;
}
