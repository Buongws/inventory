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
