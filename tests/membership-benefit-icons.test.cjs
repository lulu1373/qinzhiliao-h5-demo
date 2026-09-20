const test=require('node:test');
const assert=require('node:assert/strict');
const I=require('../assets/membership-benefit-icons.js');

test('member benefits use one dimensional icon family',()=>{
  assert.deepEqual(I.names,['relation','report','guide','growth','family','agent']);
  for(const name of I.names){
    const svg=I.render(name);
    assert.match(svg,/member-benefit-art/);
    assert.match(svg,/linearGradient/);
    assert.match(svg,/feDropShadow/);
    assert.match(svg,/viewBox="0 0 64 64"/);
  }
});

test('member benefit gradients are isolated per render',()=>{
  const a=I.render('relation');
  const b=I.render('relation');
  assert.notEqual(a.match(/linearGradient id="([^"]+)a"/)[1],b.match(/linearGradient id="([^"]+)a"/)[1]);
});
