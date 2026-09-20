const test=require('node:test');
const assert=require('node:assert/strict');
const I=require('../assets/settings-icons-v2.js');

test('settings primary navigation uses one soft dimensional icon family',()=>{
  assert.deepEqual(I.names,['account','notification','location','privacy','help','about']);
  for(const name of I.names){
    const svg=I.render(name);
    assert.match(svg,/settings-soft3d-icon/);
    assert.match(svg,/linearGradient/);
    assert.match(svg,/feDropShadow/);
    assert.match(svg,/viewBox="0 0 64 64"/);
  }
});

test('settings icon gradients are isolated per render',()=>{
  const a=I.render('account');
  const b=I.render('account');
  assert.notEqual(a.match(/linearGradient id="([^"]+)a"/)[1],b.match(/linearGradient id="([^"]+)a"/)[1]);
});
