import test from 'node:test';
import assert from 'node:assert/strict';
import {massageTime,massageRows} from '../massage.js';
test('six 15-minute massages separated by 10 minutes end before 18h',()=>{
 assert.deepEqual(Array.from({length:6},(_,i)=>massageTime(i)),['15h30 – 15h45','15h55 – 16h10','16h20 – 16h35','16h45 – 17h00','17h10 – 17h25','17h35 – 17h50']);
});
test('public availability never exposes participant identity or editing controls',()=>{
 const html=massageRows([{slot:0,reserved:true,nickname:'Private Name',participant_id:'secret'}]);
 assert.match(html,/Réservé/);assert.doesNotMatch(html,/Private Name|secret|button/);
 assert.match(massageRows([{slot:0,reserved:false}]),/Disponible/);
});
test('Club rows escape nickname and support assigning or releasing bookings',()=>{
 const html=massageRows([{slot:0,participant_id:'a',nickname:'<script>'},{slot:1}],true);
 assert.match(html,/&lt;script&gt;/);assert.match(html,/Modifier/);assert.match(html,/Attribuer/);
});
