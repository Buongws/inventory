# Database Practice for Inventory Learning

This guide turns database interview topics into exercises for this NestJS/PostgreSQL project. Today the API has `users`, `auth_identities`, `refresh_tokens`, and `rate_limit_policies`. Product, inventory, order, and payment tables are planned, not implemented. Keep SQL experiments in a local `learning` schema; never run the write exercises against a shared database.

## Recommended order

1. **Current auth data:** keys, foreign keys, normalization, indexes, transactions, and refresh-token replay.
2. **Next feature, products:** catalog constraints, search, pagination, and measured query plans.
3. **Inventory and orders:** concurrent stock changes, row locks, isolation, atomic reservations, and idempotency.
4. **Later:** bulk imports, outbox/queues, partitions, replicas, and sharding only when the workload justifies them.

For each topic, explain the concept, show the exact project path or SQL, describe a failure case, and say how you measured or verified it. Do not claim a planned feature is already running.

## Lab 1: inspect the existing schema and query plans

Connect DBeaver to the local PostgreSQL server using the database settings in `apps/api/.env` (the documented local port is `55433`). Inspect the primary keys, `uq_users_email`, `uq_auth_identity_provider_subject`, `uq_refresh_tokens_token_hash`, `idx_refresh_tokens_family`, and `idx_refresh_tokens_expires_at`. `auth_identities.user_id` and `refresh_tokens.user_id` reference `users.id`; `provider + subject`, not an email address, identifies a Google account.

Run read-only queries:

```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
  AND tablename IN ('users', 'auth_identities', 'refresh_tokens')
ORDER BY tablename, indexname;

EXPLAIN (ANALYZE, BUFFERS)
SELECT id
FROM refresh_tokens
WHERE expires_at <= now()
ORDER BY expires_at
LIMIT 1000;
```

