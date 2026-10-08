import sys
from pathlib import Path

root=Path(sys.argv[1])
javascript='\n'.join(p.read_text(errors='ignore') for p in root.rglob('*.js'))
css='\n'.join(p.read_text(errors='ignore') for p in root.rglob('*.css'))

assert 'User Web 1.5.0' in javascript, 'The current user workspace is missing from the export'
assert 'workspace-content' in javascript, 'User workspace markup is missing'
assert 'mobile-bottom-nav' in javascript and 'approved-services-grid' in javascript, 'Mockup seven-tab user navigation is missing'
assert 'calc-total-card' in javascript, 'Approved calculator screen is missing'
assert '/prices/history?currency=' in javascript and '/prices/latest?currency=' in javascript, 'Backend price endpoints are missing from the user build'
assert 'raw.githubusercontent.com/ibr7h/gold-app-pwa/main/prices-live.json' not in javascript, 'Legacy GitHub live-price source leaked into the user build'
assert 'raw.githubusercontent.com/ibr7h/gold-app-pwa/main/prices-history.json' not in javascript, 'Legacy GitHub price-history source leaked into the user build'
html_paths=[p.relative_to(root).as_posix().lower() for p in root.rglob('*.html')]
forbidden_routes=('trader-home','trader-orders','trader-clients','trader-reports','trader-location','trader-messages','trader-notifications','admin-users','admin-invites','admin-permissions','admin-stats','admin-settings')
assert not any(any(route in path for route in forbidden_routes) for path in html_paths), 'Trader/Admin HTML routes leaked into the User export'
assert '.desktop-nav' in css and '.form-grid' in css, 'Responsive stylesheet missing'
assert '.mobile-bottom-nav' in css, 'Mobile bottom navigation styles are missing'
assert '@media' in css and '800px' in css, 'Mobile breakpoint missing'
css_lower=css.lower()
assert '#001f3f' in css_lower and '#c5a021' in css_lower and '#d4af37' in css_lower, 'Fixed Dhahabi identity colors are missing'
assert 'approved-services-grid' in css and 'repeat(7,minmax(0,1fr))' in css.replace(' ', ''), 'Mockup service grid or seven-tab navigation stylesheet is missing'
assert 'mockup-login-container' in css and 'mockup-biometric-circle' in css and 'mockup-guest-btn' in css, 'User login does not match the approved mockup structure'

print('Verified: User Web 1.5, fixed Dhahabi identity colors, seven-tab navigation, and responsive layout are included in the exported build.')
