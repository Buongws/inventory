# Inventory Auth Web

Next.js client for the Inventory API. Email/password login and Google SSO both go through the Gateway. The access token and user are stored in `localStorage` and hydrated into Redux Toolkit at startup. The refresh token remains in an `HttpOnly` cookie managed by the backend.

## Run locally

```sh
cp .env.local.example .env.local
npm ci
npm run dev
```

Open `http://localhost:3002/login`. The Gateway must run at `http://localhost:3004`, the upstream API at `http://localhost:3001`, and the backend `.env` must contain `APP_ORIGIN=http://localhost:3002`.

## Axios and session

- On startup, the session bootstrap reads `localStorage`. A valid token is loaded into Redux without refreshing; an expired token calls `/auth/refresh`.
- The request interceptor reads the access token from Redux or `localStorage`. When the JWT has less than five seconds remaining or is expired, a shared `refreshPromise` obtains and stores a new session before sending the request.
- The response interceptor handles a 401 by calling `/auth/refresh` with the cookie, updating Redux, and retrying the original request once. This covers tokens rejected slightly earlier by the server.
- If refresh fails, the interceptor clears Redux and `localStorage`; the dashboard redirects to login.
- The Google button sends the browser to the backend. After Google authentication, the backend redirects to `/auth/callback`, where the frontend refreshes the session and opens the dashboard.

## Toast notifications

Import `appToast` from `lib/toast` for notifications. Supported methods are
`success`, `warning`, `error`, `info`, and `unknown` (a neutral toast for an
undetermined result). For example: `appToast.success("Giao dịch đã được ghi nhận.")`.
The shared `AppToastContainer` is mounted once in `AppProvider`; position, theme,
and dismissal defaults are configured in `lib/toast.tsx`.

## Tailwind CSS

Tailwind CSS v4 uses `@tailwindcss/postcss` in `postcss.config.mjs`. Theme and
utilities are imported in `app/globals.css`, with source detection scoped to this
web app. Preflight is omitted to preserve existing base styles and Ant Design.

Use utility classes directly in JSX, for example:

```tsx
<div className="flex items-center gap-4 p-4">Content</div>
```

Existing CSS outside layers takes priority over layered utilities for the same
property. When migrating an existing element, remove the corresponding legacy
rule or move it into an appropriate layer. With Preflight disabled, specify
`border-solid` when using border-width utilities on native elements.
