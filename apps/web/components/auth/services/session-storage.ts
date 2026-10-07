import type { AccessTokenClaims, Session } from "../types/auth-types";
import {
  AUTH_STORAGE_KEY,
  ACCESS_TOKEN_EXPIRY_BUFFER_MS,
  MILLISECONDS_PER_SECOND,
} from "../constants/auth";

export function accessTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(
      atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")),
    ) as AccessTokenClaims;

    return (
      !payload.exp ||
      payload.exp * MILLISECONDS_PER_SECOND <=
        Date.now() + ACCESS_TOKEN_EXPIRY_BUFFER_MS
    );
  } catch {
    return true;
  }
}

export function loadStoredSession(): Session | null {
  if (typeof window === "undefined") return null;

  const raw = window.localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as Session;
    return typeof session.accessToken === "string" && session.user?.id
      ? session
      : null;
  } catch {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

export function saveStoredSession(session: Session): void {
  window.localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export function clearStoredSession(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(AUTH_STORAGE_KEY);
  }
}
