const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const index = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'assets/card-motion-v2.css'), 'utf8');
const motion = fs.readFileSync(path.join(root, 'assets/card-motion-v2.js'), 'utf8');

test('card reveal stage keeps the conversation visible and removes modal chrome', () => {
  assert.doesNotMatch(index, /class="card-reveal-close"/);
  assert.match(index, /data-stage="card-reveal"/);
  assert.match(css, /\.app-frame\.card-reveal-open[^{]*\{/);
  assert.match(css, /background:\s*transparent/);
});

test('card reveal entry rises after depth staging and action controls wait 800ms', () => {
  assert.match(css, /card-reveal-rise/);
  assert.match(css, /scale\(\.72\)\s*translateY\(80px\)/);
  assert.match(index, /CARD_REVEAL_ACTION_DELAY_MS\s*=\s*800/);
  assert.match(index, /const actionDelay[\s\S]*?setTimeout\(\(\)\s*=>\s*\{[\s\S]*?is-front-ready[\s\S]*?\},actionDelay\)/);
});

test('stage timing preserves the existing motion engine with a 600ms flip', () => {
  assert.match(motion, /edge-flash/);
  assert.match(motion, /reveal-bloom/);
  assert.match(motion, /card-reveal-layer/);
  assert.match(motion, /stageDur=scene\.closest\('\.card-reveal-layer'\)\?600/);
});


test('fixed interpretation reveal keeps four labeled modules in a scrollable larger front face', () => {
  assert.match(index, /run\.result=\{title:'解读卡·亲子翻译',[^\n]*modules:/);
  for (const heading of ['本次片段','值得记住的理解','你的担心与期待','下次可以试试']) {
    assert.ok(index.includes(heading), `missing fixed interpretation heading: ${heading}`);
  }
  assert.match(index, /class="card-reading-scroll reveal-item"/);
  assert.match(css, /\.card-reading-scroll\{[\s\S]*?overflow-y:auto/);
  assert.match(css, /\.card-reveal-layer\.is-front \.card-reveal-card-host \.v90-card-scene\.motion-card-scene\.has-reading-modules\{[\s\S]*?width:min\(86%,326px\)!important/);
  assert.match(index, /card-reveal-layer is-entering[^`]*has-reading-modules/);
});
