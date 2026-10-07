# Frontend Convention

- Use the Next.js App Router, React, and TypeScript. Keep browser APIs behind client boundaries.
- Keep UI state local and shared session state in Redux Toolkit.
- Send API requests through `apps/web/lib/api.ts` to Gateway `http://localhost:3004/api/v1`.
- Access token and user persist in `localStorage`; refresh token remains an HttpOnly cookie.
- Refresh only on expiry/about-to-expire or a protected `401`. Share concurrent refreshes and retry once.
- The API remains the authority for roles and permissions.
- Use the Next.js ESLint config matching the installed Next.js major and the shared Prettier rules.

## Management UI and maintainability

- Use a left sidebar and right content area, with a product search form above the product table.
- Prefer Ant Design Table, Form and modal/drawer components for the admin UI; each product row exposes an Inventory action to open stock details, history and receipt/issue controls.
- Handle server pagination with page, page size and total; reset to page one when search changes. Inventory API currently supports page/limit only, so any server search extension requires specification before implementation. Never filter only the visible page and label it full-catalog search.
- Keep single-use handlers and form state near their component. Extract utils/hooks only for demonstrated reuse or meaningful independent logic; avoid trivial wrappers, generic frameworks and speculative abstractions.
- Optimize measured problems. Do not add memoization or duplicated derived state by default. Reuse existing Axios, Redux and library components.
- Show clear labels, spacing and loading/empty/error states. These are ongoing project preferences, not an instruction to implement or install dependencies outside the current Spec Kit step.
