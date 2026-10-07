# Roadmap

## M0 — Foundation

Repository structure, Docker/PostgreSQL, Redis, health, Swagger, Postman, Gateway, and shared tooling.

## M1 — Authentication

Email/password, refresh rotation, logout, roles, Google SSO, explicit identity linking, and refresh-token cleanup.

## M2 — Catalog and inventory

Product CRUD, inactive visibility, inventory balances, and movement history.

## M3 — Orders

Order creation, ownership, price snapshots, reservations, cancellation, and idempotency.

## M4 — Cache

Cache-aside product reads with invalidation after commit and Redis failure behavior.

## M5 — Payments

Signed webhook handling, duplicate events, payment state transitions, and order expiry jobs.

## M6 — SQL and production readiness

Indexes, query plans, structured request logs, limits, CI, and complete Postman flows.
