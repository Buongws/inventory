# Authentication Specification

Inventory supports email/password authentication and Google OpenID Connect. Both flows issue the same Inventory API access token; business APIs do not depend on the login method.

## Email and password

1. `POST /api/v1/auth/register` validates a password of at least 12 characters and creates a `customer`.
2. `POST /api/v1/auth/login` returns an access token in JSON and sets the `inventory_refresh` HttpOnly cookie.
3. Clients send `Authorization: Bearer <accessToken>` to protected APIs. Access tokens expire after 15 minutes.
4. `POST /api/v1/auth/refresh` rotates the refresh token and returns a new access token.
5. `POST /api/v1/auth/logout` revokes the current refresh token and clears the cookie. `GET /api/v1/auth/me` returns the authenticated user.

Refresh tokens are random values. PostgreSQL stores only their SHA-256 hashes. A reused revoked token revokes the active tokens in its `family_id`.

## Google SSO

The browser starts at `/auth/google/start`. The API stores one-time state, nonce, and PKCE data in Redis, verifies the Google ID token, then sets the refresh cookie and redirects to the frontend callback. The frontend calls `/auth/refresh` and stores the Inventory access token locally.

The local callback is `http://localhost:3004/api/v1/auth/google/callback`. Google identity is keyed by `provider + subject`; email is not an identity key. A Google email matching a password account is not merged automatically. The user must authenticate to the existing account and call `POST /api/v1/auth/google/link/start`.

## Frontend session rules

The web app stores the access token and user in `localStorage`, then hydrates Redux on startup. It refreshes only when the token is expired/about to expire or a protected request returns `401`; concurrent refreshes share one promise. Refresh tokens remain HttpOnly cookies.

See [Google SSO](GOOGLE_SSO.md) and the [web app guide](../../apps/web/README.md).
