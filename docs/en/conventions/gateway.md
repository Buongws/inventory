# Gateway Convention

- Gateway runs on 3004 and proxies API 3001; web runs on 3002.
- Gateway owns routing and rate limiting. Business logic, authentication, and authorization remain in the API.
- PostgreSQL policy configuration loads at startup; Redis stores atomic TTL counters.
- Do not trust arbitrary `X-Forwarded-For` headers. Configure trusted proxies explicitly before using them.
- Preserve request bodies, authorization headers, cookies, `Set-Cookie`, and response error contracts.
- Document Redis outage behavior, `429` headers, CORS, health, and preflight behavior for Gateway changes.
