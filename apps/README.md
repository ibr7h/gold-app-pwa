# Dhahabi Frontend Applications

Dhahabi is split into three independent frontends that share only the backend API.

| App | Source | Accepted role | Pages path | Session namespace |
|---|---|---|---|---|
| User | `apps/user` | `USER` | `/gold-app-pwa/full/` | `dhahabi_user_*` |
| Trader | `apps/trader` | `MERCHANT` | `/gold-app-pwa/trader/` | `dhahabi_trader_*` |
| Admin | `apps/admin` | `ADMIN` | `/gold-app-pwa/admin/` | `dhahabi_admin_*` |

## Non-negotiable separation rules

1. No role selector on any login screen.
2. Each app rejects authenticated accounts with the wrong backend role.
3. Each PWA has its own manifest, icon, service-worker scope, and session namespace.
4. User registration exists only in the User app.
5. Trader/Admin self-registration is disabled until a controlled onboarding flow exists.
6. Unsupported Trader/Admin business modules remain explicitly marked as pending backend integration; no fake operational data.
7. Shared brand identity is fixed at `#001F3F`, `#C5A021`, and `#D4AF37`.
8. Backend remains in the separate repository `ibr7h/gold-app`.

The current User production URL remains `/full/` for backward compatibility. The application itself is treated as the User app.
