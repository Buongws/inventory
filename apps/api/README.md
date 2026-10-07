# Inventory API

This service is a NestJS learning project for inventory management and customer orders. The initial scope is one warehouse, VND pricing, a separate frontend, and simulated payments. Supplier purchasing is outside the initial scope.

## Current capabilities

- NestJS 11 + strict TypeScript; Node.js 24, npm, and a committed lockfile.
- PostgreSQL 17 + TypeORM; `synchronize` is disabled and the migration CLI is configured.
- Redis 7.4 via ioredis; connection lifecycle is managed during application startup and shutdown. Product caching is planned for a later milestone.
- Environment validation, a global `ValidationPipe`, and the `/api/v1` prefix.
- `GET /api/v1/health/live` and `GET /api/v1/health/ready` (200 or 503).
- Swagger `/docs`, OpenAPI `/docs-json`, and Postman collection/environment files.
- Multi-stage Dockerfile, Docker Compose, Jest, Prettier, and GitHub Actions.

Authentication includes email/password, refresh-token rotation, JWT, and Google SSO. See the [auth specification](../../docs/auth/AUTH_SPEC.md), [refresh-token cleanup specification](../../docs/rate-limiting/REFRESH_TOKEN_CLEANUP_SPEC.md), [Google SSO guide](../../docs/auth/GOOGLE_SSO.md), [roadmap](../../docs/planning/ROADMAP.md), and [architecture](../../docs/architecture/DESIGN.md).

The product catalog and rate limiter are specified before implementation: [product specification](../../docs/catalog/PRODUCT_SPEC.md) and [rate-limit specification](../../docs/rate-limiting/RATE_LIMIT_SPEC.md). Rate limiting runs in the [Gateway](../gateway/README.md) before this API.

## Local environment

Node.js 24 is the default runtime. Redis is available at `localhost:6379`; PostgreSQL runs at `localhost:55433` because port 5432 is occupied. The local API uses port 3001, the frontend uses 3002, and the Gateway uses 3004. Start the API and Gateway, then open `http://localhost:3004/docs`. Postman and the frontend also use the Gateway. Do not start another Redis container on port 6379 while the local Redis process is running.

The following instructions describe a clean environment. If you run the full Compose stack, release ports 3000/6379 or change the host mappings, then update the Postman base URL.

## Run with Docker

Start Docker Desktop and wait for the engine, then run this from the repository root:

```sh
docker compose up --build -d
```

Open `http://localhost:3001/docs` when using the API directly through Compose. When the local Gateway is running, open `http://localhost:3004/docs`. Import the files in `postman/`, select **Inventory Local**, and run the collection. Readiness must report both PostgreSQL and Redis as healthy.

```sh
docker compose logs -f api
docker compose down
```

Compose uses local credentials and binds ports to localhost. Do not deploy this configuration publicly. `down` preserves PostgreSQL data; adding `-v` removes it.

## Run locally for development

Install Node.js 24 (with nvm, use `nvm install && nvm use`).

```sh
cp .env.example .env
npm ci
npm run infra:up
npm run start:dev
```

Before the first run, add a `JWT_SECRET` of at least 32 characters to `.env`, then run the migration:

```sh
npm run migration:run
```

Create an admin explicitly; no default admin is provisioned:

```sh
npm run admin:create -- admin@example.com a-long-password-here
```

Google SSO requires `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET`. When using the Gateway, the Google Cloud redirect URI must be `http://localhost:3004/api/v1/auth/google/callback`. See [GOOGLE_SSO.md](../../docs/auth/GOOGLE_SSO.md).

## Frontend authentication

The Next.js client is documented in [frontend](../web/README.md) and runs at `http://localhost:3002/login`. It stores the access token and user in `localStorage`, hydrates Redux Toolkit on startup, and uses Axios interceptors to refresh an expired token or recover from a 401. The refresh token remains an HttpOnly backend cookie.

If the full Compose stack is running, stop the API container with `docker compose stop api` before starting the local API on port 3001. Local `.env` values are separate from Compose's internal URLs. If ports 5432/6379 are occupied, change the Compose host mapping and the matching `.env` URL.

## Verification and migrations

Refresh-token cleanup runs at the start of every UTC hour. The scheduler is registered when the API starts and does not run immediately at startup. Defaults:

```env
REFRESH_TOKEN_CLEANUP_ENABLED=true
REFRESH_TOKEN_CLEANUP_CRON="0 0 * * * *"
REFRESH_TOKEN_CLEANUP_BATCH_SIZE=1000
REFRESH_TOKEN_CLEANUP_MAX_BATCHES=20
REFRESH_TOKEN_CLEANUP_RETENTION_DAYS=0
```

Add these variables to `.env` to override defaults, then restart the API. Set `REFRESH_TOKEN_CLEANUP_ENABLED=false` to disable the job. The cron expression must contain six fields and is validated at startup. Each run processes at most 20 batches of 1,000 expired tokens. Revoked tokens that have not expired are retained. Retention days are measured from expiry, not token creation.

Run `npm run migration:run` before deployment to create `idx_refresh_tokens_expires_at`. The job holds an advisory lock using a dedicated PostgreSQL connection; other instances skip a run while the lock is held. During shutdown, the job waits for the current batch before closing its connection. If a run fails, the API continues serving requests and retries at the next schedule. Monitor `RefreshTokenCleanupService` logs for deleted-token counts, batch counts, duration, and batch-limit status.

```sh
npm run typecheck
npm test
npm run build
npm run format:check
```

After adding the first entity, start PostgreSQL and run:

```sh
npm run migration:generate -- src/database/migrations/CreateUsers
npm run migration:run
# Use this only to revert the latest migration:
npm run migration:revert
```

Review generated SQL before running it and commit the entity with its migration. Migrations do not run automatically at application startup. For a built Docker runtime, run `docker compose run --rm api npx --no-install typeorm migration:run -d dist/database/data-source.js` after rebuilding the image.

## Structure

```text
src/
  main.ts                 # Bootstrap, validation, Swagger
  app.module.ts           # Module composition
  config/                 # Environment validation
  database/               # TypeORM and migrations
  cache/                  # Redis connection
  health/                 # Liveness/readiness
postman/                  # Collection and local environment
test/                     # Baseline tests
../docs/                  # Shared specs, conventions and guides
```

Add each feature under `src/modules/<feature>/` when its milestone starts. Avoid empty modules and speculative abstractions.

## Next milestone

Implement milestone 1: users and authentication. Complete the users migration, registration, login, and `/auth/me`, then add refresh rotation, logout, and authorization. Each feature should include DTOs, business-error tests, Swagger documentation, and Postman requests.

## Official references

- https://docs.nestjs.com/techniques/configuration
- https://docs.nestjs.com/techniques/validation
- https://docs.nestjs.com/data/typeorm
- https://typeorm.io/docs/advanced-topics/migrations/
- https://nodejs.org/en/about/previous-releases
