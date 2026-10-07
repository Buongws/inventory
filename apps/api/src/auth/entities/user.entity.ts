import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from "typeorm";
import { AuthIdentity } from "./auth-identity.entity";
import { RefreshToken } from "./refresh-token.entity";

export enum UserRole {
  CUSTOMER = "customer",
  ADMIN = "admin",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "email", unique: true }) email!: string;
  @Column({
    name: "password_hash",
    type: "varchar",
    nullable: true,
    select: false,
  })
  passwordHash!: string | null;
  @Column({ type: "enum", enum: UserRole, default: UserRole.CUSTOMER })
  role!: UserRole;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
  @UpdateDateColumn({ name: "updated_at" }) updatedAt!: Date;
  @OneToMany(() => AuthIdentity, (identity) => identity.user)
  identities!: AuthIdentity[];
  @OneToMany(() => RefreshToken, (token) => token.user)
  refreshTokens!: RefreshToken[];
}
