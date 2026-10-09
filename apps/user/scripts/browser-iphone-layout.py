#!/usr/bin/env python3
"""Isolated WebKit geometry checks for the Gold App USER iPhone CSS.

Runs without a real account, API calls, secrets, or access to production data.
A DOM fixture with real user.css and iphone.css verifies responsive layout rules.
This does not replace on-device iOS Safari/PWA and end-to-end authentication tests.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE_CSS = (ROOT / "overrides/web/user.css").read_text(encoding="utf-8")
# Linux WebKit lacks the iOS-only -webkit-touch-callout feature query.
# Switch that outer guard in this *test fixture only* so the real iPhone
# layout declarations are measured by WebKit without changing production CSS.
IPHONE_CSS = (ROOT / "overrides/web/iphone.css").read_text(encoding="utf-8").replace(
    "@supports (-webkit-touch-callout: none)", "@supports (display: grid)"
)
HEAD = '<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
FIXTURE = """<div class="gold-web workspace">
  <aside class="desktop-nav"><strong>ذهبي — سطح المكتب</strong></aside>
  <div class="workspace-main">
    <header class="topbar"><h1>الرئيسية</h1></header>
    <main class="workspace-content" aria-label="محتوى التطبيق">
      <label>الوزن<input name="weight" type="number" inputmode="decimal"></label>
      <div class="approved-card" style="height:1800px">محتوى طويل قابل للتمرير</div>
    </main>
    <nav class="mobile-bottom-nav" aria-label="التنقل السريع">
      <button type="button" class="mobile-tab selected">الرئيسية</button>
      <button type="button" class="mobile-tab">الأسعار</button>
      <button type="button" class="mobile-tab">الحاسبة</button>
      <button type="button" class="mobile-tab">المحفظة</button>
      <button type="button" class="mobile-tab">المزيد</button>
    </nav>
  </div>
</div>"""
HTML = ('<!doctype html><html lang="ar" dir="rtl"><head>' + HEAD +
        '<style>html,body,#root{margin:0;width:100%;height:100%;overflow:hidden}' +
        BASE_CSS + IPHONE_CSS + '</style></head><body><div id="root">' +
        FIXTURE + '</div></body></html>')
IPHONE_UA = ("Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) "
             "AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 "
             "Mobile/15E148 Safari/604.1")


def check_phone(browser, width, height):
    context = browser.new_context(viewport={"width": width, "height": height},
                                  device_scale_factor=3, is_mobile=True,
                                  has_touch=True, user_agent=IPHONE_UA)
    page = context.new_page()
    page.set_content(HTML, wait_until="load")
    snapshot = page.evaluate("""() => {
      const el=(s)=>document.querySelector(s);
      const nav=el('.mobile-bottom-nav');
      const root=el('.gold-web.workspace');
      const scroll=el('.workspace-content');
      const side=el('.desktop-nav');
      const rect=nav.getBoundingClientRect();
      return {navDisplay:getComputedStyle(nav).display,
        navHeight:rect.height, navBottom:rect.bottom,
        rootHeight:root.getBoundingClientRect().height,
        rootPosition:getComputedStyle(root).position,
        viewportHeight:innerHeight, bodyScroll:document.scrollingElement.scrollTop,
        inputFont:parseFloat(getComputedStyle(el('input')).fontSize),
        desktopVisible:getComputedStyle(side).display!=='none',
        cssSupportsWebkit:CSS.supports('-webkit-touch-callout','none'),
        scrollHeight:scroll.scrollHeight, clientHeight:scroll.clientHeight};
    }""")
    assert snapshot["rootPosition"] == "fixed", snapshot
    assert snapshot["navDisplay"] == "grid", snapshot
    assert not snapshot["desktopVisible"], snapshot
    assert snapshot["inputFont"] >= 16, snapshot
    assert abs(snapshot["navBottom"] - snapshot["viewportHeight"]) <= 2, snapshot
    assert 55 <= snapshot["navHeight"] <= 95, snapshot
    assert snapshot["scrollHeight"] > snapshot["clientHeight"], snapshot
    page.locator(".workspace-content").evaluate("(el) => el.scrollTop=el.scrollHeight")
    scrolled = page.locator(".workspace-content").evaluate("(el) => el.scrollTop")
    assert scrolled > 250, (scrolled, snapshot)
    after = page.locator(".mobile-bottom-nav").bounding_box()
    assert after and abs(after["y"] + after["height"] - height) <= 2, after
    # Keyboard state transition. Actual software keyboard behavior needs physical iPhone.
    page.evaluate("""() => {
      const root=document.querySelector('.gold-web.workspace');
      root.dataset.iphoneKeyboard='open';
      root.style.setProperty('--iphone-visible-height','420px');
      root.style.setProperty('--iphone-viewport-offset-top','0px');
    }""")
    assert page.locator(".mobile-bottom-nav").evaluate(
        "(el) => getComputedStyle(el).display") == "none"
    page.evaluate("""() => {
      const root=document.querySelector('.gold-web.workspace');
      delete root.dataset.iphoneKeyboard;
      root.style.removeProperty('--iphone-visible-height');
      root.style.removeProperty('--iphone-viewport-offset-top');
    }""")
    assert page.locator(".mobile-bottom-nav").evaluate(
        "(el) => getComputedStyle(el).display") == "grid"
    print(f"PASS WebKit iPhone {width}x{height}: anchored tabs, scrolling, keyboard, form font")
    context.close()


def check_desktop(browser):
    context=browser.new_context(viewport={"width":1280,"height":800})
    page=context.new_page()
    page.set_content(HTML,wait_until="load")
    assert page.locator(".desktop-nav").evaluate(
        "(el) => getComputedStyle(el).display") != "none"
    assert page.locator(".mobile-bottom-nav").evaluate(
        "(el) => getComputedStyle(el).display") == "none"
    print("PASS WebKit desktop isolation")
    context.close()


if __name__ == "__main__":
    with sync_playwright() as p:
        browser = p.webkit.launch(headless=True)
        try:
            for width, height in ((320, 680), (375, 667), (390, 844), (430, 932), (844, 390)):
                check_phone(browser,width,height)
            check_desktop(browser)
        finally:
            browser.close()
