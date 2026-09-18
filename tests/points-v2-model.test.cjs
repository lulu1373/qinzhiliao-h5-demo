const test=require('node:test');
const assert=require('node:assert/strict');
const M=require('../assets/points-v2-model.js');

function seed(amount=0){
  return {points:{ledger:amount?[{entryId:'seed',kind:'earn',amount,remaining:amount,expiresAt:'2027-09-18T00:00:00.000Z',sourceType:'demo',sourceId:'seed',sourceDay:'2026-09-18',occurredAt:'2026-09-18T00:00:00.000Z'}]:[]}};
}

test('daily checkin is idempotent and uses the seven day reward schedule',()=>{
  let course=seed(),meta=M.normalizeMeta({});
  const dates=['2026-09-12T08:00:00+08:00','2026-09-13T08:00:00+08:00','2026-09-14T08:00:00+08:00','2026-09-15T08:00:00+08:00','2026-09-16T08:00:00+08:00','2026-09-17T08:00:00+08:00','2026-09-18T08:00:00+08:00'];
  const grants=[];
  for(const now of dates){const r=M.claimCheckin(course,meta,now);course=r.course;meta=r.meta;grants.push(r.grant);}
  assert.deepEqual(grants,[2,2,3,2,3,3,5]);
  const dup=M.claimCheckin(course,meta,'2026-09-18T09:00:00+08:00');
  assert.equal(dup.grant,0);assert.equal(dup.already,true);
  assert.equal(M.streak(course,'2026-09-18'),7);
});

test('level uses lifetime earned and does not fall after redemption',()=>{
  const course=seed(300),meta=M.normalizeMeta({});
  assert.equal(M.levelInfo(course).current.level,3);
  const r=M.redeem(course,meta,'reward-tools','2026-09-18T10:00:00+08:00');
  assert.equal(M.availableBalance(r.course,'2026-09-18T10:01:00+08:00'),180);
  assert.equal(M.levelInfo(r.course).current.level,3);
  assert.equal(r.meta.rewards.length,1);
});

test('tasks count per source type and respect community three-per-day structure',()=>{
  let course=seed(),r;
  r=M.addEarn(course,'community_post','p1',1,'2026-09-18T08:00:00+08:00',{dailyLimit:3});course=r.course;
  r=M.addEarn(course,'community_post','p2',1,'2026-09-18T09:00:00+08:00',{dailyLimit:3});course=r.course;
  r=M.addEarn(course,'card_saved','c1',3,'2026-09-18T09:10:00+08:00',{dailyLimit:1});course=r.course;
  const tasks=M.taskStatus(course,'2026-09-18T12:00:00+08:00');
  assert.equal(tasks.find(x=>x.id==='community').count,2);
  assert.equal(tasks.find(x=>x.id==='community').done,false);
  assert.equal(tasks.find(x=>x.id==='card').done,true);
});

test('calendar marks checked, missed, today and future days',()=>{
  let course=seed(),meta=M.normalizeMeta({});
  for(const d of ['2026-09-16T08:00:00+08:00','2026-09-17T08:00:00+08:00']){const r=M.claimCheckin(course,meta,d);course=r.course;meta=r.meta;}
  const cells=M.calendar(course,'2026-09','2026-09-18T12:00:00+08:00');
  assert.equal(cells.find(x=>x.day==='2026-09-17').checked,true);
  assert.equal(cells.find(x=>x.day==='2026-09-18').today,true);
  assert.equal(cells.find(x=>x.day==='2026-09-15').missed,true);
  assert.equal(cells.find(x=>x.day==='2026-09-19').future,true);
});

test('generic earn is source-id idempotent',()=>{
  const one=M.addEarn(seed(),'chat_summary','conv1',1,'2026-09-18T08:00:00+08:00');
  const two=M.addEarn(one.course,'chat_summary','conv1',1,'2026-09-18T09:00:00+08:00');
  assert.equal(one.grant,1);assert.equal(two.grant,0);
});