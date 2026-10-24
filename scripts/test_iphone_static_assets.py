import tempfile
import unittest
from pathlib import Path

from iphone_static_assets import refresh_css_links, verify_static_assets


class CssRefreshTests(unittest.TestCase):
    def test_updates_stylesheet_and_preload(self):
        html = ('<link rel="preload" href="/gold-app-pwa/full/_expo/static/css/web-11111111.css" as="style">'
                '<link rel="stylesheet" href="/gold-app-pwa/full/_expo/static/css/web-11111111.css">')
        result = refresh_css_links(html, ["web-22222222.css"])
        self.assertEqual(result.count("web-22222222.css"), 2)
        self.assertNotIn("11111111", result)

    def test_removes_retired_iphone_chunk_instead_of_restoring_old_code(self):
        html = '<link rel="stylesheet" href="/gold-app-pwa/full/_expo/static/css/iphone-11111111.css">'
        self.assertEqual(refresh_css_links(html, ["web-22222222.css"]), "")

    def test_preserves_gate_csp_updater_and_non_expo_css(self):
        html = ('<meta http-equiv="Content-Security-Policy" content="default-src self">'
                '<link rel="stylesheet" href="/gold-app-pwa/full/iphone-preview-lock.css?v=1">'
                '<script src="standalone-install-gate.js" data-entry="_expo/static/js/web/entry-1.js"></script>'
                '<script src="pwa-update.js"></script>')
        self.assertEqual(refresh_css_links(html, ["web-22222222.css"]), html)

    def test_supports_single_quotes_and_query_suffix(self):
        html = "<LINK rel='stylesheet' href='/gold-app-pwa/full/_expo/static/css/web-11111111.css?v=2' />"
        self.assertIn("web-22222222.css?v=2", refresh_css_links(html, ["web-22222222.css"]))

    def test_preserves_external_links(self):
        html = '<link rel="stylesheet" href="https://example.com/gold-app-pwa/full/_expo/static/css/web-11111111.css">'
        self.assertEqual(refresh_css_links(html, ["web-22222222.css"]), html)

    def test_rejects_ambiguous_or_empty_export(self):
        for names in ([], ["web-11111111.css", "web-22222222.css"], ["unexpected.css"]):
            with self.subTest(names=names), self.assertRaises(ValueError):
                refresh_css_links("", names)

    def test_rejects_obsolete_integrity_metadata(self):
        html = '<link rel="stylesheet" integrity="sha256-old" href="/gold-app-pwa/full/_expo/static/css/web-11111111.css">'
        with self.assertRaisesRegex(ValueError, "integrity"):
            refresh_css_links(html, ["web-22222222.css"])


class AssetValidationTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory(prefix="iphone-static-assets-test-")
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name)

    def put(self, relative, content="asset"):
        path = self.root / relative
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_text(content, encoding="utf-8")

    def test_validates_nested_relative_assets_and_query_suffixes(self):
        self.put("index.html", '<link rel="stylesheet" href="style.css?v=2">')
        self.put("nested/index.html", '<script src="../entry.js?v=1"></script>')
        self.put("style.css")
        self.put("entry.js")
        self.assertEqual(verify_static_assets(self.root), (2, 2))

    def test_missing_css_fails_instead_of_treating_build_as_ready(self):
        self.put("index.html", '<link rel="preload" href="missing.css" as="style">')
        with self.assertRaisesRegex(ValueError, "missing.css"):
            verify_static_assets(self.root)

    def test_install_gate_entry_is_verified_without_bypassing_gate(self):
        self.put("index.html", '<script src="gate.js" data-entry="_expo/entry.js?v=3"></script>')
        self.put("gate.js")
        with self.assertRaisesRegex(ValueError, "_expo/entry.js"):
            verify_static_assets(self.root)
        self.put("_expo/entry.js")
        self.assertEqual(verify_static_assets(self.root), (1, 2))

    def test_missing_icon_and_manifest_are_detected(self):
        for markup in ('<link rel="icon" href="missing.png">', '<link rel="manifest" href="manifest.json">'):
            self.put("index.html", markup)
            with self.subTest(markup=markup), self.assertRaises(ValueError):
                verify_static_assets(self.root)

    def test_empty_local_assets_fail(self):
        self.put("index.html", '<script src="empty.js"></script>')
        self.put("empty.js", "")
        with self.assertRaisesRegex(ValueError, "empty.js"):
            verify_static_assets(self.root)

    def test_external_and_data_resources_are_not_fetched(self):
        self.put("index.html", '<img src="data:image/png;base64,AAA"><script src="https://example.com/app.js"></script>')
        self.assertEqual(verify_static_assets(self.root), (1, 0))

    def test_rejects_plain_and_encoded_escape_paths(self):
        for reference in ("../../../escape.js", "%2e%2e/escape.js", "/outside.js"):
            self.put("index.html", f'<script src="{reference}"></script>')
            with self.subTest(reference=reference), self.assertRaises(ValueError):
                verify_static_assets(self.root)

    def test_requires_at_least_one_html_page(self):
        with self.assertRaisesRegex(ValueError, "No HTML"):
            verify_static_assets(self.root)


if __name__ == "__main__":
    unittest.main()
