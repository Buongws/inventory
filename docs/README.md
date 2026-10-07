# Documentation

Documentation is grouped by domain. The default documentation is English; Vietnamese translations and the original learning notes are under [`vi/`](vi/).

## Domains

- [Inventory](en/inventory/INVENTORY_SPEC.md): single-warehouse balances, receipts/issues, history and idempotency.

- [`auth/`](auth/): email/password authentication, Google SSO, and account linking.
- [`catalog/`](catalog/): product catalog requirements.
- [`rate-limiting/`](rate-limiting/): Gateway rate limits and refresh-token cleanup.
- [`architecture/`](architecture/): domain and transaction design.
- [`conventions/`](conventions/): backend, frontend, database, and Gateway rules.
- [`operations/`](operations/): validation, local infrastructure, and product demo seeding.
- [`planning/`](planning/): roadmap and milestones.
- [`learning/`](learning/): [interview practice](learning/INTERVIEW.md) and [hands-on PostgreSQL exercises](learning/DATABASE_PRACTICE.md) connected to this repository.
- [`spec-kit/`](spec-kit/): Spec Kit workflow.

New feature artifacts belong in `specs/<number>-<feature>/` and must cover every affected layer.
The `docs/vi/` tree mirrors the English domain folders. Update both language versions when a
shared contract changes.
