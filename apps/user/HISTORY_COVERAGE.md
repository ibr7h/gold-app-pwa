# Live history coverage gate — 2026-10-25

## Corrected diagnosis

The old check required `daily-average.length >= 21` in a rolling 30-day
window. This measured the number of imported averages, not historical coverage.
The backend's one-time import deliberately skips days with real observations;
the old imported period also naturally ages out of the rolling window. A healthy
month can therefore contain fewer imported days, eventually none at all.

Live inspection found imported days through October 6 **and real source-timestamped
observations after October 6**. The earlier description of "11 days of history"
was incomplete: 11 was the imported subset, not the entire series. Do not backfill
or invent data solely to satisfy that obsolete assertion.

## Release checks retained and strengthened

- At least **21 distinct UTC days** across imported averages and real observations,
  spanning at least 21 calendar days; duplicate kinds/days never inflate coverage.
- At least one real, open-session observation. Averages retain day-only provenance
  and cannot leak into the latest-price endpoint or the 24-hour chart.
- Verify SAR and USD separately, including currency, karat, positive finite price,
  source, date validity, requested window, duplicate ids and timestamps.
- Exclude and report legacy closed-session ticks, as the User chart already does.
- Reject future/latest observations older than four days and latest responses
  behind the chart. Report the actual source time and its age: this check does
  **not** assert 15-minute quote freshness, complete intraday coverage, or holiday
  calendar correctness. Assess those separately during an open market session.
- A weekend 24-hour chart may legitimately be empty; a chart missing an actual
  recent observation fails. HTTP failure, invalid JSON, oversize and timeout fail.
- Requests are bounded, public GETs, with no login, API key, redirect or mutation.
- Regression tests include genuine missing history, repeated points, a month of
  real observations without imported data, and improper daily/live mixing.

Run `node --test scripts/check-live-history.test.cjs`, then
`node scripts/check-live-history.cjs`. GitHub runs both on the pull request and
again on the merged check's commit. There is no skip/continue-on-error or lower
coverage threshold. No product bundle, provider, stored price, backend code,
account or database is changed by this correction.

## Scope of the evidence

This independent public API check does not replace backend unit, database,
security or end-to-end release checks, nor does it authorize a backend deploy.
It does not change hosting plans or introduce keep-alive traffic. Any genuine
missing history or open-session collection failure must still be diagnosed and
recovered from authoritative data; this gate never synthesizes price points.
