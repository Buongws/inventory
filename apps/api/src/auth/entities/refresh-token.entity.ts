import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { User } from "./user.entity";

@Entity("refresh_tokens")
@Index("idx_refresh_tokens_family", ["familyId"])
@Index("idx_refresh_tokens_expires_at", ["expiresAt"])
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column({ name: "user_id" }) userId!: string;
  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
  @Column({ name: "token_hash", unique: true }) tokenHash!: string;
  @Column({ name: "family_id", type: "uuid" })
  familyId!: `${string}-${string}-${string}-${string}-${string}`;
  @Column({ name: "expires_at", type: "timestamptz" }) expiresAt!: Date;
  @Column({ name: "revoked_at", type: "timestamptz", nullable: true })
  revokedAt!: Date | null;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}
