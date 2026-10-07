# Backend Convention

- Use Node.js 24, NestJS, and strict TypeScript. Keep feature modules under `apps/api/src/`.
- Controllers handle HTTP and DTOs; services own business rules and transactions.
- Keep the `/api/v1` prefix and update Swagger/Postman when contracts change.
- The API must verify JWTs and roles even when the Gateway has verified a token for rate limiting.
- Validate configuration at startup. Never log tokens, hashes, cookies, or credentials.
- Applied migrations are immutable; schema changes require a new migration and rollback notes.
- Background jobs need bounded batches, overlap protection, graceful shutdown, and summary logs.
