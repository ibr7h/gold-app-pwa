import sys
from pathlib import Path
root=Path(sys.argv[1])
javascript='\n'.join(p.read_text() for p in root.rglob('*.js'))
css='\n'.join(p.read_text() for p in root.rglob('*.css'))
assert 'User Web 1.1' in javascript, 'The user workspace is missing from the export'
assert 'workspace-content' in javascript, 'User workspace markup is missing'
assert '.desktop-nav' in css and '.form-grid' in css, 'Responsive stylesheet missing'
assert '@media' in css and '800px' in css, 'Mobile breakpoint missing'
print('Verified: user workspace and responsive styles are included in the exported build.')
