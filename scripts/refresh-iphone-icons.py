#!/usr/bin/env python3
"""Synchronize all iPhone-preview User icon assets from the approved storefront icon."""
from __future__ import annotations

import base64
import hashlib
import json
import re
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
PREVIEW = ROOT / "_render_preview/gold-app-pwa/full"
ASSETS = ROOT / "apps/user/assets"
SOURCE = PREVIEW / "iphone-apple-touch-67084b40.png"
ICON_URL = "/gold-app-pwa/full/iphone-apple-touch-67084b40.png"
VERSION = "73ddc204"


def write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(data)


def png(image: Image.Image, target: Path, size: int) -> None:
    image.resize((size, size), Image.Resampling.LANCZOS).save(
        target, "PNG", optimize=True
    )


def main() -> None:
    assert SOURCE.is_file(), f"Approved iPhone icon not found: {SOURCE}"
    image = Image.open(SOURCE).convert("RGBA")
    assert image.size == (180, 180), f"Unexpected icon size: {image.size}"
    assert hashlib.sha256(SOURCE.read_bytes()).hexdigest() == (
        "67084b402b6cedc89f9e10ec892bc63dcf0dd5b3d7372fa0e6563c0c2dac39da"
    ), "Source image must remain the approved storefront icon"

    canvas = Image.new("RGB", image.size, "white")
    canvas.paste(image, mask=image.getchannel("A"))
    larger = canvas.resize((1024, 1024), Image.Resampling.LANCZOS)
    png(canvas, PREVIEW / "pwa-icon.png", 512)
    png(canvas, PREVIEW / "pwa-icon-af89c21a.png", 512)
    png(canvas, PREVIEW / "apple-touch-icon.png", 180)
    png(canvas, PREVIEW / "apple-touch-icon-af89c21a.png", 180)
    for target in (
        PREVIEW / "app_icon_user.jpg",
        PREVIEW / "app_icon_user-af89c21a.jpg",
        ASSETS / "app_icon_user.jpg",
    ):
        larger.save(target, "JPEG", quality=91, optimize=True, subsampling=0)

    canvas.save(
        PREVIEW / "favicon.ico", format="ICO", sizes=[
            (16, 16), (32, 32), (48, 48), (64, 64)
        ]
    )
    raw = base64.b64encode(SOURCE.read_bytes()).decode("ascii")
    svg = (
        '<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"'
        ' viewBox="0 0 512 512">'
        '<image width="512" height="512"'
        ' href="data:image/png;base64,' + raw + '"/></svg>\n'
    )
    for name in ("icon.svg", "icon-maskable.svg"):
        (ASSETS / name).write_text(svg, encoding="utf-8")

    for manifest_name in ("manifest.json", "manifest.webmanifest"):
        path = PREVIEW / manifest_name
        manifest = json.loads(path.read_text(encoding="utf-8"))
        manifest["icons"] = [
            {"src": ICON_URL, "sizes": "180x180", "type": "image/png", "purpose": "any"},
            {"src": "/gold-app-pwa/full/pwa-icon.png", "sizes": "512x512",
             "type": "image/png", "purpose": "any maskable"},
            {"src": "/gold-app-pwa/full/app_icon_user.jpg", "sizes": "1024x1024",
             "type": "image/jpeg", "purpose": "any"},
        ]
        path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

    for path in PREVIEW.rglob("*.html"):
        if any(part in {"assets", "_expo"} for part in path.relative_to(PREVIEW).parts):
            continue
        old = path.read_text(encoding="utf-8")
        new = old.replace('/gold-app-pwa/full/favicon.ico', ICON_URL)
        new = new.replace('/gold-app-pwa/full/pwa-icon-af89c21a.png', ICON_URL)
        new = new.replace('/gold-app-pwa/full/app_icon_user-af89c21a.jpg', ICON_URL)
        new = new.replace('type="image/jpeg" href="' + ICON_URL + '"',
                          'type="image/png" href="' + ICON_URL + '"')
        new = new.replace("pwa-update.js?v=67084b40", "pwa-update.js?v=" + VERSION)
        if new != old:
            path.write_text(new, encoding="utf-8")

    worker = PREVIEW / "sw.js"
    s = worker.read_text(encoding="utf-8")
    s = re.sub(r"const VERSION = '[0-9a-f]{8}';",
               f"const VERSION = '{VERSION}';", s, count=1)
    s = s.replace("BASE + 'app_icon_user.jpg'", "BASE + 'app_icon_user.jpg',\n  BASE + 'apple-touch-icon.png',\n  BASE + 'favicon.ico'")
    worker.write_text(s, encoding="utf-8")
    (PREVIEW / "version.json").write_text(
        json.dumps({"version": "full-" + VERSION, "force": True}) + "\n", encoding="utf-8"
    )
    updater = PREVIEW / "pwa-update.js"
    updater.write_text(
        re.sub(r"const CURRENT = 'full-[0-9a-f]{8}';",
               f"const CURRENT = 'full-{VERSION}';",
               updater.read_text(encoding="utf-8"), count=1),
        encoding="utf-8"
    )
    generation = ROOT / "apps/user/scripts/generate-icon.cjs"
    old = generation.read_text(encoding="utf-8")
    new_sha = hashlib.sha256((ASSETS / "app_icon_user.jpg").read_bytes()).hexdigest()
    changed, count = re.subn(r"'cb0706f6389380cfd931942f2ccd013734e766dac5f2afc365089137e5e28b83'",
                             "'" + new_sha + "'", old)
    assert count == 1, "Could not update source verification SHA"
    changed = changed.replace(
        "The User icon must be the unmodified original from UI.zip",
        "The User icon must match the approved iPhone-preview market icon"
    )
    generation.write_text(changed, encoding="utf-8")
    readme = ASSETS.parent / "README.md"
    text = readme.read_text(encoding="utf-8")
    text = re.sub(
        r"The canonical JPG is the unmodified 1024 × 1024 original from .+?The 512 × 512 PWA PNG is generated from this original at build time\.",
        "For the iPhone preview, assets are generated from the approved new storefront icon. "
        "Source: /gold-app-pwa/full/iphone-apple-touch-67084b40.png. "
        "Use the icon synchronization workflow before deploying the preview.",
        text, flags=re.S
    )
    readme.write_text(text, encoding="utf-8")
    for check in (
        PREVIEW / "pwa-icon.png", PREVIEW / "favicon.ico",
        PREVIEW / "app_icon_user.jpg", ASSETS / "app_icon_user.jpg",
    ):
        assert check.exists() and check.stat().st_size > 1000, check
    assert Image.open(PREVIEW / "pwa-icon.png").size == (512, 512)
    assert Image.open(PREVIEW / "app_icon_user.jpg").size == (1024, 1024)
    assert Image.open(PREVIEW / "favicon.ico").format == "ICO"
    print("Icon assets synchronized; old icon images replaced (User iPhone preview only).")


if __name__ == "__main__":
    main()
