import test from 'node:test';
import assert from 'node:assert/strict';
import {generateRound,ranking,canChangeActivity} from '../engine.js';
const players=Array.from({length:12},(_,i)=>({id:String(i),name:`P${i}`,present:true,activity:i<10?'bt':'tennis'}));
test('Two courts, unique players, correct bench, tennis players excluded',()=>{
 for(let i=0;i<8;i++){
 const ms=generateRound(players,[],1);assert.equal(ms.length,2);
 const ids=ms.flatMap(m=>[...m.teamA,...m.teamB]);assert.equal(new Set(ids).size,8);
 assert.ok(ids.every(id=>Number(id)<10));assert.equal(ms[0].bench.length,2);
 assert.ok(ms[0].bench.every(id=>!ids.includes(id)));assert.deepEqual(ms[0].bench,ms[1].bench);
 }
});
test('Four players use one court; fewer than four cannot generate',()=>{
 assert.equal(generateRound(players.slice(0,4),[],1).length,1);
 assert.throws(()=>generateRound(players.slice(0,3),[],1));
});
test('Pending match prevents transfer, bench may transfer, completed match releases',()=>{
 const ms=generateRound(players,[],1);const id=ms[0].teamA[0];assert.equal(canChangeActivity(id,ms),true);
 assert.equal(canChangeActivity(ms[0].bench[0],ms),true);ms[0].status='completed';assert.equal(canChangeActivity(id,ms),true);
});
test('Ranking retains best ten, counts all wins and allocates round bonus once',()=>{
 const ms=Array.from({length:12},(_,i)=>({roundNumber:i+1,teamA:['0','1'],teamB:['2','3'],bench:['4'],scoreA:6,scoreB:2,status:'completed'}));
 const rows=ranking(players,ms);const r=rows.find(r=>r.id==='0');assert.equal(r.points,20);assert.equal(r.played,12);assert.equal(r.counted,10);assert.equal(r.bonus,24);assert.equal(r.scored,84);assert.equal(r.diff,64);
 assert.equal(rows.find(r=>r.id==='4').bonus,24);assert.equal(rows.find(r=>r.id==='10').bonus,0);
});
test('Bench bonus counted once per round even with two courts; no points before scores',()=>{
 const ms=generateRound(players,[],1);const rows=ranking(players,ms);assert.equal(rows.find(r=>r.id===ms[0].bench[0]).bonus,2);assert.ok(rows.every(r=>r.points===0));
});
test('Corrections recompute ranking and ignore drawn scores',()=>{
 const m={roundNumber:1,teamA:['0','1'],teamB:['2','3'],bench:[],scoreA:6,scoreB:2,status:'completed'};
 assert.equal(ranking(players,[m]).find(r=>r.id==='0').points,2);m.scoreB=8;assert.equal(ranking(players,[m]).find(r=>r.id==='0').points,1);m.scoreA=8;assert.equal(ranking(players,[m]).find(r=>r.id==='0').points,0);
});
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
test('Ranking matches the original implementation on mixed results and benches',()=>{
 const source=readFileSync(new URL('./original-ranking.txt',import.meta.url),'utf8');
 const from=source.indexOf('function getRounds()');const to=source.length;
 const original=source.slice(from,to);
 const ps=players.map(p=>({...p,surnom:p.name}));
 const ms=Array.from({length:13},(_,i)=>({roundNumber:i+1,teamA:['0','1'],teamB:['2','3'],bench:['4','5'],scoreA:i%3?6:3,scoreB:i%3?2:6,status:i===12?'pending':'completed'}));
 const context={players:ps,matches:ms,getNickname:p=>p.surnom};vm.createContext(context);vm.runInContext(original,context);
 const old=vm.runInContext('computeRanking()',context);const current=ranking(ps,ms);
 assert.deepEqual(current.map(r=>r.id),Array.from(old,r=>r.id));
 for(const r of current){const o=old.find(o=>o.id===r.id);assert.equal(r.points,o.rankingMatchPoints);assert.equal(r.diff,o.rankingDiff);assert.equal(r.scored,o.rankingScored);assert.equal(r.bonus,o.bonusGamePoints);}
});
