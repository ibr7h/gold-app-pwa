# User iPhone: offline boot, EUR, percentage tax — 2026-10-24

Baseline: `v1.9.89` / `fdfbf169e3653a3f1fc6e7648c2674ae1dab6af7`.
Restore branch: `restore/iphone-v1.9.89-20261024-pre-offline-eur-vat`.

## Offline boundary

- Install/open the updated PWA online once so its reviewed worker can finish precaching.
- A generated same-release manifest covers the real Expo entry, CSS, bootstrap,
  bundled fonts/images and referenced icons/manifest; missing dependencies fail the release.
- Publish the reviewed worker source on every release instead of restamping an old worker.
- Cold offline reopen offers a separate public calculator and dated saved public quotes.
  It does not expose cached profiles/portfolios or create an authenticated server session.
- Manual gram-price input works when no quote has ever been saved. Never invent a zero/live quote.
- Private data and writes still require normal server authorization. PIN, Face ID,
  session replacement, revocation and encrypted vault logic are unchanged.
- Version metadata remains network-only. Bootstrap fallback only uses its matching release cache;
  another release's cached code is never selected.

## EUR

- Current EUR gold uses `https://api.gold-api.com/price/XAU/EUR` directly, a public
  key-free endpoint. Convert its EUR ounce price to grams and karats, with full precision.
  Use the response's `exchangeRate` only for presentation of cross-currency purchase costs.
- This User-only fix does not deploy or change the backend. Browser requests omit credentials
  and referrers; the authenticated application client is never used for the external provider.
- Current EUR is independent of Frankfurter availability. Frankfurter remains only for
  historical-date conversions; today's rate is never applied to the entire historical chart.
- Direct quote transport has a 30-second memory cache, single-flight deduplication, an
  absolute eight-second deadline and 16-KiB response limit. Reject wrong currencies/metals,
  invalid prices/FX, future, backward or over-four-day-old observations. A weekend quote
  keeps its original time and the existing freshness/market-closed labels.
- The packaged CSP narrowly allows `https://api.gold-api.com` and `https://api.frankfurter.dev`.
  No wildcard, upstream gold-provider key or auth token.
- Eight-second abort, single-flight fetch, omitted credentials and validated public daily cache.
- Retain dated observations; reject invalid/stale rates and a wrong USD base.
- FX failure cannot relabel USD chart points as EUR or fabricate a conversion.
- Packaging security audit verifies that both reviewed origins are allowed by every HTML CSP.

## Percentage tax

- Optional input from 0 to 100 percent, default 0; user can enter 15 or another percentage.
- Tax = (gold value + total workmanship) × percentage / 100, retaining full precision.
- Example: 300 × 10 g + 20 × 10 g; 15% gives 480 tax and 3680 total.
- This is a calculator estimate, not a legal determination of tax eligibility.
- Existing purchases, invoices, sharing layout, application identity and account data are not migrated.

## Evidence gates

- 30 Node updater/offline-manifest/worker tests passed locally, zero skips.
- New unit tests cover percentage arithmetic, public-cache privacy and EUR transport.
- PR preflight builds the fresh Expo output, applies the exact release packaging and security audit,
  then runs a real Chromium CSP probe and cold offline reopen with networking disabled.
- Browser test uses only a localhost fixture, a public quote fixture and a test-only PWA display-mode
  signal. No production login. Chromium automation is NOT a physical iPhone/Face ID acceptance test.
- A separate fully mocked account context exercises the actual online User calculator: direct
  EUR 100/gram remains available while historical FX is down; 15% on 1200 yields 180 tax and 1380 total.
- Production verification and an actual iPhone airplane-mode reopen remain separate checks.
