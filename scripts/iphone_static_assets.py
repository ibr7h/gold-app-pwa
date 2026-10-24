"""Keep retained User HTML in sync with one fresh Expo export, then fail closed."""

import argparse
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urljoin, urlsplit


BASE_URL = "/gold-app-pwa/full/"
CSS_URL = BASE_URL + "_expo/static/css/"
HASHED_CSS = re.compile(r"(.+)-[a-f0-9]{8,64}\.css\Z")


class AssetParser(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.assets = []
        self.links = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        if tag == "link":
            self.links.append(attrs)
            rel = set((attrs.get("rel") or "").lower().split())
            if rel & {"stylesheet", "preload", "modulepreload", "manifest", "icon", "apple-touch-icon"}:
                self.assets.append(attrs.get("href"))
        elif tag == "script":
            self.assets.extend([attrs.get("src"), attrs.get("data-entry")])
        elif tag in {"img", "source"}:
            self.assets.append(attrs.get("src"))


def refresh_css_links(html, fresh_names):
    """Replace hashed CSS references; retired chunks must not survive the export.

    The old HTML shell intentionally retains the install gate, CSP, and updater.
    Only Expo CSS link tags are changed. No historical bundle is restored.
    """
    fresh = {}
    for name in fresh_names:
        match = HASHED_CSS.fullmatch(name)
        if not match:
            raise ValueError(f"Unexpected exported stylesheet: {name}")
        key = match.group(1)
        if key in fresh:
            raise ValueError(f"Ambiguous exported stylesheet: {key}")
        fresh[key] = name
    if not fresh:
        raise ValueError("The new export contains no stylesheets")

    def rewrite(match):
        tag = match.group(0)
        parser = AssetParser()
        parser.feed(tag)
        if not parser.links:
            return tag
        attrs = parser.links[0]
        rel = set((attrs.get("rel") or "").lower().split())
        if not ("stylesheet" in rel or ("preload" in rel and attrs.get("as") == "style")):
            return tag
        href = attrs.get("href") or ""
        url = urlsplit(href)
        if url.scheme or url.netloc or not url.path.startswith(CSS_URL):
            return tag
        name = url.path[len(CSS_URL):]
        hashed = HASHED_CSS.fullmatch(name)
        if not hashed:
            raise ValueError(f"Unexpected retained Expo CSS reference: {name}")
        replacement = fresh.get(hashed.group(1))
        if replacement is None:
            # The current Expo export no longer emits this retired chunk.
            return ""
        if replacement != name and "integrity" in attrs:
            raise ValueError("Cannot reuse a stylesheet integrity hash after replacing its asset")
        return tag.replace(name, replacement)

    return re.sub(r"<link\b[^>]*>", rewrite, html, flags=re.IGNORECASE)


def verify_static_assets(root):
    """Validate local assets of every retained route, including the gated entry.

    External resources are not fetched. This is a packaging check, not a claim
    that authentication, physical iPhone behavior, or the API passed an E2E test.
    """
    root = Path(root).resolve()
    pages = sorted(root.rglob("*.html"))
    if not pages:
        raise ValueError("No HTML pages were found in the User publish directory")
    errors = []
    checked = set()
    for page in pages:
        parser = AssetParser()
        parser.feed(page.read_text(encoding="utf-8"))
        page_url = BASE_URL + page.relative_to(root).as_posix()
        for reference in filter(None, parser.assets):
            url = urlsplit(reference)
            if url.scheme or url.netloc or reference.startswith("#"):
                continue
            resolved = unquote(urlsplit(urljoin(page_url, reference)).path)
            if not resolved.startswith(BASE_URL):
                errors.append(f"{page.relative_to(root)}: asset escapes User publish directory: {reference}")
                continue
            target = (root / resolved[len(BASE_URL):]).resolve()
            if not target.is_relative_to(root) or not target.is_file() or target.stat().st_size == 0:
                errors.append(f"{page.relative_to(root)}: missing or empty asset: {reference}")
            else:
                checked.add(target)
    if errors:
        raise ValueError("Broken User static assets:\n" + "\n".join(errors))
    return len(pages), len(checked)


if __name__ == "__main__":
    cli = argparse.ArgumentParser(description=__doc__)
    cli.add_argument("publish_directory", type=Path)
    args = cli.parse_args()
    pages, assets = verify_static_assets(args.publish_directory)
    print(f"PASS User static assets: {pages} HTML pages, {assets} distinct local assets; zero broken references")
