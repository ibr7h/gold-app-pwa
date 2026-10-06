# User Web 1.1 review
This change targets the full user web application only. The native source archive, backend permissions, trader and admin variants are unchanged.

## Fixed
- Portfolio, purchase and alert screens now use the authenticated NestJS API instead of in-memory demo data.
- Purchases use karat, weight in grams, unit price and calculated total, matching the server contract.
- Account data is shown only after authentication verification; access tokens refresh with a shared in-flight request.
- Expired session data is not trusted; responses from a logged-out session are rejected.
- Responsive desktop sidebar/mobile menu, keyboard-operable forms, errors, loading states and deletion confirmation.
- Totals are grouped by currency. Reference prices show their original timestamp and stale/unavailable state.
- Full-app caches are scoped and versioned, and do not clear caches belonging to other apps on the same origin.

## Scope and limits
The new workspace is Arabic. Existing multilingual/native screens remain in the original archive. Demo charts, merchant listings and offers are not represented as live data. The current API does not support profile editing or password recovery; these are explained rather than reporting false success.
Server alert state does not imply closed-app push notification delivery. Server alert prices can differ from the published reference-price feed.
No database credential rotation or account role changes are included.

## Prior live API verification in this conversation
An isolated QA account successfully registered, logged in, loaded /auth/me, created a portfolio and purchase, updated/read the purchase, created/paused/activated an alert, refreshed its token, and deleted all created records. CORS returned the GitHub Pages origin. The empty test account remains because the API has no account-delete endpoint.
The reconstructed frontend must separately pass TypeScript, unit tests and Expo export in Check responsive user web before publication. Real iOS/Android device and signed-in visual testing are not claimed.
