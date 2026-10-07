import {
  BadRequestException,
  ConflictException,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { OAuth2Client } from "google-auth-library";
import { createHash, randomBytes } from "node:crypto";
import { Repository } from "typeorm";
import { RedisService } from "../cache/redis.service";
import { GoogleProfile } from "./types/auth.types";
import { AuthIdentity } from "./entities/auth-identity.entity";
import { User, UserRole } from "./entities/user.entity";

type OAuthState = {
  verifier: string;
  nonce: string;
  purpose: "login" | "link";
  userId?: string;
};
@Injectable()
export class GoogleService {
  private readonly stateTtlSeconds = 10 * 60;
  constructor(
    private readonly config: ConfigService,
    private readonly redis: RedisService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(AuthIdentity)
    private readonly identities: Repository<AuthIdentity>,
  ) {}
  private client() {
    const clientId = this.config.get<string>("GOOGLE_CLIENT_ID");
    const clientSecret = this.config.get<string>("GOOGLE_CLIENT_SECRET");
    if (!clientId || !clientSecret)
      throw new ServiceUnavailableException("Google sign-in is not configured");
    return new OAuth2Client(
      clientId,
      clientSecret,
      this.config.getOrThrow<string>("GOOGLE_REDIRECT_URI"),
    );
  }

  async start(purpose: OAuthState["purpose"], userId?: string) {
    const state = randomBytes(32).toString("base64url");
    const verifier = randomBytes(48).toString("base64url");
    const nonce = randomBytes(32).toString("base64url");
    const challenge = createHash("sha256").update(verifier).digest("base64url");
    const payload: OAuthState = { verifier, nonce, purpose, userId };
    await this.redis.client.set(
      `oauth:google:${state}`,
      JSON.stringify(payload),
      "EX",
      this.stateTtlSeconds,
      "NX",
    );
    const url = this.client().generateAuthUrl({
      access_type: "online",
      response_type: "code",
      scope: ["openid", "email", "profile"],
      state,
      nonce,
      code_challenge: challenge,
      code_challenge_method: "S256" as never,
      prompt: "select_account",
    });
    return { state, url };
  }
  async consume(state: string): Promise<OAuthState> {
    const raw = await this.redis.client.getdel(`oauth:google:${state}`);
    if (!raw)
      throw new UnauthorizedException(
        "Google sign-in state is invalid or expired",
      );
    return JSON.parse(raw) as OAuthState;
  }

  async profile(code: string, transaction: OAuthState): Promise<GoogleProfile> {
    try {
      const client = this.client();
      const response = await client.getToken({
        code,
        codeVerifier: transaction.verifier,
        redirect_uri: this.config.getOrThrow("GOOGLE_REDIRECT_URI"),
      });
      if (!response.tokens.id_token) throw new Error("No ID token");
      const ticket = await client.verifyIdToken({
        idToken: response.tokens.id_token,
        audience: this.config.getOrThrow("GOOGLE_CLIENT_ID"),
      });
      const p = ticket.getPayload();
      if (
        !p?.sub ||
        !p.email ||
        p.email_verified !== true ||
        p.nonce !== transaction.nonce
      )
        throw new Error("Invalid identity claims");
      return {
        subject: p.sub,
        email: p.email.toLowerCase(),
        emailVerified: p.email_verified,
      };
    } catch {
      throw new UnauthorizedException("Google identity could not be verified");
    }
  }

  async resolve(profile: GoogleProfile, transaction: OAuthState) {
    if (!profile.emailVerified)
      throw new UnauthorizedException("Google email is not verified");
    const existingIdentity = await this.identities.findOne({
      where: { provider: "google", subject: profile.subject },
      relations: { user: true },
    });
    if (transaction.purpose === "link") {
      if (!transaction.userId)
        throw new BadRequestException("Missing link target");
      if (existingIdentity && existingIdentity.userId !== transaction.userId)
        throw new ConflictException(
          "This Google account is linked to another user",
        );
      const user = await this.users.findOneBy({ id: transaction.userId });
      if (!user) throw new UnauthorizedException("User no longer exists");
      if (!existingIdentity)
        await this.identities.save(
          this.identities.create({
            provider: "google",
            subject: profile.subject,
            userId: user.id,
          }),
        );
      return user;
    }
    if (existingIdentity) return existingIdentity.user;
    if (await this.users.existsBy({ email: profile.email }))
      throw new ConflictException(
        "An account with this email exists. Sign in with password and link Google.",
      );
    const user = await this.users.save(
      this.users.create({
        email: profile.email,
        passwordHash: null,
        role: UserRole.CUSTOMER,
      }),
    );
    await this.identities.save(
      this.identities.create({
        provider: "google",
        subject: profile.subject,
        userId: user.id,
      }),
    );
    return user;
  }
}
