import type { Session, User } from "../types/auth-types";

export type AuthCredentials = { email: string; password: string };

// POST /auth/login and /auth/refresh: { accessToken, user }.
export type LoginResponse = Session;
export type RefreshResponse = Session;

// POST /auth/register does not create a session.
export type RegisterResponse = { user: User };

// POST /auth/logout: 204, no response body.
export type LogoutResponse = void;
