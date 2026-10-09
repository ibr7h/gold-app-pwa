"""Prepare the existing archived User app with the same compatibility patches as CI.

No new application scaffold. Uses only User overrides and strips non-User routes
from the temporary build directory, as the production workflow already does.
"""
import os
import shutil
import subprocess
import sys
import zipfile
from pathlib import Path

repo = Path(__file__).resolve().parents[3]
destination = Path(sys.argv[1]).resolve()
destination.mkdir(parents=True, exist_ok=True)
archive_root = 'gold-app 17 apr 15-19 adimin icon'
with zipfile.ZipFile(repo / (archive_root + '.zip')) as archive:
    archive.extractall(destination)
source = destination / archive_root
source.rename(destination / 'user-app')
source = destination / 'user-app'
# Reuse the unchanged production-compatible web patches rather than maintaining
# another copy of its generated services, Expo configuration, or native stubs.
workflow = (repo / '.github/workflows/check-user-web.yml').read_text()
section = workflow.split('      - name: Apply web-only PWA compatibility patches\n', 1)[1]
block = section.split('        run: |\n', 1)[1].split('\n      - name:', 1)[0]
script = '\n'.join(line[10:] if line.startswith('          ') else line for line in block.splitlines())
subprocess.run(['bash', '-c', script], cwd=source, env={**os.environ, 'SRC': str(source)}, check=True)
shutil.copytree(repo / 'apps/user/overrides', source, dirs_exist_ok=True)
identity = source / 'web/app-version.ts'
identity.write_text(identity.read_text().replace('__USER_BUILD_SHA__', os.environ['GITHUB_SHA'][:8]))
routes = 'chat admin new-order new-client admin-stats admin-users trader-home order-detail admin-invites trader-orders admin-settings trader-clients trader-reports trader-location trader-messages admin-permissions trader-notifications'.split()
for route in routes:
    for suffix in ('.tsx', '.web.tsx', '.jsx', '.js'):
        for file in (source / 'app').rglob(route + suffix):
            file.unlink()
print(source)
