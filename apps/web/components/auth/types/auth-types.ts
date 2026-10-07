import type { AUTH_MODE, USER_ROLE } from "../constants/auth";

export type UserRole = (typeof USER_ROLE)[keyof typeof USER_ROLE];
export type AuthMode = (typeof AUTH_MODE)[keyof typeof AUTH_MODE];

export type User = {
  id: string;
  email: string;
  role: UserRole;
  createdAt: string;
};

export type Session = {
  accessToken: string;
  user: User;
};

export type AuthState = {
  user: User | null;
  accessToken: string | null;
  initialized: boolean;
};

export type AccessTokenClaims = {
  sub?: string;
  role?: string;
  exp?: number;
};
