# Historical EUR recovery — 2026-10-25

The user requested recovery of missing historical currency values by converting
existing old gold data. This is a read-only User frontend change; it does not
backfill the database or manufacture a gold observation for a missing day.

## Conversion order

1. Read the existing USD and SAR gold history for the selected karat and range.
2. Prefer USD for a day already covered in that karat. SAR contributes only
   missing UTC days; this avoids double counting differently sampled records.
3. Convert each original observation using its historical USD/EUR reference
   rate, with the closest preceding reference day allowed for weekends/holidays
   up to five calendar days. Never apply the current EUR quote to old data.
4. SAR fallback is first divided by **3.75**, matching the backend's existing
   USD-to-SAR gold conversion, then multiplied by that dated USD/EUR rate.
5. Preserve source timestamp/day, source, karat, original aggregation and ID.
   Attach explicit conversion metadata (source currency, rate, reference date).
   A daily average remains a daily average, not a fabricated live tick.

The chart labels EUR history as converted reference prices in Arabic, English
and French. Conversion retains full numeric precision until display formatting.
No private account, purchase/invoice, balance or tax data is rewritten.

## Missing data / outages

- If one history currency fails, the other can supply actual recorded prices.
- If both requests fail, reject the load; do not return fake successful history.
- If a gold day is absent in both currencies, leave that gap.
- If dated FX is unavailable, leave the affected point out, never guess a rate.
- Old validated cached FX remains usable for its own historical dates during an
  outage. It cannot authorize conversion of a later day more than five days
  after its recorded date. Current gold pricing remains independent.
- FX fetch: fixed reviewed HTTPS origin, 8-second absolute deadline, 64KB body
  ceiling, no redirects, cookies, Authorization, application referrer or API key.

Current EUR remains the direct public `https://api.gold-api.com/price/XAU/EUR`
quote. This fallback does not replace that endpoint with daily reference FX.

## Verification

Tests cover both sources, USD precedence, true missing days, aggregation and
timestamp preservation, FX date selection, invalid input, old-cache outages,
bounded transport, translations and unchanged direct-EUR pricing. The browser
smoke test exercises the actual built User workspace using local-only fixtures:
the missing EUR day is derived from SAR375 / 3.75 * 0.89 = EUR89 and is labeled
as converted history. No production login or account writes are used.

Official historical-rate contract: https://frankfurter.dev/v1/
No new backend release or private CI bypass is included in this change.
