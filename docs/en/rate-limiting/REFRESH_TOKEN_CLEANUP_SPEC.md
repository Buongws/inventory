# Refresh Token Cleanup Specification

Cleanup runs inside the NestJS API as a scheduled maintenance job. It does not run in the login or refresh request path.

```text
Nest scheduler → dedicated PostgreSQL connection → advisory lock → batch delete
```

Default configuration:

```env
REFRESH_TOKEN_CLEANUP_ENABLED=true
REFRESH_TOKEN_CLEANUP_CRON="0 0 * * * *"
REFRESH_TOKEN_CLEANUP_BATCH_SIZE=1000
REFRESH_TOKEN_CLEANUP_MAX_BATCHES=20
REFRESH_TOKEN_CLEANUP_RETENTION_DAYS=0
```

The six-field cron expression runs at the start of every UTC hour. The job keeps revoked tokens until `expires_at` so refresh-token replay detection still works. It deletes only expired records, in bounded batches using `idx_refresh_tokens_expires_at` and `FOR UPDATE SKIP LOCKED`.

Every API instance may wake up, but a PostgreSQL advisory lock lets only one instance clean. A failed job logs the error, releases its connection, and leaves the API serving traffic; the next scheduled run retries the backlog. Configuration changes require an API restart.
