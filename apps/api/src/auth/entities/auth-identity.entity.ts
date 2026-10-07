import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from "typeorm";
import { User } from "./user.entity";

@Entity("auth_identities")
@Unique("uq_auth_identity_provider_subject", ["provider", "subject"])
export class AuthIdentity {
  @PrimaryGeneratedColumn("uuid") id!: string;
  @Column() provider!: string;
  @Column() subject!: string;
  @Column({ name: "user_id" }) userId!: string;
  @ManyToOne(() => User, (user) => user.identities, { onDelete: "CASCADE" })
  @JoinColumn({ name: "user_id" })
  user!: User;
  @CreateDateColumn({ name: "created_at" }) createdAt!: Date;
}
