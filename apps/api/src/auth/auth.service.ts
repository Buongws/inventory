import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import * as argon2 from "argon2";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { DataSource, IsNull, Repository } from "typeorm";
import { AccessClaims, PublicUser } from "./types/auth.types";
import { RefreshToken } from "./entities/refresh-token.entity";
import { User, UserRole } from "./entities/user.entity";
import { ACCESS_TTL_SECONDS, REFRESH_TTL_MS } from "./constants";

@Injectable()
export class AuthService {
  private readonly secret: Uint8Array;
  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(RefreshToken)
    private readonly refreshTokens: Repository<RefreshToken>,
    private readonly dataSource: DataSource,
    private readonly config: ConfigService,
  ) {
    this.secret = new TextEncoder().encode(
      config.getOrThrow<string>("JWT_SECRET"),
    );
  }
  publicUser(user: User): PublicUser {
    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    };
  }
  normalizeEmail(email: string) {
    return email.trim().toLowerCase();
  }
  async register(email: string, password: string) {
    const normalized = this.normalizeEmail(email);
    if (await this.users.existsBy({ email: normalized }))
      throw new ConflictException("Email is already registered");
    try {
      return this.publicUser(
        await this.users.save(
          this.users.create({
            email: normalized,
            passwordHash: await argon2.hash(password, {
              type: argon2.argon2id,
            }),
            role: UserRole.CUSTOMER,
          }),
        ),
      );
    } catch (error) {
      if ((error as { code?: string }).code === "23505")
        throw new ConflictException("Email is already registered");
      throw error;
    }
  }
  async login(email: string, password: string) {
    const user = await this.users
      .createQueryBuilder("user")
      .addSelect("user.passwordHash")
      .where("user.email = :email", { email: this.normalizeEmail(email) })
      .getOne();
    if (
      !user ||
      !user.passwordHash ||
      !(await argon2.verify(user.passwordHash, password))
    )
      throw new UnauthorizedException("Invalid email or password");
    return this.issueSession(user);
  }
  async accessToken(user: User) {
    return new SignJWT({ email: user.email, role: user.role })
      .setProtectedHeader({ alg: "HS256" })
      .setSubject(user.id)
      .setIssuer(this.config.getOrThrow("JWT_ISSUER"))
      .setAudience(this.config.getOrThrow("JWT_AUDIENCE"))
      .setIssuedAt()
      .setExpirationTime(`${ACCESS_TTL_SECONDS}s`)
      .sign(this.secret);
  }
  async verifyAccessToken(token: string): Promise<AccessClaims> {
    try {
      const { payload } = await jwtVerify(token, this.secret, {
        issuer: this.config.getOrThrow("JWT_ISSUER"),
        audience: this.config.getOrThrow("JWT_AUDIENCE"),
      });
      if (
        !payload.sub ||
        typeof payload.email !== "string" ||
        (payload.role !== UserRole.ADMIN && payload.role !== UserRole.CUSTOMER)
      )
        throw new Error("Malformed token");
      return { sub: payload.sub, email: payload.email, role: payload.role };
    } catch {
      throw new UnauthorizedException("Invalid or expired access token");
    }
  }
  async findUser(id: string) {
    const user = await this.users.findOneBy({ id });
    if (!user) throw new UnauthorizedException("User no longer exists");
    return user;
  }
  async issueSession(
    user: User,
    familyId: `${string}-${string}-${string}-${string}-${string}` = randomUUID(),
    tokenRepository = this.refreshTokens,
  ) {
    const rawRefreshToken = randomBytes(48).toString("base64url");
    await tokenRepository.save(
      tokenRepository.create({
        userId: user.id,
        familyId,
        tokenHash: this.hashToken(rawRefreshToken),
        expiresAt: new Date(Date.now() + REFRESH_TTL_MS),
        revokedAt: null,
      }),
    );
    return {
      accessToken: await this.accessToken(user),
      refreshToken: rawRefreshToken,
      user: this.publicUser(user),
    };
  }
  async rotate(rawRefreshToken: string) {
    const tokenHash = this.hashToken(rawRefreshToken);
    const result = await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(RefreshToken);
      const family = await repo.findOne({
        select: { familyId: true },
        where: { tokenHash },
      });
      if (!family)
        throw new UnauthorizedException("Refresh token is invalid or expired");

      // Serialize rotation and replay handling across API instances for this family.
      await manager.query(
        "SELECT pg_advisory_xact_lock(hashtextextended($1::text, 0))",
        [family.familyId],
      );
      const token = await repo
        .createQueryBuilder("token")
        .setLock("pessimistic_write", undefined, ["token"])
        .innerJoinAndSelect("token.user", "user")
        .where("token.tokenHash = :tokenHash", { tokenHash })
        .getOne();
      if (!token || token.expiresAt <= new Date())
        throw new UnauthorizedException("Refresh token is invalid or expired");
      if (token.revokedAt) {
        await repo.update(
          { familyId: token.familyId, revokedAt: IsNull() },
          { revokedAt: new Date() },
        );
        return { kind: "reused" as const };
      }
      token.revokedAt = new Date();
      await repo.save(token);
      return {
        kind: "rotated" as const,
        session: await this.issueSession(token.user, token.familyId, repo),
      };
    });
    if (result.kind === "reused")
      throw new UnauthorizedException("Refresh token reuse detected");
    return result.session;
  }
  async revoke(rawRefreshToken: string) {
    await this.refreshTokens.update(
      { tokenHash: this.hashToken(rawRefreshToken), revokedAt: IsNull() },
      { revokedAt: new Date() },
    );
  }
  async createAdmin(email: string, password: string) {
    const user = await this.register(email, password);
    await this.users.update(user.id, { role: UserRole.ADMIN });
    return { ...user, role: UserRole.ADMIN };
  }
  private hashToken(value: string) {
    return createHash("sha256").update(value).digest("hex");
  }
}
