#!/usr/bin/env python3
"""WebKit regression: Safari document is fixed; forms and pages remain scrollable.
This tests actual HTML/CSS behavior in Linux WebKit with an iPhone user agent.
It does not claim physical iOS Safari or accessibility zoom can be overridden.
"""
from pathlib import Path
from playwright.sync_api import sync_playwright

ROOT=Path(__file__).resolve().parents[1]
CSS=(ROOT/'scripts/iphone-preview-lock.css').read_text()
JS=(ROOT/'scripts/iphone-preview-lock.js').read_text()
USER_CSS=(ROOT/'overrides/web/user.css').read_text()
IPHONE_CSS=(ROOT/'overrides/web/iphone.css').read_text().replace(
    '@supports (-webkit-touch-callout: none)', '@supports (display: grid)')
META='<meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,viewport-fit=cover">'
AUTH='<main class="gold-web gold-auth"><section><input aria-label="البريد"></section><section style="height:1800px">استمارة مطولة</section></main>'
WORKSPACE='''<div class="gold-web workspace"><div class="workspace-main">
 <header class="topbar">الرئيسية</header>
 <main class="workspace-content"><input aria-label="الوزن"><div style="height:1800px">محتوى</div></main>
 <nav class="mobile-bottom-nav"><button class="mobile-tab">الرئيسية</button></nav>
 </div></div>'''

def page_html(content):
    return f'<!doctype html><html lang="ar"><head>{META}<style>{USER_CSS}{IPHONE_CSS}{CSS}</style></head><body><div id="root">{content}</div></body></html>'

IPHONE_UA='Mozilla/5.0 (iPhone; CPU iPhone OS 17_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.6 Mobile/15E148 Safari/604.1'

with sync_playwright() as p:
    browser=p.webkit.launch(headless=True)
    try:
        for w,h in [(320,680),(390,844),(430,932),(844,390)]:
            context=browser.new_context(viewport={'width':w,'height':h},
                 device_scale_factor=3,has_touch=True,is_mobile=True,user_agent=IPHONE_UA)
            for kind,html in [('auth',AUTH),('workspace',WORKSPACE)]:
                page=context.new_page()
                page.set_content(page_html(html))
                page.add_script_tag(content=JS)
                state=page.evaluate("""() => ({
                  locked:document.documentElement.classList.contains('dh-iphone-page-lock'),
                  bodyPos:getComputedStyle(document.body).position,
                  bodyOverflow:getComputedStyle(document.body).overflow,
                  bodyRect:document.body.getBoundingClientRect().toJSON(),
                  outerHeight:document.scrollingElement.scrollHeight,
                  visibleHeight:document.scrollingElement.clientHeight,
                  scale:visualViewport.scale,
                  meta:document.querySelector('meta[name=viewport]').content
                })""")
                assert state['locked'] and state['bodyPos']=='fixed', state
                assert state['outerHeight']<=state['visibleHeight']+2, state
                assert state['bodyRect']['width']<=w+2, state
                assert 'user-scalable=no' in state['meta'],state
                page.evaluate('window.scrollTo(0,300)')
                assert page.evaluate('window.scrollY')==0
                container='.gold-auth' if kind=='auth' else '.workspace-content'
                page.locator(container).evaluate('(el)=>{el.scrollTop=el.scrollHeight}')
                scroll=page.locator(container).evaluate('(el)=>el.scrollTop')
                assert scroll>150,(w,h,kind,scroll)
                gesture=page.evaluate("""() => {
                  let e=new Event('gesturestart',{bubbles:true,cancelable:true});
                  return document.dispatchEvent(e);
                }""")
                assert gesture is False, (w,h,kind,'gesture allowed')
                multitouch=page.evaluate("""() => {
                  const ev=new Event('touchmove',{bubbles:true,cancelable:true});
                  Object.defineProperty(ev,'touches',{value:[{},{}]});
                  return document.dispatchEvent(ev);
                }""")
                assert multitouch is False,(w,h,kind,'pinch allowed')
                print(f'PASS iPhone WebKit {w}x{h} {kind}: no outer scroll or gesture zoom; inner scroll works',flush=True)
                page.close()
            context.close()
        d=browser.new_context(viewport={'width':1280,'height':800})
        pg=d.new_page()
        pg.set_content(page_html(AUTH))
        pg.add_script_tag(content=JS)
        assert pg.evaluate("!document.documentElement.classList.contains('dh-iphone-page-lock')")
        print('PASS Desktop: preview iPhone lock is inactive',flush=True)
        d.close()
    finally:
        browser.close()
