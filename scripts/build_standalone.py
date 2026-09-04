from pathlib import Path
import base64, mimetypes, re

root=Path(__file__).resolve().parents[1]
html=(root/'index.html').read_text(encoding='utf-8')
css=(root/'styles.css').read_text(encoding='utf-8')
js=(root/'app.js').read_text(encoding='utf-8')

def data_uri(path:Path)->str:
    mime=mimetypes.guess_type(path.name)[0] or 'application/octet-stream'
    return f'data:{mime};base64,'+base64.b64encode(path.read_bytes()).decode('ascii')

# Embed every referenced asset path in CSS and JS.
for path in sorted((root/'assets').rglob('*')):
    if not path.is_file():
        continue
    rel='./'+path.relative_to(root).as_posix()
    uri=data_uri(path)
    css=css.replace(rel,uri)
    js=js.replace(rel,uri)

html=re.sub(r'<link\s+rel="stylesheet"\s+href="styles\.css">',f'<style>\n{css}\n</style>',html)
html=html.replace('<script src="app.js"></script>',f'<script>\n{js}\n</script>')
html=html.replace('亲智聊 H5 App Demo V3.0 · 黄金页面质感升级','亲智聊 H5 App Demo V3.0 · 黄金页面质感升级')
(root/'dist').mkdir(exist_ok=True)
(root/'dist'/'index.html').write_text(html,encoding='utf-8')
out=Path('/mnt/data/亲智聊-H5-App-Demo-V3.0-质感升级版.html')
out.write_text(html,encoding='utf-8')
print(out)
print(out.stat().st_size)
