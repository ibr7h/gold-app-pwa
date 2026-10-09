# User quick unlock security review

## Grounded starting point

The handoff mentioned v1.8.4, but inspection on 2026-10-09 found User main
`66c52ad1` and the live `/full/version.json` reporting `full-66c52ad1` (v1.9.0).
PRs #30 and #31 were already merged; frontend had no open PRs. Both main User
build and Pages deployment passed. Backend main is `4bdc63cb`; its main smoke
workflow passed. Backend draft Database V2 PR #1 is unrelated and remains untouched.

This branch retains the completed lock screen and security switches. Changes are
confined to `apps/user` and a dedicated User browser-check workflow. No backend,
Trader, Admin, financial model, currency symbol, Push subscription, migration,
or production deployment change is included.

## Implementation

- Encrypt the existing access/refresh session together using AES-256-GCM, a fresh
  96-bit IV, and origin/application authenticated data. Store only ciphertext in
  AsyncStorage. Store the non-exportable CryptoKey in a separate User IndexedDB
  database. Migrate existing bearer tokens before showing even the lock screen.
- If secure persistence is unavailable, retain the session only in the current
  tab, never fall back to plaintext bearer-token persistence. Account settings
  explain that reopening requires a password.
- Centralize account-bound asynchronous transitions in `UserAuthController`.
  Cached identity is only a lock-screen hint; it never authorizes the workspace.
- Suspend account API reads and writes while locked. After local verification,
  allow only `/auth/me` verification until the expected User identity matches.
- Invalidate late responses and pending device verification on lock, logout,
  account changes, and backgrounding during unlock. Cross-tab session changes
  hide the previous account and close its API gate.
- Serialize PIN checks/updates, using Web Locks between supported tabs and an
  in-tab queue otherwise. Keep five attempts and a persisted 15-minute lockout.
  New salted PIN records use PBKDF2-SHA256 with 600,000 iterations. Existing
  v1 records remain usable and upgrade only after successful verification.
- Require the account password for PIN setup, change, recovery and disabling.
  Step-up refuses a different server identity before replacing any session.
- Request WebAuthn only on a deliberate button tap; verify challenge, origin,
  RP hash, user presence/verification, ECDSA signature and latest counter. Abort
  stale ceremonies and preserve the opted-in switch on temporarily unsupported
  browsers. A separate, labeled biometric action is visible on the PIN screen.
- Keep six-digit setup/confirmation, add keyboard support, focus containment,
  recovery, retry feedback/countdown and the existing Dhahabi visual identity.

## Verification and release gate

Local TypeScript check, 127 User Vitest tests, 8 updater regression tests,
production Expo export and export verifier pass. The dedicated browser workflow
runs the actual export with isolated account fixtures and unavailable prices:
it never writes to production or labels invented prices as market data. Chromium
mobile/desktop and headless WebKit mobile profiles run separately.

`apps/user/scripts/quick-unlock-browser.cjs` covers mobile/desktop layouts,
actual IndexedDB encryption and legacy migration, no automatic passkey request,
wrong/correct PIN, password step-up, confirmation mismatch, recovery, disabling,
server expiry and a virtual platform authenticator with real signed assertions.
Run with an installed Playwright module and the existing export directory:

```bash
PLAYWRIGHT_MODULE=/path/to/node_modules/playwright \
node apps/user/scripts/quick-unlock-browser.cjs /path/to/dist-pwa
```

Browser installation was unavailable locally; browser results must come from
the PR workflow, not be inferred from unit tests. Physical iPhone Safari/PWA,
Android and desktop hardware checks are still required before production release.
Do not merge while required checks fail or those device checks remain unresolved.

## Security boundaries

This is a **local convenience lock for an already authenticated session**, not
server-side MFA, passwordless backend login or a banking-grade hardware vault.
JavaScript/native-app parity must not be claimed:

- WebAuthn user verification may use a biometric, device PIN or device password.
  The site cannot force Face ID, suppress/change the system sheet after a user
  requests it, or read biometric templates.
- A non-exportable browser CryptoKey is not guaranteed to be hardware-backed.
  Encryption prevents raw bearer-token inspection/reuse from copied ciphertext;
  it does not defend against compromised same-origin JavaScript or full browser
  profile compromise. This applies especially to apps sharing the GitHub Pages
  origin. No existing app receives the User key or tokens through this change.
- A six-digit PIN has limited entropy. Client-side retry controls are not a
  server-side security boundary; local settings can be modified by someone who
  controls the browser profile. They are not a substitute for backend authorization.
- Existing backend `/auth/me` validates its JWT, and refresh checks the existing
  server session. The backend currently has no session-revocation/logout endpoint;
  local logout removes local session credentials, but cannot invalidate an already
  stolen JWT on the server. Full server-managed WebAuthn, session revocation and
  hardware-backed secret release need separate backend/native work.

References: [W3C WebAuthn user verification](https://www.w3.org/TR/webauthn-3/#user-verification),
[W3C WebCrypto](https://www.w3.org/TR/webcrypto/),
[OWASP password storage](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html).