Record `actual rows`, `loops`, `Execution Time`, and buffer hits/reads. A sequential scan on a tiny table is not automatically a problem. Compare with the cleanup query in `apps/api/src/auth/refresh-token-cleanup.service.ts`; explain why the expiry index is relevant and why index maintenance makes writes costlier. `EXPLAIN ANALYZE` executes its statement: wrap write experiments in `BEGIN`/`ROLLBACK`. See the [PostgreSQL EXPLAIN guide](https://www.postgresql.org/docs/17/using-explain.html).

## Lab 2: transaction and isolation with two DBeaver sessions

Set up a disposable table in the local database:

```sql
CREATE SCHEMA IF NOT EXISTS learning;
CREATE TABLE IF NOT EXISTS learning.inventory_balance (
  product_id integer PRIMARY KEY,
  available integer NOT NULL CHECK (available >= 0)
);
INSERT INTO learning.inventory_balance (product_id, available)
VALUES (1, 5)
ON CONFLICT (product_id) DO UPDATE SET available = 5;
```

Open two separate DBeaver connections. In **session A**, execute `BEGIN;`, then:

```sql
UPDATE learning.inventory_balance
SET available = available - 4
WHERE product_id = 1 AND available >= 4
RETURNING available;
```

Leave A uncommitted. In **session B**, execute `BEGIN;` and run the same `UPDATE`; it waits for A's row lock. Commit A. B then returns zero rows because only one item remains; commit B. The balance must be `1`, never negative. A transaction makes one reservation atomic; the conditional update plus row lock prevents two buyers from consuming the same stock. Reset `available` to `5` before repeating. End with `DROP SCHEMA learning CASCADE;` when finished.

PostgreSQL defaults to **Read Committed**: a normal `SELECT` sees committed data as of that statement. Repeatable Read keeps a stable transaction snapshot; Serializable may reject a conflicting transaction that must be retried. PostgreSQL treats Read Uncommitted as Read Committed. Stronger isolation is not a replacement for explicit stock conditions and carefully scoped locks. See [transaction isolation](https://www.postgresql.org/docs/17/transaction-iso.html) and [row locks](https://www.postgresql.org/docs/17/explicit-locking.html).

In this project's refresh flow, `AuthService.rotate()` locks a token row and serializes operations for one `family_id` with a transaction-scoped advisory lock. A replay revokes active family tokens **inside** the transaction, returns a result, and throws HTTP `401` only **after commit**. Throwing before commit would roll back the security update. The cleanup job uses `FOR UPDATE SKIP LOCKED` for bounded concurrent deletion; it has a different purpose from the refresh request lock.

## Lab 3: SQL tuning without slogans

Measure an actual slow endpoint first: record latency, query count, returned rows, and SQL. Use `EXPLAIN (ANALYZE, BUFFERS)` for a representative query; compare estimated and actual rows, scan/join type, sort, and buffers. Check missing filters, pagination, N+1 ORM queries, stale statistics, and then add or change an index. Re-run the same measurement after each change. For workload-wide diagnosis, `pg_stat_statements` is useful but must be configured on the server first. See [EXPLAIN](https://www.postgresql.org/docs/17/using-explain.html) and [pg_stat_statements](https://www.postgresql.org/docs/17/pgstatstatements.html).

**JOIN is not always faster than a subquery.** An `EXISTS` subquery answers “does at least one row exist?” without multiplying outer rows. A JOIN is useful when columns from both relations are needed; joining a user to many refresh tokens may duplicate the user unless the query handles that intentionally. PostgreSQL can rewrite many subqueries during planning. Compare plans for equivalent *results*, not syntax alone. See [subquery expressions](https://www.postgresql.org/docs/17/functions-subquery.html) and [planner behavior](https://www.postgresql.org/docs/17/explicit-joins.html).

**An index is not free.** The composite-index leftmost-column rule is a starting point, not a universal promise that every query uses the index. For the future product list, test a candidate index matching the status filter and `created_at DESC, id DESC` order against real data volume; for SKU lookup, use its unique index. PostgreSQL stores ordinary rows in a heap. A primary-key index does not make the table permanently “clustered” as in some other DBMSs. `CLUSTER` physically reorders a table once; later writes do not preserve that order. See [indexes](https://www.postgresql.org/docs/17/indexes.html), [multicolumn indexes](https://www.postgresql.org/docs/17/indexes-multicolumn.html), and [CLUSTER](https://www.postgresql.org/docs/17/sql-cluster.html).

## Later project exercises

| Interview topic | Project exercise | Key distinction |
|---|---|---|
| 1NF–3NF | Separate product, inventory balance, movement, and order-line facts. | Avoid duplicated mutable facts; keep intentional order price snapshots. |
| Function vs procedure | Compare a SQL function called by `SELECT` with a procedure called by `CALL`. | In PostgreSQL, procedure transaction control has invocation restrictions; the NestJS service still owns the business flow. |
| Millions of inserts / slow `insertAll` | Import synthetic movement history into a disposable table using `COPY`, then compare bounded multi-row batches. | Network round trips, per-row ORM work, indexes, constraints, WAL, and huge transactions can dominate. |
| Queue consistency | When orders/events exist, commit the order and outbox record in one DB transaction; publish asynchronously and deduplicate by event ID in the consumer. | Critical stock reservation stays strongly consistent in PostgreSQL; external delivery is eventually consistent. |
| Optimistic vs pessimistic locking | Compare version-checked update with `SELECT FOR UPDATE` for inventory reservation. | Choose based on contention and retry behavior; neither fixes missing invariants. |
| Partition, replica, shard | Revisit after measuring large movement tables or read traffic. | Partitioning, read replicas, and sharding solve different scaling problems and add operating cost. |
| DI in NestJS | Locate injected repositories, `DataSource`, and `ConfigService` in `AuthService`. | DI separates construction from behavior; it does not itself make SQL faster. |

For bulk loading, PostgreSQL recommends `COPY` for large data sets; if `COPY` is unsuitable, start with bounded batches and benchmark them. For function/procedure behavior, see [CREATE FUNCTION](https://www.postgresql.org/docs/17/sql-createfunction.html) and [CREATE PROCEDURE](https://www.postgresql.org/docs/17/sql-createprocedure.html). For bulk loading, see [Populating a Database](https://www.postgresql.org/docs/17/populate.html).

## Interview answer template

> “I first measured the endpoint and inspected its SQL with `EXPLAIN (ANALYZE, BUFFERS)`. For concurrent stock reservation I used a conditional update inside a PostgreSQL transaction, so only requests that still satisfy `available >= quantity` succeed. The refresh-token flow taught me that a security update must commit before the API returns an error. I would add indexes or a queue only after identifying the workload and its consistency requirement.”
