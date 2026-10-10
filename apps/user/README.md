# Dhahabi User App

Independent end-user PWA for Dhahabi.

- Role accepted: `USER` only.
- Registration: required mobile number and server-verified email code; see [registration setup and tests](REGISTRATION.md).
- Production path: `/gold-app-pwa/full/` (legacy-compatible user URL).
- Session namespace: `dhahabi_user_*`.
- Identity colors: `#001F3F`, `#C5A021`, `#D4AF37`.
- Canonical icon: `apps/user/assets/app_icon_user.jpg`; login, biometric entry, boot screen, and installed PWA icon all derive from this same image.
- Source overrides live only under `apps/user/overrides`.

This app must not include Trader or Admin login choices, routes, dashboards, or session keys.

The canonical JPG is the unmodified 1024 × 1024 original from `UI.zip`
(`assets/icons/app_icon_user.jpg`). SHA-256:
`cb0706f6389380cfd931942f2ccd013734e766dac5f2afc365089137e5e28b83`.
The 512 × 512 PWA PNG is generated from this original at build time.
