"""Verify the User home reference with real quotes and disposable local accounts.

Requires Python Playwright and Chromium. Never run against production services.
"""
import argparse
from datetime import datetime, timezone
from pathlib import Path
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect
from local_registration import register_local

parser = argparse.ArgumentParser()
parser.add_argument('--site', default='http://127.0.0.1:8082/gold-app-pwa/full/')
parser.add_argument('--api', default='http://127.0.0.1:3001')
parser.add_argument('--mailbox', default='/workspace/.onboarding/registration-mailbox.json')
parser.add_argument('--screenshots', default='/workspace/artifacts')
args = parser.parse_args()
for url in (args.site, args.api):
    assert urlparse(url).hostname in ('127.0.0.1', 'localhost'), 'Use disposable local services only'
artifacts = Path(args.screenshots)
artifacts.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 432, 'height': 1098}, service_workers='block')
    email = f'home_{time.time_ns()}@example.test'
    password = 'Disposable-Home-48!'
    tokens = register_local(context.request, args.api, email, password, args.mailbox)
    auth = {'Authorization': 'Bearer ' + tokens['accessToken']}

    def local_write(path, payload):
        try:
            response = context.request.post(args.api + path, data=payload, headers=auth)
            assert response.status == 201, 'Local fixture creation failed'
            return response.json()
        except Exception:
            raise RuntimeError('Local fixture request failed; credentials withheld') from None

    sar_price = context.request.get(args.api + '/prices/latest?currency=SAR&karat=24').json()
    usd_price = context.request.get(args.api + '/prices/latest?currency=USD&karat=24').json()
    assert sar_price and usd_price, 'Refresh actual provider quotes in the disposable backend first'
    portfolio = local_write('/portfolio', {'name': 'محفظة الاختبار المحلي'})
    for currency, weight, row in [('SAR', 88.25, sar_price), ('USD', 10, usd_price)]:
        unit = float(row['buyPrice']) * .96
        local_write('/portfolio/purchase', {'portfolioId': portfolio['id'], 'currency': currency,
            'karat': 24, 'weightGrams': weight, 'unitPrice': unit, 'totalPrice': weight * unit,
            'purchasedAt': datetime.now(timezone.utc).isoformat()})
    local_write('/alerts', {'currency': 'SAR', 'karat': 24,
        'direction': 'above', 'targetPrice': float(sar_price['buyPrice']) * 2})

    observed = {}
    offline = {'enabled': False}

    def local_api(route):
        try:
            path = route.request.url.removeprefix('https://gold-app-api-u8dl.onrender.com')
            if offline['enabled'] and path.startswith('/prices/'):
                route.abort('failed')
                return
            response = route.fetch(url=args.api + path)
            if path.startswith('/prices/latest?currency=SAR&karat=24') and response.status == 200:
                observed['quote'] = response.json()
            route.fulfill(response=response)
        except Exception:
            raise RuntimeError('Local API routing failed; request details withheld') from None

    context.route('https://gold-app-api-u8dl.onrender.com/**', local_api)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.site)
    page.get_by_label('البريد الإلكتروني', exact=True).fill(email)
    page.get_by_label('كلمة المرور', exact=True).fill(password)
    page.get_by_role('button', name='تسجيل الدخول', exact=True).click()
    expect(page.locator('.reference-home')).to_be_visible(timeout=15000)
    expect(page.locator('.portfolio-delta')).to_be_visible(timeout=15000)
    expect(page.locator('.dh-trend-line')).to_be_visible(timeout=15000)
    page.wait_for_load_state('networkidle')

    def money_label(amount):
        return page.evaluate('amount=>new Intl.NumberFormat("ar-SA", {minimumFractionDigits:2,maximumFractionDigits:2}).format(amount)+" \\u20c1"', amount)

    # Gold, weight, and portfolio data are from real local HTTP responses.
    expect(page.locator('.price-tag-large .dh-money')).to_have_attribute('aria-label', money_label(float(observed['quote']['buyPrice'])))
    expect(page.locator('.portfolio-mini-body > div:first-child > strong .dh-money')).to_have_attribute('aria-label', money_label(float(observed['quote']['buyPrice']) * 88.25))
    expect(page.locator('.portfolio-mini-body > div:first-child > span')).to_contain_text('٨٨٫٢٥')
    expect(page.locator('.home-currency-note')).to_be_visible()
    expect(page.locator('.home-topbar h1')).to_contain_text(email)
    expect(page.locator('.notification-dot')).to_be_visible()
    expect(page.locator('.mobile-bottom-nav button')).to_have_count(5)
    expect(page.get_by_text('عرض حصري', exact=True)).to_have_count(0)
    expect(page.locator('.price-tag-large .dh-riyal-svg')).to_be_visible()
    for label in ['يوم', 'أسبوع', 'شهر']:
        button = page.locator('.dh-trend-controls').get_by_role('button', name=label, exact=True)
        button.click()
        expect(button).to_have_attribute('aria-pressed', 'true')
        expect(page.locator('.dh-trend-line')).to_be_visible()
    page.locator('.dh-trend-controls').get_by_role('button', name='يوم', exact=True).click()

    for width, height in [(320, 740), (375, 812), (390, 844), (432, 1098), (768, 1024), (1024, 900), (1440, 1000)]:
        page.set_viewport_size({'width': width, 'height': height})
        layout = page.evaluate('''() => {
          const rect=selector=>document.querySelector(selector).getBoundingClientRect();
          const grid=[...document.querySelectorAll('.approved-service-item')].map(el=>el.getBoundingClientRect());
          const nav=rect('.mobile-bottom-nav'), header=rect('.home-topbar');
          return {overflow:document.documentElement.scrollWidth>innerWidth,
            gridTops:grid.map(r=>r.top), gridWidths:grid.map(r=>r.width),
            priceOverflow:document.querySelector('.live-price-card').scrollWidth>rect('.live-price-card').width+1,
            headerTop:header.top, navBottom:nav.bottom,
            cardColor:getComputedStyle(document.querySelector('.live-price-card')).backgroundColor};
        }''')
        assert not layout['overflow'] and not layout['priceOverflow'], f'Home overflows at {width}'
        assert max(layout['gridTops']) - min(layout['gridTops']) < 1, f'Services are not one row at {width}'
        assert min(layout['gridWidths']) >= 60, f'Services too narrow at {width}'
        assert layout['cardColor'] == 'rgb(255, 255, 255)'
        if width <= 800:
            assert abs(layout['navBottom'] - height) <= 1
            page.locator('.workspace-content').evaluate('el=>el.scrollTop=el.scrollHeight')
            assert page.locator('.home-topbar').bounding_box()['y'] == layout['headerTop']
            page.locator('.workspace-content').evaluate('el=>el.scrollTop=0')
        if width == 432:
            page.screenshot(path=str(artifacts / 'dhahabi-home-mobile.png'))
        if width == 1440:
            page.screenshot(path=str(artifacts / 'dhahabi-home-desktop.png'))

    page.set_viewport_size({'width': 390, 'height': 844})
    # Changing the Prices screen cannot change the home market's currency or karat.
    page.locator('.approved-services-grid').get_by_role('button', name='أسعار اليوم', exact=True).click()
    page.locator('.inline-select select').nth(0).select_option('USD')
    page.locator('.inline-select select').nth(1).select_option('21')
    page.wait_for_load_state('networkidle')
    page.locator('.mobile-bottom-nav').get_by_role('button', name='الرئيسية', exact=True).click()
    expect(page.get_by_text('حركة السوق (عيار 24)', exact=True)).to_be_visible()
    expect(page.locator('.price-tag-large .dh-riyal-svg')).to_be_visible()
    # Test keyboard inspection of actual saved prices.
    chart = page.locator('.dh-trend-plot')
    chart.focus()
    chart.press('Home')
    expect(chart).to_have_attribute('aria-valuenow', '0')
    chart.press('End')
    expect(page.locator('.home-chart-selection .dh-money')).to_be_visible()
    page.get_by_role('button', name='فتح التنبيهات', exact=True).click()
    expect(page.get_by_role('button', name='تنبيه جديد', exact=True)).to_be_visible()
    page.locator('.mobile-bottom-nav').get_by_role('button', name='الرئيسية', exact=True).click()
    page.get_by_role('button', name='فتح قائمة التنقل', exact=True).click()
    expect(page.get_by_role('dialog', name='قائمة التنقل')).to_be_visible()
    page.get_by_role('button', name='إغلاق القائمة', exact=True).click()
    page.locator('.mobile-bottom-nav').get_by_role('button', name='الحاسبة', exact=True).click()
    expect(page.locator('.calculator-form')).to_be_visible()
    page.locator('.mobile-bottom-nav').get_by_role('button', name='المزيد', exact=True).click()
    page.get_by_role('button', name='الملف الشخصي', exact=True).click()
    expect(page.get_by_text('الدخول السريع والأمان', exact=True)).to_be_visible()
    expect(page.locator('.mobile-bottom-nav').get_by_role('button', name='المزيد', exact=True)).to_have_attribute('aria-current', 'page')
    page.locator('.mobile-bottom-nav').get_by_role('button', name='الرئيسية', exact=True).click()
    saved_price = page.locator('.price-tag-large .dh-money').get_attribute('aria-label')
    offline['enabled'] = True
    page.get_by_role('button', name='تحديث أسعار الذهب من خادم ذهبي', exact=True).click()
    expect(page.locator('.live-card-top')).to_contain_text('آخر سعر محفوظ')
    expect(page.locator('.price-tag-large .dh-money')).to_have_attribute('aria-label', saved_price)
    page.wait_for_load_state('networkidle')
    context.unroute_all(behavior='wait')
    assert not errors, errors
    print('PASS: actual home quotes and SAR-only holdings; four services; five tabs; day/week/month; 320–1440px; fixed header/nav; real-data chart keyboard inspection; offline last-price label; all navigation; no fabricated offer')
    browser.close()
