import "reflect-metadata";

import { ServerResponse } from "node:http";
import { NestFactory } from "@nestjs/core";
import { NextFunction, Request, Response } from "express";
import { createProxyMiddleware } from "http-proxy-middleware";

import { AppModule } from "./app.module";
import { config } from "./config";
import { RateLimitMiddleware } from "./rate-limit.middleware";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks();
  const expressApp = app.getHttpAdapter().getInstance();
  const rateLimitMiddleware = app.get(RateLimitMiddleware);
  const proxy = createProxyMiddleware({
    target: config.UPSTREAM_API_URL,
    changeOrigin: true,
    proxyTimeout: 5_000,
    timeout: 5_000,
    on: {
      error: (_error, _request, response) => {
        if (!("writeHead" in response)) {
          return;
        }
        const serverResponse = response as ServerResponse;
        if (!serverResponse.headersSent) {
          serverResponse.writeHead(502, { "content-type": "application/json" });
        }
        serverResponse.end(
          JSON.stringify({ statusCode: 502, code: "UPSTREAM_UNAVAILABLE" }),
        );
      },
    },
  });

  expressApp.use((request: Request, response: Response, next: NextFunction) =>
    rateLimitMiddleware.use(request, response, next),
  );
  expressApp.use((request: Request, response: Response, next: NextFunction) =>
    request.path.startsWith("/api/") ||
    request.path === "/docs" ||
    request.path === "/docs-json"
      ? proxy(request, response, next)
      : next(),
  );

  await app.init();

  await app.listen(config.PORT, "0.0.0.0");
}

void bootstrap();
