export const USER_ROLE = {
  CUSTOMER: "customer",
  ADMIN: "admin",
} as const;

export const AUTH_MODE = {
  LOGIN: "login",
  REGISTER: "register",
} as const;

export const AUTH_ROUTE = {
  LOGIN: "/login",
  REGISTER: "/register",
  DASHBOARD: "/dashboard",
} as const;

export const AUTH_ENDPOINT = {
  PREFIX: "/auth/",
  LOGIN: "/auth/login",
  REGISTER: "/auth/register",
  REFRESH: "/auth/refresh",
  LOGOUT: "/auth/logout",
  GOOGLE_START: "/auth/google/start",
} as const;

export const AUTH_STORAGE_KEY = "inventory.auth.session";
export const ACCESS_TOKEN_EXPIRY_BUFFER_MS = 5_000;
export const MILLISECONDS_PER_SECOND = 1_000;
export const PASSWORD_MIN_LENGTH = 12;
