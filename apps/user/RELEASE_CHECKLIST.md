# User iPhone release evidence — 2026-10-24

## Canonical source — no migration performed

- Active repository: `ibr7h/gold-app-pwa`.
- Active release branch: `preview/iphone-render`.
- User source: `apps/user/overrides` plus its reviewed archived Expo base and User scripts.
- Published output: `_render_preview/gold-app-pwa/full`.
- Production service: `dhahabi-user-iphone-preview` / `srv-db4lpls9v7es73aa2pug`.
- User-facing origin: `https://app.dhahabk.com/gold-app-pwa/full/`.
- Baseline: `v1.9.87` / `5ec03e2b9d7c809c9a9efbc8e1b172ba8b178d29`.
- Restore branch: `restore/iphone-v1.9.87-20261024-pre-release-gates`.
- `ibr7h/dhahabk-user` is a separate, earlier source snapshot, NOT the service's current
  release source. Do not deploy it or move the service without an explicitly reviewed migration.
- This application is Expo/React Native Web PWA, not a validated Flutter/iOS native build.

## Corrected gates

- All `web/tests` run in PR preflight and release build, including quick PIN, device-session
  renewal, biometric cancellation, session fencing, vault recovery, and Push UI checks.
- Every User override/script change triggers the release build, not only an enumerated subset.
- Source-reading tests use `fileURLToPath`, so archived paths containing spaces work.
- Compiled layout/version tests already run inside the release workflow after version advancement.
  Absence of a separate layout workflow on a commit is NOT proof they were omitted.
- Security audit, current-source tests, update/offline tests and static export remain release gates.
- No UI design, account data, session keys, biometric credentials or production assets are changed
  by this PR. No forced version increment is needed just to fix test infrastructure.

## Evidence

- [x] 334 User tests in 34 files passed locally, zero skips.
- [x] 25 updater/offline tests passed.
- [x] Existing compiled-output/version/layout checks passed across 26 preview routes.
- [x] Bundle/source-archive security audit passed.
- [ ] Successful PR preflight for the exact proposed head.
- [ ] Real iPhone acceptance: forgotten PIN, full session expiry, Face ID cancellation/retry,
  second-device replacement, and Push rebinding.

Do not label a simulated WebAuthn test as proof that actual iPhone Face ID was exercised.
Do not publish changes to Admin or Trader as part of this User-only remediation.

## Static-asset packaging regression found after Render publication

- The `v1.9.88` smoke check found two obsolete CSS filenames referenced by all
  26 retained HTML shells. Render was live, but that was not proof the assets were complete.
- Packaging now refreshes every hashed Expo CSS link and removes chunks the current
  export no longer emits. It never restores old bundles or changes the install/auth gates.
- PR preflight executes the same packaging step as the release job, using its fresh export.
- The release fails before publishing if a local stylesheet, script, gated `data-entry`,
  manifest or icon is missing or empty. The final versioned output is checked again.
- 15 regression tests pass, including reproducing a missing CSS failure. A local dry run
  with the committed Expo assets verifies 26 pages and 12 distinct assets with zero broken references.
- After a new release, compare `version.json` and entry assets on both the Render hostname
  and `app.dhahabk.com`; do not treat a queued or merely `live` deployment as acceptance.

Run the packaging guard locally with:

```sh
python3 -m unittest discover -s scripts -p test_iphone_static_assets.py
python3 scripts/iphone_static_assets.py _render_preview/gold-app-pwa/full
```
