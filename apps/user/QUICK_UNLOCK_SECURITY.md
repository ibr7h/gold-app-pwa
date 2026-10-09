# User quick unlock security

This extends the existing v1.9.0 User interface. Trader/Admin, stored invoices,
purchases, alerts, Push subscriptions, and backend schemas are unchanged.
The separate User retail calculator now estimates 15% VAT on gold value plus total
workmanship when its tax switch is enabled. Intermediate calculations retain full
precision and the existing currency component displays two decimal places.

## Session lifecycle

- Password login and registration keep access/refresh tokens in memory. Without an
  enrolled quick-unlock method, reopening the page requires the account password.
- PIN enrollment creates an AES-GCM encrypted session vault. A random data key is
  wrapped with a non-extractable key derived from the six-digit PIN using salted
  PBKDF2-SHA-256 (210,000 iterations). Origin and account ID are authenticated metadata.
  Tokens, the data key, and the PIN are never stored in plaintext.
- PIN verification keeps the existing independent salted verifier and five-attempt,
  15-minute cooldown. Checks are serialized in the tab and use Web Locks between
  supported tabs. The current PIN is required to change or disable it.
- Supported platform authenticators can wrap the same data key using WebAuthn PRF.
  PRF output is used only after assertion signature, challenge, RP, user verification,
  and counter checks. It is never serialized. Tokens rotate inside the shared encrypted
  payload so PIN and biometric envelopes stay current.
- Biometrics without PRF can unlock a currently open tab. After a restart, that browser
  requires the PIN or account password. Support detection cannot promise Face ID:
  browsers may use a fingerprint, a device PIN, or another platform verification method.
- Starting the app never calls `credentials.create/get`. Only an explicit enrollment
  or unlock tap opens system UI. Pending requests are aborted on logout/new attempts.
- A local factor is insufficient to open account data: `/auth/me` must confirm the same
  User account, with normal backend refresh/authorization. A failed/expired session
  requires password login. Cached identity only labels the lock screen.
- Manual/background lock invalidates in-flight API responses. Logout and a successful
  password login invalidate other tabs; receiving tabs clear their own memory without
  deleting the new tab's persistence. Late login/refresh/unlock results cannot restore
  a signed-out account.
- Successful password login is the recovery path and resets local quick-unlock enrollment.
  Existing legacy plaintext tokens are removed from storage during one-time startup
  migration. Their session can be encrypted after an explicit successful PIN unlock;
  otherwise password login is required after reopening.

## Browser limits

This is a convenience lock, not a new backend authentication factor. A six-digit PIN
has a finite offline search space; browser storage is editable, so a local cooldown
is not a server-enforced security boundary. Same-origin malicious scripts remain a
threat. Backend authorization remains authoritative. A future server-issued credential
or HttpOnly-cookie architecture requires separate backend work and compatibility review.

The Arabic UI explains password fallback and browser limitations. No feature claims
to suppress or restyle the operating system verification sheet after the user requests it.
Physical iOS Safari/PWA, Android and desktop biometric/device testing is still needed
before a release; Chromium automation does not certify those platforms.

## Validation

From the repository's generated User source (existing archive plus reviewed overrides):

```sh
pnpm check
GITHUB_WORKSPACE=/workspace/gold-app-pwa pnpm exec vitest run web/tests
pnpm exec expo export --platform web --output-dir dist-pwa --max-workers 4
```

The User PWA updater tests remain runnable from the repository root:

```sh
node --test apps/user/scripts/user-update.test.cjs
```

For a browser smoke test, serve the packaged User export at its existing base path
and run the disposable local NestJS/PostgreSQL API. Python Playwright and Chromium
must be installed. The test refuses non-loopback targets and forwards API requests
only to the local backend; it never registers users or writes data in production.

```sh
python3 apps/user/scripts/browser-quick-unlock.py
```

This exercises PIN setup/confirmation, reload, wrong/right unlock, change, authenticated
disable, password recovery, absence of automatic WebAuthn requests, and storage checks.
Unit regressions cover vault tampering, account/origin binding, session rotation, PRF
verification, concurrent PIN attempts, expiry, account mismatch, and logout races.
