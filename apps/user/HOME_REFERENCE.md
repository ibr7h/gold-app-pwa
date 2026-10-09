# User home reference

The home screen follows the supplied October 2026 Arabic reference: account greeting,
white 24K price card, four quick services, SAR portfolio summary, compact market chart,
and five mobile tabs. Navy `#001F3F` and gold `#C5A021` / `#D4AF37` remain the identity
colors. The official Saudi Riyal SVG and two-decimal money display are reused.

- The account name is used when available; the current API supplies email instead.
- Price, source, timestamp and chart points come from the existing Backend endpoints.
  Daily movement compares actual observations on the current Saudi calendar date,
  beginning with the first available observation today. Missing comparisons are labeled.
- The home chart stays on SAR / 24K independently of the Prices screen. Day, week and
  month select 24h, 7d and 30d windows ending at the latest saved observation. The API
  provides at most 200 records; incomplete coverage is disclosed, with no generated
  market samples or invented trend line.
- The SAR portfolio value, weight and return use only SAR purchases. Other currencies
  remain available in portfolio details. Values are estimates from the existing buy
  quote calculation, not guaranteed resale proceeds. Weight is recorded grams, not
  a new claim of 24K purity. Unavailable valuations remain unavailable.
- Purchases, alerts, notifications, nearby traders, account security and help remain
  accessible through More and the navigation drawer. Other secondary screens keep
  More selected in the mobile bar.
- The promotional card is hidden until an actual approved offer exists, as requested.

## Validation

Run TypeScript and `vitest run web/tests` in the existing extracted User build, with
`GITHUB_WORKSPACE` pointing to this repository, then run the production export.
Run the existing `apps/user/scripts/user-update.test.cjs` updater regression suite.

With the disposable local Backend and production User export running, execute:

```sh
python3 apps/user/scripts/browser-home.py
python3 apps/user/scripts/browser-quick-unlock.py
```

Both browser scripts refuse non-loopback service URLs. The home smoke creates local
test holdings against actual provider quotes, checks 320–1440px layouts and navigation,
currency isolation, chart controls and keyboard inspection, and offline last-price
labeling. Screenshots are saved to `/workspace/artifacts` by default. No production
financial records or Push subscriptions are written.
