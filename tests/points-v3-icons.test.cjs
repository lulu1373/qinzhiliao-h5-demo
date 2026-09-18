const test=require('node:test');
const assert=require('node:assert/strict');
const I=require('../assets/points-v3-icons.js');

test('points v3 exposes dimensional icon artwork for all primary reward actions',()=>{
  for(const name of ['checkin','task','chat','card','action','course','community','gift','wallet','medal','history']){
    const svg=I.render(name);
    assert.match(svg,/class="pv3-icon/);
    assert.match(svg,/linearGradient/);
    assert.match(svg,/feDropShadow/);
  }
});

test('points v3 icons use unique gradient ids per render',()=>{
  const a=I.render('checkin'),b=I.render('checkin');
  const idA=a.match(/linearGradient id="([^"]+)a"/)[1];
  const idB=b.match(/linearGradient id="([^"]+)a"/)[1];
  assert.notEqual(idA,idB);
});