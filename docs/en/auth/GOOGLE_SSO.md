# Google SSO Setup

Google is used for OpenID Connect identity only. The requested scopes are `openid email profile`; Google access and refresh tokens are not stored.

## Google Cloud setup

1. Create a development project in Google Cloud.
2. Configure the consent screen as External and add development accounts as Test users.
3. Request only `openid`, `email`, and `profile`.
4. Create an OAuth client of type **Web application**.
5. Add this exact redirect URI:

```text
http://localhost:3004/api/v1/auth/google/callback
```

The scheme, host, port, path, and trailing slash must match `GOOGLE_REDIRECT_URI` exactly.

## Environment

```env
GOOGLE_CLIENT_ID=...apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3004/api/v1/auth/google/callback
```

Never commit credentials. Restart API, Gateway, and web after changing environment variables. Open `http://localhost:3002/login`, choose Google, and use a configured Test user.

## Security flow

The API uses authorization code + PKCE, one-time Redis state, a browser-bound state cookie, and a nonce. The ID token must pass signature, issuer, audience, expiry, nonce, and `email_verified` checks. No access token is placed in a URL.

If the Google email belongs to a password account, the sign-in returns a conflict. Authenticate with the existing account and use the explicit link endpoint. A `redirect_uri_mismatch` means the Google Console URI and `.env` value differ.
