import sys
from pathlib import Path

root=Path(sys.argv[1])
javascript='\n'.join(p.read_text(errors='ignore') for p in root.rglob('*.js'))
css='\n'.join(p.read_text(errors='ignore') for p in root.rglob('*.css'))

assert 'User Web 1.3.2' in javascript, 'The current user workspace is missing from the export'
assert 'workspace-content' in javascript, 'User workspace markup is missing'
assert 'mobile-bottom-nav' in javascript, 'Mobile navigation markup is missing'
assert '.desktop-nav' in css and '.form-grid' in css, 'Responsive stylesheet missing'
assert '.mobile-bottom-nav' in css, 'Mobile bottom navigation styles are missing'
assert '@media' in css and '800px' in css, 'Mobile breakpoint missing'
css_lower=css.lower()
assert '#061b32' in css_lower and '#c5a021' in css_lower, 'Dhahabi visual baseline colors are missing'

print('Verified: current user workspace, Dhahabi visual baseline, and responsive navigation are included in the exported build.')
