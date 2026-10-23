import test from 'node:test';import assert from 'node:assert/strict';import {playerStats} from '../raquettes.js';
test('player statistics deduplicate bench turns across courts and separate completed matches',()=>{const matches=[{roundNumber:1,teamA:['a','b'],teamB:['c','d'],bench:['i'],status:'pending'},{roundNumber:1,teamA:['e','f'],teamB:['g','h'],bench:['i'],status:'completed'},{roundNumber:2,teamA:['a','i'],teamB:['b','c'],bench:[],status:'completed'}];const i=playerStats('i',matches);assert.equal(i.turns,2);assert.equal(i.bench,1);assert.equal(i.ratio,50);assert.equal(i.completed,1);assert.equal(i.partners.get('a'),1);assert.equal(i.opponents.get('b'),1);const a=playerStats('a',matches);assert.equal(a.scheduled,2);assert.equal(a.completed,1);assert.equal(a.opponents.get('c'),2);});

import {beachStatus,beachParticipation} from '../raquettes.js';
import {generateRound} from '../engine.js';
test('BT status distinguishes unassigned from inactive and maps all activities',()=>{
 for(const status of ['bt','inactive','tennis','prevention','unspecified']){const data=beachParticipation(status);assert.equal(beachStatus({present:data.p_present,activity:data.p_activity}),status);}
 assert.equal(beachStatus({present:false,activity:'bt'}),'inactive');
 assert.throws(()=>beachParticipation('other'));
});
test('round generation excludes every non-BT status',()=>{
 const players=Array.from({length:8},(_,i)=>({id:String(i),name:'J'+i,present:true,activity:'bt'}));
 for(const status of ['inactive','tennis','prevention','unspecified']){const d=beachParticipation(status);players.push({id:status,name:status,present:d.p_present,activity:d.p_activity});}
 const matches=generateRound(players,[],1);
 const ids=matches.flatMap(m=>[...m.teamA,...m.teamB,...m.bench]);
 assert.equal(ids.length>0,true);assert.equal(ids.every(id=>/^\d$/.test(id)),true);
});
