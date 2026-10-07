import type { AxiosResponse } from "axios";
import { api } from "../../../lib/api";
import { baseURL } from "../../../lib/api-config";
import { refreshSession } from "./refresh-session";
import { store } from "../../../lib/store";
import { clearSession } from "../state/auth-slice";
import {
  clearStoredSession,
  saveStoredSession,
} from "../services/session-storage";
import { AUTH_ENDPOINT } from "../constants/auth";
import type {
  AuthCredentials,
  LoginResponse,
  LogoutResponse,
  RegisterResponse,
} from "./api-types";

// GET /auth/google/start redirects the browser to Google; no JSON response.
export const googleStartUrl = `${baseURL}${AUTH_ENDPOINT.GOOGLE_START}`;

export const authApi = {
  /** POST /auth/login → 200 { accessToken, user }; sets refresh cookie. */
  login: (email: string, password: string): Promise<LoginResponse> =>
    api
      .post<LoginResponse>(AUTH_ENDPOINT.LOGIN, {
        email,
        password,
      } satisfies AuthCredentials)
      .then((response) => {
        saveStoredSession(response.data);
        return response.data;
      }),
  /** POST /auth/register → 201 { user }. */
  register: (email: string, password: string): Promise<RegisterResponse> =>
    api
      .post<RegisterResponse>(AUTH_ENDPOINT.REGISTER, {
        email,
        password,
      } satisfies AuthCredentials)
      .then((r) => r.data),
  /** POST /auth/refresh → 200 { accessToken, user }; rotates refresh cookie. */
  refresh: refreshSession,
  /** POST /auth/logout → 204, no body; clears the local session in finally. */
  logout: async (): Promise<AxiosResponse<LogoutResponse>> => {
    try {
      return await api.post<LogoutResponse>(AUTH_ENDPOINT.LOGOUT);
    } finally {
      clearStoredSession();
      store.dispatch(clearSession());
    }
  },
};
