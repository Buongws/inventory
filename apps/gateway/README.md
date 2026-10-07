# Inventory Gateway

The Gateway sits in front of the Inventory API for rate limiting and request proxying. It contains no business logic; the API at `:3001` remains responsible for authentication, authorization, and domain behavior.

```text
Browser / Postman → Gateway :3004 → Inventory API :3001
```

## Run locally

The Gateway and API must use the same `JWT_SECRET` because the Gateway verifies JWTs to apply user quotas to write endpoints.

```sh
cp .env.example .env
npm ci
npm run build
npm run start
```

Required environment variables:

```text
PORT=3004
UPSTREAM_API_URL=http://localhost:3001
DATABASE_URL=postgresql://inventory:inventory_dev@localhost:55433/inventory
REDIS_URL=redis://localhost:6379
JWT_SECRET=<same value as apps/api/.env from repository root>
JWT_ISSUER=inventory-api
JWT_AUDIENCE=inventory-api
```

Run the migration from the API directory first because the Gateway reads the `rate_limit_policies` table:

```sh
npm run migration:run
```

Check the Gateway at `http://localhost:3004/gateway/health`. Use `http://localhost:3004/api/v1` as the frontend and Postman base URL.

## Updating rate-limit policies

Policies are stored in PostgreSQL. Change a policy, then restart or redeploy the Gateway so all instances load the new configuration. Redis stores short-lived counters only, not durable policy configuration.

See [RATE_LIMIT_SPEC.md](../../docs/rate-limiting/RATE_LIMIT_SPEC.md) for policy details, the Lua counter, Redis failure behavior, and trade-offs.
