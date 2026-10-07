# Validation Notes

The repository targets Node.js 24. Local development uses API port 3001, web port 3002, Gateway port 3004, PostgreSQL host port 55433, and Redis port 6379.

Run the current checks from the repository root:

```sh
npm run check
npm run build
npm test
```

Run PostgreSQL migrations before starting the API. Health endpoints are available through the Gateway at `/api/v1/health/live` and `/api/v1/health/ready`; Swagger is available at `/docs`.

This document records repeatable commands and environment assumptions. It is not a release certification; runtime smoke tests and external Google credentials must be verified separately.
