# Database Convention

- PostgreSQL is durable storage; TypeORM synchronization remains disabled.
- Tables and columns use `snake_case`; TypeScript properties use `camelCase` with explicit mappings.
- New IDs use UUID and new timestamps use UTC `timestamptz`.
- Enforce invariants with unique, check, and foreign-key constraints. Add indexes for measured queries.
- Parameterize user input and escape search wildcards when the contract treats `%` and `_` literally.
- Never edit an applied migration. Create a new migration and document data conversion and rollback limits.
- Keep atomic writes on the same transaction manager/connection. Session advisory locks must be released on that connection.
