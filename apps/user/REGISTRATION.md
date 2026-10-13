# Required mobile number and email verification

User signup requires a mobile number, normalized to E.164 syntax. Saudi local numbers and Arabic/Persian digits are accepted; international numbers need an explicit `+` country code. The account is created only after the server validates a six-digit email code. Email verification does not verify ownership of the mobile number.

The form checks `/auth/registration/config` and disables new signup when the service is unavailable. Password login and the deployed quick-unlock experience for existing accounts continue to work. OTP expiry/cooldowns come from the server; resending replaces the registration nonce. No demo code or pre-verification session is accepted. Pending signup and typed codes stay in memory; passwords are cleared from the form after sending. Session authorization still requires `/auth/me` with the User role.

This frontend needs the linked backend registration/Resend change. Configure Resend credentials and a verified sender privately on Render, apply the additive backend registration migration, verify backend readiness, then publish the User frontend. See the backend's `docs/user-registration-resend.md` for activation and rollout details. No Resend key belongs in the frontend.

Regression coverage:

- `overrides/web/tests/registration.test.ts`: phone normalization/validation, anonymous signup requests, malformed or leaking responses, nested backend errors, resend nonce rotation and cancelled verification responses.
- `scripts/browser-registration.py`: real disposable local API/DB signup, required phone, wrong/right/Arabic codes, pending-login rejection, cooldown, provider-unavailable screen, private browser storage and 320–1440px layout.
- Existing `browser-home.py` and `browser-quick-unlock.py` use verified local accounts and cover real prices/holdings, navigation, VAT and encrypted quick unlock.

For browser tests build/export the canonical User overrides and serve the export locally. Start the backend's `scripts/start-registration-fixture.cjs` with a disposable local PostgreSQL database after build/migrations. It captures test mail privately; no real messages are sent. Scripts accept `--site`, `--api` and `--mailbox`; defaults use loopback ports 8082/3001 and `/workspace/.onboarding/registration-mailbox.json`. External targets are rejected. Screenshots of email confirmation are taken with an empty code field; never publish mailbox files, session captures or credentials.
