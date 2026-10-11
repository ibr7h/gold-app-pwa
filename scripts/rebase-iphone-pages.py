#!/usr/bin/env python3
"""Rebase the isolated compiled iPhone PWA from /full/ to /iphone/ on GitHub Pages.

Do not rebuild or modify the stable /full/ application. This operates on a copy
from preview/iphone-render during the regular main-branch Pages deployment.
"""
import json
import re
import sys
from pathlib import Path

root = Path(sys.argv[1]) if len(sys.argv) > 1 else Path("_site/iphone")
assert root.is_dir(), f"Missing iPhone preview artifact: {root}"
old = b"/gold-app-pwa/full"
new = b"/gold-app-pwa/iphone"
old_escaped = b"gold-app-pwa\\/full"
new_escaped = b"gold-app-pwa\\/iphone"
text_extensions = {".html", ".js", ".css", ".json", ".webmanifest", ".svg", ".txt", ".xml", ".mjs", ".map"}
edited = 0
for path in root.rglob("*"):
    if not path.is_file() or path.suffix not in text_extensions:
        continue
    original = path.read_bytes()
    result = original.replace(old, new).replace(old_escaped, new_escaped)
    if path.name == "sw.js":
        # Cache Storage is shared by all paths on the same origin. Keep an
        # iPhone-preview service worker from deleting the stable /full/ cache.
        result = result.replace(b"dhahabi-full-", b"dhahabi-iphone-")
    if result != original:
        path.write_bytes(result)
        edited += 1
    assert old not in result, f"Old full-app URL in preview file: {path}"
    assert old_escaped not in result, f"Old escaped full-app URL in preview file: {path}"

manifest = json.loads((root / "manifest.json").read_text())
assert manifest["start_url"] == "/gold-app-pwa/iphone/", manifest
assert manifest["scope"] == "/gold-app-pwa/iphone/", manifest
assert manifest["id"] == "/gold-app-pwa/iphone/", manifest
assert (root / "index.html").exists(), "Missing preview entry page"
assert (root / "version.json").exists(), "Missing preview version"
version = json.loads((root / "version.json").read_text())
assert re.fullmatch(r"v\d+\.\d+\.\d+", version["displayVersion"]), version
index = (root / "index.html").read_text()
assert 'standalone-install-gate.js' in index, "The install-only iPhone gate must remain active"
assert "/gold-app-pwa/iphone/_expo/static/js/web/entry-" in index, "Preview JavaScript route is missing"
assert "iphone-preview-lock.js" in index, "Preview viewport styling script missing"
worker = (root / "sw.js").read_text()
assert "dhahabi-iphone-" in worker, "iPhone must have isolated cache namespace"
assert "dhahabi-full-" not in worker, "iPhone must not delete stable PWA cache"
assert edited > 20, f"Unexpected number of rebased files: {edited}"
print(f"Verified isolated /gold-app-pwa/iphone/ preview: {version['displayVersion']}, {edited} rebased files")
