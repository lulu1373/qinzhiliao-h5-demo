const test=require('node:test');
const assert=require('node:assert/strict');
const I=require('../assets/icon-system-v3.js');

test('global icon system v3 owns all high-traffic drawer feature icons',()=>{
  assert.deepEqual(I.names,[
    'classroom','learning','assessment','community','growth','treasure',
    'task','notification','archive','membership','help'
  ]);
  for(const name of I.names){
    const svg=I.render(name);
    assert.match(svg,/app-feature-icon-v3/);
    assert.match(svg,/linearGradient/);
    assert.match(svg,/feDropShadow/);
    assert.match(svg,/viewBox="0 0 64 64"/);
  }
});

test('global icon system generates unique gradient ids',()=>{
  const a=I.render('classroom');
  const b=I.render('classroom');
  assert.notEqual(a.match(/linearGradient id="([^"]+)a"/)[1],b.match(/linearGradient id="([^"]+)a"/)[1]);
});
