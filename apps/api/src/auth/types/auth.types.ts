import { UserRole } from "../entities/user.entity";
export interface PublicUser {
  id: string;
  email: string;
  role: UserRole;
  createdAt: Date;
}
export interface AccessClaims {
  sub: string;
  email: string;
  role: UserRole;
}
export interface GoogleProfile {
  subject: string;
  email: string;
  emailVerified: boolean;
}
