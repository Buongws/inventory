# Domain and Architecture Design

The project is a modular monolith behind a dedicated rate-limit Gateway. PostgreSQL is the source of truth; Redis is used for short-lived state, counters, and future cache-aside reads. The API exposes REST resources under `/api/v1`.

The API owns authentication, authorization, catalog, inventory, orders, transactions, and webhooks. The Gateway owns proxying and rate limiting. The Next.js web client owns presentation and session UX; it never decides authorization.

Money is stored as integer VND (`bigint` where needed) and serialized as strings when JavaScript precision could be lost. New timestamps use UTC `timestamptz`. Inventory and order changes use PostgreSQL transactions, row locks, constraints, idempotency keys, and state transitions. External calls do not run inside business transactions.

Future milestones cover products, inventory movements, orders, payment webhooks, catalog caching, and query optimization. Each milestone requires a feature spec before implementation.
