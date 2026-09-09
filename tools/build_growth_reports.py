"""Keep the root and /latest H5 entries in sync without changing archived versions."""
from pathlib import Path
import re
import shutil
import hashlib

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
styles += ['experience.css', 'experience-home.css', 'card-practice.css']
scripts += ['experience-model.js', 'experience-view.js', 'card-practice.js']
experience = (ROOT / 'assets/experience-controller.js').read_text()
xp_begin, xp_end = '/* BEGIN EXPERIENCE CONTROLLER */', '/* END EXPERIENCE CONTROLLER */'
xp_block = xp_begin + '\n' + experience + '\n' + xp_end + '\n'
if xp_begin in html:
    html = re.sub(re.escape(xp_begin) + r'.*?' + re.escape(xp_end) + r'\n?', lambda _: xp_block, html, flags=re.S)
else:
    html = html.replace('/* V9.0 initialization */', xp_block + '\n/* V9.0 initialization */', 1)
for name in styles:
    digest = hashlib.sha256((ROOT / 'assets' / name).read_bytes()).hexdigest()[:10]
    tag = f'<link rel="stylesheet" href="assets/{name}?v={digest}">'
    pattern = r'<link rel="stylesheet" href="assets/' + re.escape(name) + r'(?:\?[^\"]*)?">'
    if re.search(pattern, html):
        html = re.sub(pattern, lambda _: tag, html)
    else:
        html = html.replace('</head>', tag + '</head>', 1)
for name in scripts:
    digest = hashlib.sha256((ROOT / 'assets' / name).read_bytes()).hexdigest()[:10]
    tag = f'<script src="assets/{name}?v={digest}"></script>'
    pattern = r'<script src="assets/' + re.escape(name) + r'(?:\?[^\"]*)?"></script>'
    if re.search(pattern, html):
        html = re.sub(pattern, lambda _: tag, html)
    else:
        html = html.replace('<script>', tag + '\n<script>', 1)
entry.write_text(html)
(ROOT / 'latest/index.html').write_text(html)
for name in styles + scripts:
    shutil.copyfile(ROOT / 'assets' / name, ROOT / 'latest/assets' / name)
print('Root and latest growth reports synchronized.')
