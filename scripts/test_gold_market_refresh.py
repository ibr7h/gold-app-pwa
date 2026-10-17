"""Regression tests for the GitHub live gold price refresh. No HTTP requests."""
import json
import sys
import tempfile
import unittest
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
from gold_market_refresh import NEW_YORK, market_open, market_session, record_quote


def ny(year, month, day, hour, minute=0):
    return datetime(year, month, day, hour, minute, tzinfo=NEW_YORK).astimezone(timezone.utc)


def quote(at, price=4166.100098):
    return {"price": price, "updatedAt": at.isoformat().replace("+00:00", "Z")}


class MarketHoursTests(unittest.TestCase):
    def test_saturday_is_always_closed(self):
        for hour in (0, 12, 23):
            self.assertFalse(market_open(ny(2026, 10, 17, hour)))

    def test_friday_closes_at_five_new_york(self):
        self.assertTrue(market_open(ny(2026, 10, 16, 16, 59)))
        self.assertFalse(market_open(ny(2026, 10, 16, 17)))

    def test_sunday_reopens_at_six_new_york(self):
        self.assertFalse(market_open(ny(2026, 10, 18, 17, 59)))
        self.assertTrue(market_open(ny(2026, 10, 18, 18)))

    def test_weekday_maintenance_break(self):
        for day in (19, 20, 21, 22):
            self.assertTrue(market_open(ny(2026, 10, day, 16, 59)))
            self.assertFalse(market_open(ny(2026, 10, day, 17)))
            self.assertFalse(market_open(ny(2026, 10, day, 17, 59)))
            self.assertTrue(market_open(ny(2026, 10, day, 18)))

    def test_dst_spring_and_autumn_sunday_opening(self):
        for month, day in ((3, 8), (11, 1)):
            self.assertFalse(market_open(ny(2026, month, day, 17, 59)))
            self.assertTrue(market_open(ny(2026, month, day, 18)))

    def test_first_quote_after_daily_maintenance_is_new_session(self):
        self.assertNotEqual(
            market_session(ny(2026, 10, 19, 16, 59)),
            market_session(ny(2026, 10, 19, 18)),
        )

    def test_naive_time_is_not_allowed(self):
        with self.assertRaises(ValueError):
            market_open(datetime(2026, 10, 17, 15))


class RefreshPersistenceTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        folder = Path(self.temp.name)
        self.live = folder / "prices-live.json"
        self.history = folder / "prices-history.json"

    def record(self, provider, now):
        return record_quote(provider, self.live, self.history, now=now)

    def seed(self, at, price=4166.100098):
        updated_at = at.isoformat().replace("+00:00", "Z")
        self.live.write_text(json.dumps({"spotUsdPerOunce": price, "updatedAt": updated_at}))
        self.history.write_text(json.dumps({
            "version": 1, "retention": {"maxPoints": 2016},
            "points": [{"spotUsdPerOunce": price, "updatedAt": updated_at}],
        }))

    def test_closed_weekend_does_not_mutate_existing_files(self):
        self.seed(ny(2026, 10, 16, 16, 50))
        old = (self.live.read_bytes(), self.history.read_bytes())
        self.assertFalse(self.record({}, ny(2026, 10, 17, 12)))
        self.assertEqual(old, (self.live.read_bytes(), self.history.read_bytes()))

    def test_closed_weekend_never_creates_files(self):
        self.assertFalse(self.record(quote(ny(2026, 10, 17, 12)), ny(2026, 10, 17, 12)))
        self.assertFalse(self.live.exists())
        self.assertFalse(self.history.exists())

    def test_closed_supplier_time_is_rejected_even_when_polled_open(self):
        self.seed(ny(2026, 10, 16, 16, 50))
        old = (self.live.read_bytes(), self.history.read_bytes())
        self.assertFalse(self.record(quote(ny(2026, 10, 17, 12), 4200), ny(2026, 10, 18, 18, 10)))
        self.assertEqual(old, (self.live.read_bytes(), self.history.read_bytes()))

    def test_future_supplier_time_is_rejected(self):
        now = ny(2026, 10, 19, 16, 25)
        self.assertFalse(self.record(quote(now + timedelta(minutes=6), 4250), now))
        self.assertFalse(self.live.exists())

    def test_undated_source_is_rejected_without_file_writes(self):
        with self.assertRaisesRegex(ValueError, "updatedAt"):
            self.record({"price": 4200}, ny(2026, 10, 19, 16, 25))
        self.assertFalse(self.live.exists())

    def test_non_numeric_source_is_rejected(self):
        with self.assertRaises(ValueError):
            self.record(quote(ny(2026, 10, 19, 16, 24), "not-a-number"), ny(2026, 10, 19, 16, 25))
        self.assertFalse(self.live.exists())

    def test_flat_quote_same_session_is_not_saved_or_retimestamped(self):
        self.seed(ny(2026, 10, 19, 15))
        old = (self.live.read_bytes(), self.history.read_bytes())
        self.assertFalse(self.record(quote(ny(2026, 10, 19, 15, 10)), ny(2026, 10, 19, 15, 15)))
        self.assertEqual(old, (self.live.read_bytes(), self.history.read_bytes()))

    def test_stale_quote_does_not_overwrite_later_data(self):
        self.seed(ny(2026, 10, 19, 15, 10))
        self.assertFalse(self.record(quote(ny(2026, 10, 19, 15, 9), 4199), ny(2026, 10, 19, 15, 15)))

    def test_meaningful_price_move_is_saved_once(self):
        self.seed(ny(2026, 10, 19, 15))
        updated = quote(ny(2026, 10, 19, 15, 10), 4185.123)
        now = ny(2026, 10, 19, 15, 15)
        self.assertTrue(self.record(updated, now))
        history = json.loads(self.history.read_text())
        self.assertEqual(len(history["points"]), 2)
        self.assertEqual(history["points"][-1]["spotUsdPerOunce"], 4185.123)
        self.assertFalse(self.record(updated, now))
        self.assertEqual(len(json.loads(self.history.read_text())["points"]), 2)

    def test_first_quote_after_weekend_kept_even_if_numerically_flat(self):
        self.seed(ny(2026, 10, 16, 16, 50))
        updated = quote(ny(2026, 10, 18, 18, 1))
        self.assertTrue(self.record(updated, ny(2026, 10, 18, 18, 5)))
        history = json.loads(self.history.read_text())
        self.assertEqual(len(history["points"]), 2)

    def test_first_quote_after_weekday_maintenance_kept_if_flat(self):
        self.seed(ny(2026, 10, 19, 16, 50))
        self.assertTrue(self.record(quote(ny(2026, 10, 19, 18, 1)), ny(2026, 10, 19, 18, 5)))
        self.assertEqual(len(json.loads(self.history.read_text())["points"]), 2)


if __name__ == "__main__":
    unittest.main()
