# Gateway Rate-Limit Specification

Local traffic flows through `Frontend :3002 → Gateway :3004 → API :3001`. The Gateway owns abuse protection and proxying; the API remains responsible for authentication, authorization, and business rules.

Redis stores distributed fixed-window counters. PostgreSQL stores enabled policy configuration and is read when the Gateway starts. Policy changes require a Gateway restart/deployment because limits change rarely.

| Policy | Subject | Default |
|---|---|---:|
| `global-ip` | IP | 120 requests / 60 seconds |
| `auth-login-ip` | IP | 10 / 60 seconds |
| `auth-register-ip` | IP | 5 / 60 seconds |
| `auth-refresh-ip` | IP | 30 / 60 seconds |
| `google-oauth-ip` | IP | 20 / 60 seconds |
| `product-write-user` | verified JWT `sub` | 30 / 60 seconds |

Lua performs read/check/increment atomically. A rejected request does not increment or extend TTL. Keys use environment, policy, subject type, and normalized subject. The Gateway does not trust arbitrary `X-Forwarded-For` headers in local mode.

Health, documentation, and `OPTIONS` are exempt. Limit violations return `429`, `RATE_LIMIT_EXCEEDED`, and `Retry-After`. If Redis is unavailable, a tighter per-instance emergency limiter is used and the response carries `X-Rate-Limit-Mode: emergency`.
