import { Injectable } from "@nestjs/common";
import { Request } from "express";
import { jwtVerify } from "jose";

import { config } from "./config";

@Injectable()
export class JwtSubjectService {
  private readonly key = new TextEncoder().encode(config.JWT_SECRET);

  async fromRequest(request: Request): Promise<string | null> {
    const authorization = request.header("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      return null;
    }

    try {
      const { payload } = await jwtVerify(authorization.slice(7), this.key, {
        issuer: config.JWT_ISSUER,
        audience: config.JWT_AUDIENCE,
      });
      return typeof payload.sub === "string" && payload.sub.length > 0
        ? payload.sub
        : null;
    } catch {
      return null;
    }
  }
}
