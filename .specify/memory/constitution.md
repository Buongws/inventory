<!--
Sync Impact Report
Version: template → 1.0.0 (initial repository adoption)
Principles: scope/contracts; service boundaries; data integrity; simple code; verification.
Added: stack constraints, development workflow, governance.
Templates updated: plan-template.md, spec-template.md, tasks-template.md.
No deferred constitution placeholders.
-->
# Inventory Learning Constitution

## Core Principles

### I. Define Behavior Before Implementation

Features MUST specify observable outcomes, authorization, error cases and scope before coding.
One feature specification MUST cover all affected API, Gateway, frontend and database layers.
Existing specs in `docs/` remain reference material until explicitly replaced with a linked artifact.
Plans MUST distinguish verified current behavior from intended behavior and known gaps.

### II. Preserve Service Boundaries

The API owns business rules, authentication and authorization. Gateway owns proxying and rate
limiting. Frontend uses the shared Axios client and Redux session model. Changes MUST preserve
these boundaries unless an explicit architecture decision justifies an exception.
Do not introduce a worker, queue or generic abstraction without a concrete requirement.

### III. Protect Data Integrity

Database names MUST use snake_case with explicit mappings from camelCase TypeScript properties.
Applied migrations MUST NOT be edited; schema changes require new migrations and rollback notes.
TypeORM synchronization MUST remain disabled. Use database constraints and parameterized queries.
New timestamps use timestamptz; converting legacy data requires a documented timezone assumption.
Transaction errors roll back mutations: security actions MUST be committed before reporting them.

### IV. Keep Code and Configuration Understandable

Use strict TypeScript and existing feature modules. Controllers stay thin; services hold business
logic. Shared Prettier and ESLint conventions MUST be followed. Configuration MUST be validated
at startup; credentials MUST stay outside tracked files and logs. Do not widen a feature into an
unrequested architectural rewrite.

### V. Report Verification Honestly

Affected applications MUST pass lint, format checks, typecheck and build. Run relevant existing
tests and use runtime checks appropriate to the change. New tests follow feature requirements;
explicit requests not to add tests MUST be respected and verification gaps documented.
Never claim a smoke check, build or unchecked checklist proves a complete integration flow.

## Stack and Repository Constraints

Node.js 24; NestJS API and Gateway; PostgreSQL/TypeORM; Redis; Next.js/React; Axios; Redux Toolkit.
Root npm scripts orchestrate independent packages and lockfiles; npm workspaces are not enabled.
Local ports: API 3001, frontend 3002, Gateway 3004.
Current access tokens persist in localStorage; refresh tokens remain HttpOnly cookies.
Changing this contract requires an explicit feature decision.
See `docs/conventions/` for layer-specific details and `AGENTS.md` for contributor commands.

## Development Workflow

Use Specify → Clarify (when needed) → Plan → Tasks → Analyze → Implement → Converge.
Create new feature artifacts under `specs/<number>-<feature>/`; maintain shared guides in `docs/`.
Plans MUST name affected layers, contract compatibility, schema/config changes and validation.
Tasks MUST use actual paths (`apps/api/src`, `apps/gateway/src`, `apps/web/app`, `apps/web/lib`), with clear
acceptance criteria. UI work is not implied by a backend-only specification.
Run `npm run check`, `npm run build` and relevant existing tests. Record outcomes and limitations.

## Governance

Amend this constitution alongside dependent templates and contributor guidance. Record rationale
and update version/date: major for incompatible principles, minor for new requirements, patch for
clarifications. Review feature plans against these principles; document justified deviations.
Explicit user scope takes precedence over repository defaults. Keep generated artifacts and
implementation consistent without retroactively claiming unfinished features are complete.

**Version**: 1.0.0 | **Ratified**: 2026-09-25 | **Last Amended**: 2026-09-25
