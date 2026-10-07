import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
} from "@nestjs/common";
import {
  ApiBearerAuth,
  ApiCookieAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from "@nestjs/swagger";
import { Request, Response } from "express";
import { AuthService } from "./auth.service";
import { LoginDto, RegisterDto } from "./dto/auth.dto";
import { AccessTokenGuard, CurrentUser } from "./auth.guard";
import { AccessClaims } from "./types/auth.types";
import { GoogleService } from "./google.service";
import { REFRESH_COOKIE, OAUTH_STATE_COOKIE } from "./constants";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly google: GoogleService,
  ) {}

  private setRefresh(response: Response, token: string) {
    response.cookie(REFRESH_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/v1/auth",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
  }

  private clearRefresh(response: Response) {
    response.clearCookie(REFRESH_COOKIE, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/v1/auth",
    });
  }

  private assertOrigin(request: Request) {
    const origin = request.header("origin");
    if (origin && origin !== process.env.APP_ORIGIN)
      throw new UnauthorizedException("Unexpected request origin");
  }

  @Post("register")
  @ApiOperation({ summary: "Register with email and password" })
  async register(@Body() dto: RegisterDto) {
    return { user: await this.auth.register(dto.email, dto.password) };
  }

  @Post("login")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: "Login and create a refresh cookie" })
  @ApiCookieAuth(REFRESH_COOKIE)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    const session = await this.auth.login(dto.email, dto.password);
    this.setRefresh(response, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post("refresh")
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Rotate refresh cookie and return a new access token",
  })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertOrigin(request);
    const token = request.cookies?.[REFRESH_COOKIE];
    if (!token) throw new UnauthorizedException("Refresh cookie is required");
    const session = await this.auth.rotate(token);
    this.setRefresh(response, session.refreshToken);
    return { accessToken: session.accessToken, user: session.user };
  }

  @Post("logout")
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: "Revoke this refresh session" })
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ) {
    this.assertOrigin(request);
    if (request.cookies?.[REFRESH_COOKIE])
      await this.auth.revoke(request.cookies[REFRESH_COOKIE]);
    this.clearRefresh(response);
  }

  @Get("me")
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Current user" })
  async me(@CurrentUser() claims: AccessClaims) {
    return { user: this.auth.publicUser(await this.auth.findUser(claims.sub)) };
  }

  @Get("google/start")
  @ApiOperation({ summary: "Redirect browser to Google sign-in" })
  async googleStart(@Res() response: Response) {
    const { state, url } = await this.google.start("login");
    response.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/v1/auth/google/callback",
      maxAge: 10 * 60 * 1000,
    });
    return response.redirect(url);
  }

  @Post("google/link/start")
  @UseGuards(AccessTokenGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: "Create a Google account-link URL" })
  async googleLinkStart(
    @CurrentUser() claims: AccessClaims,
    @Res({ passthrough: true }) response: Response,
  ) {
    const { state, url } = await this.google.start("link", claims.sub);
    response.cookie(OAUTH_STATE_COOKIE, state, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/api/v1/auth/google/callback",
      maxAge: 10 * 60 * 1000,
    });
    return { authorizationUrl: url };
  }

  @Get("google/callback")
  @ApiResponse({
    status: 302,
    description: "Redirects to the demo session page",
  })
  async googleCallback(@Req() request: Request, @Res() response: Response) {
    const { code, state, error } = request.query as {
      code?: string;
      state?: string;
      error?: string;
    };
    if (
      error ||
      !code ||
      !state ||
      request.cookies?.[OAUTH_STATE_COOKIE] !== state
    )
      throw new BadRequestException("Google sign-in was cancelled or rejected");
    response.clearCookie(OAUTH_STATE_COOKIE, {
      path: "/api/v1/auth/google/callback",
    });
    const transaction = await this.google.consume(state);
    const profile = await this.google.profile(code, transaction);
    const user = await this.google.resolve(profile, transaction);
    const session = await this.auth.issueSession(user);
    this.setRefresh(response, session.refreshToken);
    return response.redirect(`${process.env.APP_ORIGIN}/auth/callback`);
  }

  @Get("session-demo")
  @ApiOperation({ summary: "Browser-only demo for a Google-created session" })
  demo(@Res() response: Response) {
    response
      .type("html")
      .send(
        `<!doctype html><title>Inventory session</title><main><h1>Google sign-in complete</h1><p id="message">Creating access token…</p></main><script>fetch('/api/v1/auth/refresh',{method:'POST',credentials:'include'}).then(async r=>{if(!r.ok)throw new Error('Session refresh failed');const x=await r.json();sessionStorage.setItem('inventory_access_token',x.accessToken);document.querySelector('#message').textContent='Signed in as '+x.user.email+'. Access token is in this tab session storage.'}).catch(e=>document.querySelector('#message').textContent=e.message)</script>`,
      );
  }
}
