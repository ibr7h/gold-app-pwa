"""Market-aware XAU price refresh used by the scheduled GitHub Action.

Keep session hours consistent with gold-app/src/modules/prices/gold-market-hours.ts.
No network requests are made from this module; the workflow checks market-state
before calling the provider, and this module validates the provider timestamp.
"""
from __future__ import annotations

import json
import math
import sys
from datetime import date, datetime, timedelta, timezone
from pathlib import Path
from zoneinfo import ZoneInfo

NEW_YORK = ZoneInfo("America/New_York")
OUNCE_GRAMS = 31.1034768
USD_SAR = 3.75


def market_session(at: datetime) -> date | None:
    """A trading session is named for the NY date on which it closes.

    Weekday maintenance: 17:00–18:00 NY. Weekly closure: Friday 17:00
    through Sunday 18:00 NY. Time-zone data handles daylight saving.
    """
    if at.tzinfo is None:
        raise ValueError("Expected timezone-aware datetime")
    ny = at.astimezone(NEW_YORK)
    weekday = ny.weekday()  # Mon=0, Fri=4, Sat=5, Sun=6
    minute_of_day = ny.hour * 60 + ny.minute
    if weekday == 5 or (weekday == 6 and minute_of_day < 1080):
        return None
    if weekday == 4 and minute_of_day >= 1020:
        return None
    if weekday in (0, 1, 2, 3) and 1020 <= minute_of_day < 1080:
        return None
    if minute_of_day >= 1080:
        return ny.date() + timedelta(days=1)
    return ny.date()


def market_open(at: datetime) -> bool:
    return market_session(at) is not None


def observation_time(value: object) -> datetime:
    """Reject undated/naive quotes instead of manufacturing a fresh timestamp."""
    if not isinstance(value, str) or not value.strip():
        raise ValueError("Provider did not supply updatedAt")
    try:
        parsed = datetime.fromisoformat(value.strip().replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError("Invalid provider updatedAt") from exc
    if parsed.tzinfo is None:
        raise ValueError("Provider updatedAt must include a time zone")
    return parsed.astimezone(timezone.utc)


def existing_quote(path: Path) -> dict | None:
    if not path.exists():
        return None
    data = json.loads(path.read_text(encoding="utf-8"))
    return data if isinstance(data, dict) else None


def record_quote(
    provider: dict, live_path: Path, history_path: Path,
    *, now: datetime | None = None,
) -> bool:
    """Return True only if BOTH price files were updated with a real new quote.

    Do not backfill or delete past points, including pre-fix weekend records.
    """
    now = now or datetime.now(timezone.utc)
    if not market_open(now):
        return False

    observed_at = observation_time(provider.get("updatedAt"))
    if not market_open(observed_at) or observed_at > now + timedelta(minutes=5):
        return False

    try:
        usd = float(provider["price"])
    except (KeyError, TypeError, ValueError) as exc:
        raise ValueError("Invalid supplier gold price") from exc
    if not math.isfinite(usd) or usd <= 0:
        raise ValueError("Invalid supplier gold price")

    last_live = existing_quote(live_path)
    history = existing_quote(history_path) or {
        "version": 1,
        "source": "api.gold-api.com",
        "symbol": "XAU",
        "retention": {"maxPoints": 2016, "approxDaysAt5Min": 7},
        "points": [],
    }
    points = history.get("points", [])
    if not isinstance(points, list):
        raise ValueError("Invalid history points")
    latest_history = points[-1] if points else None
    candidates = [x for x in (last_live, latest_history) if isinstance(x, dict)]
    previous = None
    previous_dt = None
    for item in candidates:
        try:
            dt = observation_time(item.get("updatedAt"))
        except ValueError:
            continue
        if previous_dt is None or dt > previous_dt:
            previous, previous_dt = item, dt

    if previous_dt is not None:
        if observed_at <= previous_dt:
            return False
        prior_price = float(previous.get("spotUsdPerOunce", 0))
        same_price = math.isfinite(prior_price) and (
            round(prior_price * USD_SAR / OUNCE_GRAMS, 2)
            == round(usd * USD_SAR / OUNCE_GRAMS, 2)
        )
        # A new trading session can have a valid first quote with the
        # same numerical value as the previous session's last quote.
        if same_price and market_session(previous_dt) == market_session(observed_at):
            return False

    generated = now.astimezone(timezone.utc).isoformat()
    pure = usd * USD_SAR / OUNCE_GRAMS
    prices = {
        str(karat): round(pure * karat / 24, 2)
        for karat in (24, 22, 21, 18)
    }
    out = {
        "source": "api.gold-api.com",
        "symbol": "XAU",
        "currency": "USD",
        "spotUsdPerOunce": usd,
        "usdSar": USD_SAR,
        "updatedAt": observed_at.isoformat().replace("+00:00", "Z"),
        "generatedAt": generated,
        "pricesSarPerGram": prices,
    }
    snapshot = {
        key: out[key]
        for key in ("source", "spotUsdPerOunce", "usdSar", "updatedAt", "generatedAt", "pricesSarPerGram")
    }
    max_points = max(1, int(history.get("retention", {}).get("maxPoints", 2016)))
    history["points"] = [*points, snapshot][-max_points:]
    history["updatedAt"] = generated

    live_path.write_text(json.dumps(out, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    history_path.write_text(json.dumps(history, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    return True


def main() -> int:
    if len(sys.argv) == 2 and sys.argv[1] == "market-state":
        print("true" if market_open(datetime.now(timezone.utc)) else "false")
        return 0
    if len(sys.argv) == 3 and sys.argv[1] == "update":
        provider = json.loads(Path(sys.argv[2]).read_text(encoding="utf-8"))
        changed = record_quote(provider, Path("prices-live.json"), Path("prices-history.json"))
        print("Saved a genuine trading-session observation." if changed
              else "No new open-market observation; existing prices preserved.")
        return 0
    print("Usage: gold_market_refresh.py market-state | update PROVIDER_JSON", file=sys.stderr)
    return 2


if __name__ == "__main__":
    sys.exit(main())
