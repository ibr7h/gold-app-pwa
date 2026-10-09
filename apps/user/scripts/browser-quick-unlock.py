"""Smoke the real User bundle against disposable local API data, never production.

Requires Python Playwright and Chromium. Serve the User export at its /gold-app-pwa/full/
base path and start the local NestJS API before running this script.
"""
import argparse
import re
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--site', default='http://127.0.0.1:8082/gold-app-pwa/full/')
parser.add_argument('--api', default='http://127.0.0.1:3000')
args = parser.parse_args()
for url in (args.site, args.api):
    assert urlparse(url).hostname in ('127.0.0.1', 'localhost'), 'Use disposable local services only'

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block')
    email = f'quick_unlock_{time.time_ns()}@example.test'
    password = 'Disposable-QuickUnlock-48!'
    registered = context.request.post(args.api + '/auth/register', data={'email': email, 'password': password})
    assert registered.status == 201
    tokens = registered.json()
    page = context.new_page()
    errors = []
    observed = {}
    page.on('pageerror', lambda error: errors.append(str(error)))

    def local_api(route):
        try:
            path = route.request.url.removeprefix('https://gold-app-api-u8dl.onrender.com')
            response = route.fetch(url=args.api + path)
            if path.startswith('/prices/latest?currency=SAR&karat=24') and response.status == 200:
                body = response.json()
                if body:
                    observed['unit'] = float(body['buyPrice'])
            route.fulfill(response=response)
        except Exception:
            # Playwright errors can include Authorization headers. Never print them.
            raise RuntimeError('Disposable local API routing failed; request details withheld') from None

    context.route('https://gold-app-api-u8dl.onrender.com/**', local_api)
    page.add_init_script("""window.__credentialRequests=0;
        if(navigator.credentials) {
          const get=navigator.credentials.get.bind(navigator.credentials);
          navigator.credentials.get=(...args)=>{window.__credentialRequests++;return get(...args);};
        }""")

    def login():
        page.get_by_label('البريد الإلكتروني', exact=True).fill(email)
        page.get_by_label('كلمة المرور', exact=True).fill(password)
        page.get_by_role('button', name='تسجيل الدخول', exact=True).click()
        expect(page.locator('.workspace')).to_be_visible(timeout=15000)

    def account():
        page.locator('.mobile-bottom-nav').get_by_role('button', name='المزيد', exact=True).click()
        page.get_by_role('button', name='الملف الشخصي', exact=True).click()
        expect(page.get_by_text('الدخول السريع والأمان', exact=True)).to_be_visible()

    def digits(root, code):
        for digit in code:
            root.get_by_role('button', name='الرقم ' + digit, exact=True).click()

    def setup(code):
        page.get_by_role('switch', name='تفعيل رمز الدخول السريع').click()
        dialog = page.get_by_role('dialog', name='إعداد رمز الدخول السريع')
        digits(dialog, code)
        digits(dialog, code)
        expect(dialog).not_to_be_visible(timeout=15000)
        expect(page.get_by_role('switch', name='تفعيل رمز الدخول السريع')).to_have_attribute('aria-checked', 'true')

    page.goto(args.site)
    login()
    page.get_by_role('button', name='حاسبة الذهب', exact=True).click()
    numbers = page.locator('.calculator-form input[type=number]')
    numbers.nth(0).fill('10')
    numbers.nth(1).fill('20')
    page.locator('.calc-toggle input[type=checkbox]').check()
    expect(page.locator('.calc-total-card > strong .dh-money')).to_be_visible()
    expected_total = page.evaluate('unit => new Intl.NumberFormat("ar-SA", {minimumFractionDigits:2,maximumFractionDigits:2}).format((unit * 10 + 200) * 1.15) + " \u20c1"', observed['unit'])
    expect(page.locator('.calc-breakdown .final .dh-money')).to_have_attribute('aria-label', expected_total)
    expect(page.get_by_text('احتساب ضريبة 15% على قيمة الذهب والمصنعية', exact=True)).to_be_visible()
    account()
    setup('406195')
    stored = page.evaluate('JSON.stringify({...localStorage})')
    assert tokens['accessToken'] not in stored and tokens['refreshToken'] not in stored
    assert 'dhahabi_user_access_token' not in stored and 'dhahabi_user_refresh_token' not in stored
    assert not re.search(r'eyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+', stored)
    assert 'dhahabi_user_session_vault_v1' in stored

    page.reload()
    lock = page.locator('.dh-quick-lock')
    expect(lock).to_be_visible()
    assert page.evaluate('window.__credentialRequests') == 0
    expect(page.locator('.workspace')).not_to_be_visible()
    digits(lock, '999999')
    expect(lock.get_by_role('alert')).to_contain_text('رمز غير صحيح')
    digits(lock, '406195')
    expect(page.locator('.workspace')).to_be_visible(timeout=15000)
    account()

    page.get_by_role('button', name='تغيير رمز الدخول السريع', exact=True).click()
    dialog = page.get_by_role('dialog', name='إعداد رمز الدخول السريع')
    digits(dialog, '406195')
    digits(dialog, '918273')
    digits(dialog, '918273')
    expect(dialog).not_to_be_visible(timeout=15000)
    page.get_by_role('button', name='قفل ذهبي الآن', exact=True).click()
    expect(lock).to_be_visible()
    digits(lock, '406195')
    expect(lock.get_by_role('alert')).to_contain_text('رمز غير صحيح')
    digits(lock, '918273')
    expect(page.locator('.workspace')).to_be_visible(timeout=15000)
    account()

    # Disabling requires the current PIN, rather than trusting an open screen alone.
    page.get_by_role('switch', name='تفعيل رمز الدخول السريع').click()
    dialog = page.get_by_role('dialog', name='إعداد رمز الدخول السريع')
    digits(dialog, '999999')
    expect(dialog.get_by_role('alert')).to_contain_text('رمز الدخول الحالي غير صحيح')
    digits(dialog, '918273')
    expect(dialog).not_to_be_visible(timeout=15000)
    expect(page.get_by_role('switch', name='تفعيل رمز الدخول السريع')).to_have_attribute('aria-checked', 'false')
    page.reload()
    expect(page.get_by_label('كلمة المرور', exact=True)).to_be_visible()
    login()
    account()
    setup('406195')
    page.get_by_role('button', name='قفل ذهبي الآن', exact=True).click()
    page.get_by_role('button', name='نسيت رمز الدخول السريع؟ الدخول بكلمة المرور', exact=True).click()
    expect(page.get_by_label('كلمة المرور', exact=True)).to_be_visible()
    assert page.evaluate('localStorage.getItem("dhahabi_user_session_vault_v1")') is None
    login()
    account()
    expect(page.get_by_role('switch', name='تفعيل رمز الدخول السريع')).to_have_attribute('aria-checked', 'false')
    setup('406195')
    page.get_by_role('button', name='قفل ذهبي الآن', exact=True).click()
    for width, height in [(375, 667), (390, 844), (1024, 768), (1440, 900)]:
        page.set_viewport_size({'width': width, 'height': height})
        expect(lock).to_be_visible()
        assert page.evaluate('document.documentElement.scrollWidth <= window.innerWidth')
    page.set_viewport_size({'width': 390, 'height': 844})
    # A second tab's successful password login invalidates the first tab's account state.
    other = context.new_page()
    other.goto(args.site)
    expect(other.locator('.dh-quick-lock')).to_be_visible()
    other.get_by_role('button', name='نسيت رمز الدخول السريع؟ الدخول بكلمة المرور', exact=True).click()
    expect(page.get_by_label('كلمة المرور', exact=True)).to_be_visible()
    other.get_by_label('البريد الإلكتروني', exact=True).fill(email)
    other.get_by_label('كلمة المرور', exact=True).fill(password)
    other.get_by_role('button', name='تسجيل الدخول', exact=True).click()
    expect(other.locator('.workspace')).to_be_visible(timeout=15000)
    page.wait_for_load_state('networkidle')
    other.wait_for_load_state('networkidle')
    context.unroute_all(behavior='wait')
    assert not errors, errors
    print('PASS: actual-price retail VAT, local User PIN setup, reload lock, wrong/correct unlock, change, disable, password recovery, cross-tab logout, responsive lock, no automatic WebAuthn, and encrypted-only persistence')
    browser.close()
