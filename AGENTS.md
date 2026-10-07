# Repository Guidelines

## Project Structure & Module Organization

This repository contains three independently installed Node.js applications. `apps/api/src/` holds NestJS authentication, health checks, scheduled jobs, entities, and migrations. `apps/gateway/src/` handles proxying and Redis rate limits. `apps/web/app/` contains Next.js routes, `components/` contains UI, and `lib/` contains Axios and Redux session code. Styles live in `apps/web/app/globals.css`. Add API tests under `apps/api/test/` as features are implemented.

Shared documentation belongs in `docs/`; new feature artifacts belong in `specs/<number>-<feature>/`. `.specify/` and `.agents/skills/` contain Spec Kit configuration and Codex skills. Read `.specify/memory/constitution.md` and the relevant `docs/conventions/` guide before implementation.

## Required Spec Kit Workflow

Follow the official skills in this order: `$speckit-constitution` → `$speckit-specify` → `$speckit-clarify` → `$speckit-plan` → `$speckit-tasks` → `$speckit-analyze` → `$speckit-implement` → `$speckit-converge`. Constitution establishes project rules; an existing completed constitution need not be regenerated for every feature.

The user invokes these skills in Codex chat. Read and follow the invoked skill's `SKILL.md`; do not substitute manual artifact edits for a completed skill run or claim a skill ran when it did not. Respect the user's current step and continue to the next only when requested. Existing draft files are inputs to review, not proof of workflow completion. Do not implement during specify, clarify, plan, tasks, or analyze. Preserve feature artifacts and record actual outcomes. Repeat implement/converge when convergence identifies unfinished work.

## Build, Test, and Development Commands

Use Node.js 24. Run `npm ci` at the root and in each application; the root is a command runner, not an npm workspace.

- `npm run dev`: start API on 3001, frontend on 3002, and Gateway on 3004. PostgreSQL and Redis must already be available.
- `npm run check`: run lint, formatting checks, and typechecking across all applications.
- `npm run build`: build all three applications.
- `npm run format`: format application source files.
- `npm test`: run the API Jest suite when tests are present.
- `npm --prefix apps/api run migration:run`: apply pending migrations.

## Coding Style & Naming Conventions

Use strict TypeScript, two-space indentation, double quotes, and semicolons; Prettier controls formatting. ESLint checks TypeScript and Next.js conventions. Use PascalCase classes/components, camelCase properties/functions, and kebab-case filenames such as `refresh-token-cleanup.service.ts`.

Keep controllers thin and business logic in services. Use explicit snake_case database column mappings. Never edit applied migrations or enable TypeORM synchronization. Frontend requests go through Gateway and the shared Axios client.

## Frontend Design and Simplicity

Apply these preferences to all future frontend features. Use a left sidebar and right content area for management pages. Prefer Ant Design Table, Form, pagination and modal/drawer components when introducing the admin UI. Place a product search form above the product list; each row has an Inventory action button to open stock details, history and receipt/issue actions. Keep spacing, labels and loading/empty/error states clear.

Use simple typed components and existing Axios/Redux infrastructure. Keep single-use handlers local; extract helpers or hooks only for concrete reuse or substantial isolated logic. Avoid speculative utils, generic frameworks, redundant state, trivial wrapper functions and unjustified memoization. Use library behavior rather than rebuilding it. Search and pagination must follow server contracts: do not present filtering of one loaded page as full-catalog search. Specify any backend search extension before implementation. Do not install libraries or change feature artifacts merely to record these conventions.

## Testing Guidelines

Jest with ts-jest discovers `apps/api/test/**/*.spec.ts`. No coverage threshold is configured, and the frontend and Gateway currently have no automated suites. Follow feature-specific verification requirements, respect explicit requests not to add tests, and record omitted checks. Build success alone does not verify runtime behavior.

## Commit & Pull Request Guidelines

No commits exist yet, so no historical convention is established. Use concise imperative messages, preferably `feat:`, `fix:`, or `docs:`. PRs should describe behavior, link the feature spec or relevant issue, list verification results and migration implications, and include screenshots for UI changes.

## Security & Configuration

Keep secrets in ignored `.env` files. Update environment examples when configuration changes. Never log tokens, cookies, or credentials.
