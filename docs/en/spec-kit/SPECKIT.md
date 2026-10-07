# Using Spec Kit in Inventory Learning

Spec Kit is already installed for this repository. Version `0.14.3` is configured once at the repository root with the Codex skills integration. The project constitution is [`../../.specify/memory/constitution.md`](../../.specify/memory/constitution.md); the skills are in [`../../.agents/skills/`](../../.agents/skills/). Do not initialize separate projects inside `apps/api`, `apps/gateway`, or `apps/web`.

## Verify the setup

Run these terminal commands from the repository root:

```sh
specify version
specify integration status --json
```

The expected default integration is `codex`, with no missing managed files. A `warning` status is expected in this repository because `spec-template.md`, `plan-template.md`, and `tasks-template.md` were deliberately customized for the API, Gateway, frontend, and database. Review those changes before any Spec Kit upgrade; do not use `specify integration upgrade --force` just to silence the warning. If `specify` is unavailable on a new machine, install the pinned CLI with `uv tool install specify-cli==0.14.3`.

## Start a feature

Open this repository as the Codex project so it can read `.agents/skills/`. Invoke the skills in **Codex chat**, one step at a time. They are not shell commands. Codex uses the `$speckit-...` spelling.

```text
$speckit-specify Implement product CRUD from docs/catalog/PRODUCT_SPEC.md. Include the affected API and database contracts, authorization, errors, and acceptance criteria. Keep unrelated frontend and Gateway work out of scope.
$speckit-clarify
$speckit-plan
$speckit-tasks
$speckit-analyze
$speckit-implement
$speckit-converge
```

Review the output after each step. Use `clarify` when a decision materially changes behavior or scope. `analyze` checks consistency before implementation. After `implement`, run `converge`; if it appends unfinished tasks, run `implement` again and repeat until it reports convergence. Use `$speckit-checklist` for an additional requirements checklist when the feature warrants one. The constitution is already written, so `$speckit-constitution` is only needed when project principles change.

`$speckit-specify` creates one numbered directory such as `specs/001-product-crud/` and writes `spec.md`. Subsequent steps add `plan.md`, `research.md`, `data-model.md`, `contracts/`, `quickstart.md`, and `tasks.md` as applicable. `.specify/feature.json` points later skills to the active feature. Keep one feature's BE, FE, Gateway, and DB decisions in that same directory; omit layers the feature does not affect.

## Apply the repository conventions

- Write canonical feature artifacts and shared docs in English. Keep Vietnamese explanations under `docs/vi/<topic>/`; update both languages when a shared contract changes.
- Use [`../../AGENTS.md`](../../AGENTS.md) and [`../conventions/`](../conventions/) for commands, naming, and boundaries. API owns business rules; Gateway owns rate limits; web calls the Gateway through its shared Axios client.
- In the plan, name real paths under `apps/api/`, `apps/gateway/`, and `apps/web/`. Document endpoint and Postman changes, migration and rollback, environment variables, authorization, and failure cases where relevant.
- Before marking tasks complete, run `npm run check`, `npm run build`, and relevant tests or runtime checks. Record what passed and any unverified scenario in the feature's `quickstart.md` or implementation report.

Existing topic documents in `docs/` are reference material. A new feature should link to them and describe the exact change in its own `spec.md`; do not claim that an existing design has already been implemented.

## Maintaining Spec Kit

When changing project rules, update the constitution and the dependent templates together. Check integration health again with `specify integration status --json`. For a new version, review the [official upgrade instructions](https://github.github.io/spec-kit/installation.html) and the local template changes before upgrading the pinned CLI or managed files.

Official references: [Spec Kit](https://github.com/github/spec-kit), [Codex integration](https://github.github.io/spec-kit/reference/integrations.html), and [existing projects](https://github.github.io/spec-kit/guides/existing-projects.html).
