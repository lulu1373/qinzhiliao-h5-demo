"""Keep the root and /latest H5 entries in sync without changing archived versions."""
from pathlib import Path
import re
import shutil

ROOT = Path(__file__).resolve().parents[1]
entry = ROOT / 'index.html'
html = entry.read_text()
controller = (ROOT / 'assets/growth-report-controller.js').read_text()
begin, end = '/* BEGIN GROWTH REPORT CONTROLLER */', '/* END GROWTH REPORT CONTROLLER */'
block = begin + '\n' + controller + '\n' + end + '\n'
if begin in html:
    html = re.sub(re.escape(begin) + r'.*?' + re.escape(end) + r'\n?', lambda _: block, html, flags=re.S)
else:
    marker = '/* V9.0 initialization */'
    assert marker in html
    html = html.replace(marker, block + '\n' + marker, 1)
style = '<link rel="stylesheet" href="assets/growth-report.css">'
if style not in html:
    html = html.replace('</head>', style + '</head>', 1)
scripts = '<script src="assets/growth-report-model.js"></script>\n<script src="assets/growth-report-view.js"></script>\n'
if 'src="assets/growth-report-model.js"' not in html:
    html = html.replace('<script>', scripts + '<script>', 1)
entry.write_text(html)
(ROOT / 'latest/index.html').write_text(html)
for name in ['growth-report-model.js', 'growth-report-view.js', 'growth-report.css']:
    shutil.copyfile(ROOT / 'assets' / name, ROOT / 'latest/assets' / name)
print('Root and latest growth reports synchronized.')
