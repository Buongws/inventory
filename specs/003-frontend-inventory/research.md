# Research: Frontend Inventory Management

Language: **English** | [Tiếng Việt](vi/research.vi.md)

Date: 2026-10-06. Repository inspection and official documentation/registry metadata, not runtime verification.

## R1 — Next and Ant Design

Decision: Ant Design 6.6.5 + nextjs-registry1.3.0, standard root registry and existing client provider ConfigProvider/App. Rationale: installed Next16.3.6/React19.3.0 satisfy published peer ranges; AntD6 avoids a React19-v5 patch. Alternatives: v5 plus patch, handmade components, custom CSS extraction all add avoidable work. `npm view` reports antd React/DOM>=18; registry Next>=14, antd>=5, cssinjs>=1. Recheck resolved graph during install; metadata compatibility alone is not proven hydration.

Use [official Next integration](https://ant.design/docs/react/use-with-next/) for registry first-screen styles, [v6 guidance](https://ant.design/docs/react/migration-v6/) for React support; no Pages Router `_document` pattern. Keep compound Ant components in client components. Current global button/input/form styling would override library appearance; scope legacy selectors instead of replacing auth UI.

## R2 — Read state

Decision: local useState + effect cancellation/generation checks, direct shared Axios, Ant Form draft. Rationale: existing app has no query/cache library and scope is one screen with three reads. Alternatives: RTK Query/SWR/new Redux slice or generic fetch hook are unnecessary. Abort signals supported by [Axios cancellation](https://axios-http.com/docs/cancellation); stale-response and auth checks still needed even with abort.

## R3 — Movement ownership and auth race

Decision: frozen operation held by page/ref; Axios inventory-only expected actor and retry deadline checked immediately before dispatch and after refresh before replay. Rationale: existing request/response interceptors preserve config but can refresh to another identity; page-level checks alone cannot govern automatic 401 replay or async preflight refresh. Alternatives: bypass interceptor breaks requirement; alter all authentication behavior widens scope. Share existing one-flight refresh/one replay, keep exact serialized body/header and reject mismatched/non-admin session or expired deadline locally. No added storage or auth API.

## R4 — Navigation

Decision: guard every page-owned action via local confirmation and use conditional beforeunload. Rationale: [App Router useRouter](https://nextjs.org/docs/app/api-reference/functions/use-router) exposes navigation, not Pages Router beforePopState; [Link onNavigate](https://nextjs.org/docs/app/api-reference/components/link) can prevent app link navigation when used. Alternatives: universal router monkey-patch/history sentinels or guard dependency promise too much and complicate browser history. Native back/forward/unload remain explicitly best-effort per spec. [Browser beforeunload](https://developer.mozilla.org/en-US/docs/Web/API/Window/beforeunload_event) uses generic text and may not fire.

## R5 — Bounded recovery

Decision: manual one-attempt Retry; honour Retry-After, fallback delay 1/2/4/8/16/30 seconds plus additive jitter0–250ms (cap fallback total30s). Rationale: no infinite loop, no premature retry; Retry-After is not capped to30s. Deadline first dispatch+24h checked on click and before interceptor send. Alternatives: polling or fresh retry keys risk duplicate stock. Unknown outcome remains unknown after later 400/401/403/429/503; terminal matching replay 201/404/stock409 can settle the original command. Key conflict/deadline retain protected unresolved state and permit only reads/reconciliation/confirmed departure.

All design unknowns resolved. Backend contract and five accepted clarify answers remain unchanged.

## R6 — Browser transport

Decision: Next external same-origin rewrite `/api/v1/:path*` to Gateway, shared relative base `/api/v1`; server-only validated GATEWAY_ORIGIN default localhost3004, web env example updated. Rationale: source CORS lacks exposed Retry-After and Gateway-generated429/502 lacks CORS; browser cannot reliably observe required header/errors cross-origin. [Official rewrites](https://nextjs.org/docs/app/api-reference/config/next-config-js/rewrites) support external proxying. Alternative backend CORS change is explicitly excluded; custom proxy route is unnecessary. Verify cookie/Bearer/Retry-After/status and Google start/callback regression manually. For [bfcache pageshow](https://developer.mozilla.org/en-US/docs/Web/API/Window/pageshow_event), discard on pagehide and clear/refetch on persisted return; never restore/resend operation.

## Outcome provenance, operation lifetime and authentication precedence

These rules resolve I1/U1/U2/I2 without changing backend behavior or the five clarify decisions.

- A validated response to the original frozen product/key/payload with status 201, PRODUCT_NOT_FOUND 404, INSUFFICIENT_STOCK 409 or STOCK_LIMIT_EXCEEDED 409 is a terminal operation result under the backend contract, including replay. It settles earlier uncertainty. No replay marker/header is required or invented. An unrecognized 404/409 body is not proof of a terminal result. A terminal stock rejection resets quantity/reason, retains type and reloads stock per Q5; a terminal success follows Q3. Errors that only reject the current retry attempt (validation/authentication, rate limit, timeout or local dispatch guard) cannot settle an earlier uncertain operation. A terminal replay is not such an attempt-only rejection.
- Each local operation owns an AbortController/lifetime signal; every initial POST and automatic/manual replay uses that same signal, with actor/deadline metadata. Check cancellation before starting refresh, after every awaited refresh, immediately before initial dispatch and immediately before replay. Confirmed close/departure, pagehide or unmount marks the operation discarded and aborts its signal before clearing references or executing navigation. Do not cancel the shared refresh promise needed by other requests; its completion must not dispatch a discarded operation. No new generic cancellation framework. Cancellation only stops future frontend dispatch/client waiting; a POST already dispatched may have committed and cancellation does not prove rollback.
- Separate attempt completion from UI publication. A matching attempt ID and live operation always releases its sending/latch in finally, regardless of current authorization. Do not release a newer attempt's latch. Record terminal result or recovery/auth state privately in mounted-page memory even when data cannot be shown. Publish payload/catalog/history/result and run refresh reads only for the authorized original admin and current selection/generation. If access is absent, retain hidden operation information per Q1, with no stuck sending; an unknown result remains recoverable. A privately known terminal result settles recovery, but remains hidden; after original-admin restoration apply its reset/refresh once without another POST. An operation discarded in the meantime receives no update and cannot affect a new operation.

Authentication decision precedence (evaluate provenance, not HTTP status alone):

| Situation | Required result |
|---|---|
| Refresh fails before any movement POST dispatch | Known not dispatched for this attempt. Release latch, retain same mounted operation/key/payload in auth-blocked state under Q1, hide protected data, guarded sign-in; original-admin restoration may retry. Do not introduce uncertainty unless an earlier attempt was uncertain. |
| Actual movement POST returns server 401/403 | This attempt was rejected, not a terminal inventory result. If no refresh failure and no earlier uncertainty, retire as a definite access rejection; show no protected data while access is denied. If earlier uncertainty exists, retain recovery and that uncertainty. A 401 may enter the existing one-refresh/one-replay path; do not finalize before that path finishes. |
| Refresh fails after movement POST returned 401 | Preserve the server-401 provenance: this attempt was rejected, but Q1 takes priority over the generic initial-401 retirement rule. Release latch, keep same mounted operation in auth-blocked state and guarded login. Preserve earlier uncertainty if present; no replay after failed refresh. |
| Retry starts with previous uncertainty | Current-attempt preflight failure, 400/401/403, refresh failure, 429/503 or cancellation cannot prove original failure. Keep uncertainty/key/payload until a recognized terminal result, or explicit confirmed discard. |

Manual scenarios: delay preflight refresh, confirm close/departure then finish refresh → zero movement dispatch; delay post-401 refresh, confirm departure then finish refresh → zero replay (the first rejected POST may exist). Repeat cancel-confirmation → same operation remains eligible. Complete POST success/error while access is lost or another actor is present → latch released, no protected publication or reads; restore original admin → known terminal result applied without POST, unknown result offers same-key retry. Exercise all four authentication rows with and without prior uncertainty. Observe real outgoing requests and distinguish temporary display fixtures from real backend outcomes; add no automated tests.
