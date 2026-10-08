# Dhahabi User App

Independent end-user PWA for Dhahabi.

- Role accepted: `USER` only.
- Registration: allowed through the public user registration endpoint.
- Production path: `/gold-app-pwa/full/` (legacy-compatible user URL).
- Session namespace: `dhahabi_user_*`.
- Identity colors: `#001F3F`, `#C5A021`, `#D4AF37`.\n- Canonical icon: `apps/user/assets/app_icon_user.jpg`; login, biometric entry, boot screen, and installed PWA icon all derive from this same image.
- Source overrides live only under `apps/user/overrides`.

This app must not include Trader or Admin login choices, routes, dashboards, or session keys.
