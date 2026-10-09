"""User signup regression with real local HTTP/DB and captured test-only mail.

Requires scripts/start-registration-fixture.cjs in the backend repository.
Never sends external messages; never run against production.
"""
import argparse
import json
from pathlib import Path
import secrets
import time
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright, expect

parser = argparse.ArgumentParser()
parser.add_argument('--site', default='http://127.0.0.1:8082/gold-app-pwa/full/')
parser.add_argument('--api', default='http://127.0.0.1:3001')
parser.add_argument('--mailbox', default='/workspace/.onboarding/registration-mailbox.json')
parser.add_argument('--screenshots', default='/workspace/artifacts')
args = parser.parse_args()
for target in [args.site, args.api]:
    assert urlparse(target).hostname in ('127.0.0.1', 'localhost'), 'Local fixtures only'
artifacts = Path(args.screenshots)
artifacts.mkdir(parents=True, exist_ok=True)

with sync_playwright() as p:
    browser = p.chromium.launch(executable_path='/usr/bin/chromium', args=['--no-sandbox'])
    context = browser.new_context(viewport={'width': 390, 'height': 844}, service_workers='block')
    email = f'registration_{time.time_ns()}@example.test'
    password = 'Disposable-signup-48!'
    phone = '05' + str(secrets.randbelow(100000000)).zfill(8)
    observed = {'registers': 0, 'verified': False}

    def local_api(route):
        try:
            path = route.request.url.removeprefix('https://gold-app-api-u8dl.onrender.com')
            response = route.fetch(url=args.api + path)
            if path == '/auth/register':
                observed['registers'] += 1
                body = route.request.post_data_json
                assert body['phone'] == '+966' + phone[1:]
                assert response.status == 201
                result = response.json()
                assert all(key not in result for key in ['code', 'accessToken', 'refreshToken'])
                observed['id'] = result['registrationId']
            if path == '/auth/register/verify' and response.status == 201:
                observed['verified'] = True
                # Keep reusable credentials private, only for absence assertions below.
                observed['tokens'] = response.json()
            route.fulfill(response=response)
        except Exception:
            raise RuntimeError('Local signup request failed; private request details withheld') from None

    context.route('https://gold-app-api-u8dl.onrender.com/**', local_api)
    page = context.new_page()
    errors = []
    page.on('pageerror', lambda error: errors.append(str(error)))
    page.goto(args.site)
    page.get_by_role('button', name='إنشاء حساب مستخدم جديد', exact=True).click()
    send = page.get_by_role('button', name='إرسال رمز التحقق بالبريد', exact=True)
    expect(send).to_be_enabled(timeout=15000)
    page.get_by_label('الاسم الكامل', exact=True).fill('مستخدم الاختبار')
    page.get_by_label('البريد الإلكتروني', exact=True).fill(email)
    page.get_by_label('كلمة المرور', exact=True).fill(password)
    page.get_by_label('تأكيد كلمة المرور', exact=True).fill(password)
    mobile = page.get_by_label('رقم الجوال')
    assert mobile.get_attribute('required') is not None
    send.click()
    assert observed['registers'] == 0
    mobile.fill('12345')
    send.click()
    expect(page.get_by_role('alert')).to_contain_text('رقم جوال صحيحًا')
    assert observed['registers'] == 0
    mobile.fill(phone)
    for width in [320, 390, 768, 1440]:
        page.set_viewport_size({'width': width, 'height': 900})
        assert not page.evaluate('document.documentElement.scrollWidth > innerWidth')
    page.set_viewport_size({'width': 390, 'height': 844})
    page.screenshot(path=str(artifacts / 'dhahabi-registration-phone.png'), full_page=True)
    send.click()
    expect(page.get_by_role('heading', name='تحقق من بريدك الإلكتروني')).to_be_visible(timeout=15000)
    assert observed['registers'] == 1 and not observed['verified']
    expect(page.locator('.registration-email')).to_have_text(email)
    expect(page.locator('.registration-resend')).to_be_disabled()
    expect(page.locator('.reference-home')).to_have_count(0)
    storage = page.evaluate('JSON.stringify(localStorage)')
    assert password not in storage and observed['id'] not in storage
    assert page.get_by_label('رمز التحقق', exact=True).input_value() == ''
    # Show the verification layout without capturing the actual private code.
    page.screenshot(path=str(artifacts / 'dhahabi-registration-email.png'), full_page=True)
    code = json.loads(Path(args.mailbox).read_text())[email]
    login = context.request.post(args.api + '/auth/login', data={'email': email, 'password': password})
    assert login.status == 401, 'Unconfirmed account must not log in'
    wrong = '999999' if code != '999999' else '888888'
    page.get_by_label('رمز التحقق', exact=True).fill(wrong)
    page.get_by_role('button', name='تأكيد الرمز وإنشاء الحساب', exact=True).click()
    expect(page.get_by_role('alert')).to_contain_text('انتهت صلاحيته')
    assert not observed['verified']
    arabic = ''.join(chr(ord('٠') + int(digit)) for digit in code)
    page.get_by_label('رمز التحقق', exact=True).fill(arabic)
    page.get_by_role('button', name='تأكيد الرمز وإنشاء الحساب', exact=True).click()
    expect(page.locator('.reference-home')).to_be_visible(timeout=15000)
    assert observed['verified']
    storage = page.evaluate('JSON.stringify(localStorage)')
    assert password not in storage and code not in storage
    assert all(value not in storage for value in observed['tokens'].values() if isinstance(value, str) and len(value) > 50)
    assert not errors, 'Unexpected browser errors'
    context.unroute_all(behavior='wait')
    context.close()

    # A disabled/missing provider configuration must not offer a successful signup.
    unavailable = browser.new_context(service_workers='block')
    unavailable.route('https://gold-app-api-u8dl.onrender.com/auth/registration/config',
        lambda route: route.fulfill(status=200, json={'enabled': False, 'channel': 'email', 'codeLength': 6}))
    page = unavailable.new_page()
    page.goto(args.site)
    page.get_by_role('button', name='إنشاء حساب مستخدم جديد', exact=True).click()
    expect(page.get_by_role('button', name='إرسال رمز التحقق بالبريد', exact=True)).to_be_disabled()
    expect(page.get_by_role('status')).to_contain_text('غير متاح')
    expect(page.get_by_role('button', name='تسجيل الدخول', exact=True)).to_be_enabled()
    unavailable.close()
    browser.close()
    print('PASS: required/normalized phone; actual local signup API; no account/session before email verification; wrong and Arabic code; resend cooldown; no stored credentials/OTP; disabled-provider fallback; responsive 320–1440px')
