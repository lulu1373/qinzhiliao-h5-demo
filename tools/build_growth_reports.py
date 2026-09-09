"""Keep the root and /latest H5 entries in sync without changing archived versions."""
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
entry = ROOT / 'index.html'
html = entry.read_text()
controller = (ROOT / 'assets/growth-milestone-controller.js').read_text() + '\n' + (ROOT / 'assets/growth-report-controller.js').read_text()
begin, end = '/* BEGIN GROWTH REPORT CONTROLLER */', '/* END GROWTH REPORT CONTROLLER */'
block = begin + '\n' + controller + '\n' + end + '\n'
if begin in html:
    html = re.sub(re.escape(begin) + r'.*?' + re.escape(end) + r'\n?', lambda _: block, html, flags=re.S)
else:
    marker = '/* V9.0 initialization */'
    assert marker in html
    html = html.replace(marker, block + '\n' + marker, 1)
styles = ['growth-report.css', 'growth-milestone.css']
scripts = ['growth-report-model.js', 'growth-report-view.js', 'growth-milestone-model.js', 'growth-milestone-view.js']
for name in styles:
    tag = f'<link rel="stylesheet" href="assets/{name}">'
    if tag not in html:
        html = html.replace('</head>', tag + '</head>', 1)
for name in scripts:
    tag = f'<script src="assets/{name}"></script>'
    if tag not in html:
        html = html.replace('<script>', tag + '\n<script>', 1)
entry.write_text(html)
(ROOT / 'latest/index.html').write_text(html)
for name in styles + scripts:
    shutil.copyfile(ROOT / 'assets' / name, ROOT / 'latest/assets' / name)
print('Root and latest growth reports synchronized.')
