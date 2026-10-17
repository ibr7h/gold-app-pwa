# Dhahabi Trader App (تطبيق ذهبك للتاجر المعتمد)

Independent progressive web app (PWA) for certified gold merchants and stores on the Dhahabk platform.

- **Accepted backend role**: `MERCHANT` only.
- **Production path**: `/gold-app-pwa/trader/`.
- **Session namespace**: `dhahabi_trader_*` (complete session and token isolation).
- **Identity colors**: Deep Navy `#001F3F`, Royal Gold `#C5A021`, `#D4AF37`.

## Core Features & Backend Integrations

1. **Merchant Onboarding via Invite Codes (انضمام التاجر برمز الدعوة)**:
   - Supported via `POST /merchant/onboarding/register/start` and `POST /merchant/onboarding/register/verify`.
   - Automatic recognition of invite codes from query parameters (`?code=DBK-...` or `?invite=DBK-...`).
   - Phone verification adhering to E.164 (`+9665...`), business establishment name, password, and official agreement to `dhahabk-terms-2026-10-v1`.
   - 6-digit email verification OTP activation.

2. **Password Recovery (استعادة كلمة المرور)**:
   - Endpoints: `POST /auth/password-reset/request` and `POST /auth/password-reset/confirm`.
   - Safe email-based reset flow with 60-second cooldown timer.

3. **Live Prices & Historical Market Trends (الأسعار الحية والمؤشر التاريخي)**:
   - Real-time live buy/sell rates for all major karats: 24K, 22K, 21K, and 18K in Saudi Riyals (`SAR`).
   - Interactive lightweight SVG line chart displaying historical trends (`day`, `week`, `month`, `available`).
   - Dynamic price change and percentage calculation.
   - Periodic background refresh every 60 seconds with manual on-demand refresh.

4. **Merchant Profile Management (إدارة بيانات التاجر والمنشأة)**:
   - Fetching authenticated merchant profile via `GET /auth/profile`.
   - Updating full name and city via `PATCH /auth/profile`.

5. **Web Push & Market Session Alerts (إشعارات الويب وتنبيهات السوق)**:
   - Direct browser push notifications through Service Worker (`sw.js`).
   - Subscriptions managed with VAPID keys via `GET /push/config`, `POST /push/subscriptions`, `DELETE /push/subscriptions`.
   - Market session alerts (opening & closing alerts) via `POST /push/preferences`.
   - Integrated test push delivery via `POST /push/test`.

6. **Secure Server Logout (تسجيل الخروج الآمن)**:
   - Revokes active push subscriptions on shared devices before signout.
   - Terminates server session via `POST /auth/logout`.
   - Fully purges local session storage.

7. **Upcoming Commerce Modules (وحدات التجارة المستقبلية)**:
   - Integrated UI containers prepared for Marketplace transactions, customer directories, chat channels, and financial reports once backend commerce APIs become available.
