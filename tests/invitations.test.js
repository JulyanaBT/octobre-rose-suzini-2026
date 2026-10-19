import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import vm from 'node:vm';
import {stripTypeScriptTypes} from 'node:module';
const source=stripTypeScriptTypes((await readFile(new URL('../supabase/functions/club-access/index.ts',import.meta.url),'utf8')).replace(/^import .*\n/,''));
function harness(results){
 const calls=[];let handler;
 const service={from(table){const steps=[];const q={then(resolve,reject){calls.push({table,steps});return Promise.resolve(results.shift()).then(resolve,reject);}};for(const op of ['select','eq','is','order','in','insert','update','single','maybeSingle','not'])q[op]=(...args)=>{steps.push([op,...args]);return q;};return q;},auth:{getUser:async()=>({data:{user:{id:'owner'}}}),admin:{createUser:async data=>{calls.push({createUser:data});return results.shift();}}}};
 vm.runInNewContext(source,{createClient:()=>service,Deno:{env:{get:()=>''},serve:h=>handler=h},crypto,TextEncoder,Response,Date,Set,Uint8Array,JSON,encodeURIComponent});
 return {calls,run:body=>handler(new Request('https://example.test',{method:'POST',headers:{Authorization:'Bearer test','Content-Type':'application/json'},body:JSON.stringify(body)}))};
}
test('admin generates invitation with only username and assigned events, no auth user or email',async()=>{
 const h=harness([{data:{user_id:'owner'}},{data:[{id:'event'}]},{data:{id:'invite',username:'maite',user_id:null}},{data:{id:'invite'}}]);
 const r=await h.run({action:'create',username:'maite',event_ids:['event']});assert.equal(r.status,200);const result=await r.json();assert.match(result.link,/type=club&token_hash=[a-f0-9]{64}$/);assert.equal(h.calls.some(c=>c.createUser),false);
 const record=h.calls.find(c=>c.steps?.some(s=>s[0]==='insert')).steps.find(s=>s[0]==='insert')[1];assert.equal(record.email,undefined);assert.equal(record.username,'maite');
 const update=h.calls.at(-1).steps.find(s=>s[0]==='update')[1];assert.equal(update.invitation_hash.length,64);assert.notEqual(update.invitation_hash,result.link.split('token_hash=')[1]);
});
test('invalid or expired invitation never creates an auth user',async()=>{
 const h=harness([{data:{id:'invite',enabled:true,invite_expires_at:'2000-01-01'}}]);const r=await h.run({action:'activate',type:'club',token_hash:'a'.repeat(64),email:'person@example.test',password:'test-only-password'});assert.equal(r.status,400);assert.equal(h.calls.some(c=>c.createUser),false);
});
test('valid invitation uses recipient email and server-derived invitation identity',async()=>{
 const h=harness([{data:{id:'real-id',username:'maite',enabled:true,invite_expires_at:new Date(Date.now()+60000).toISOString()}},{error:null}]);const r=await h.run({action:'activate',type:'club',token_hash:'a'.repeat(64),username:'tampered',email:'PERSON@example.test',password:'test-only-password'});assert.equal(r.status,200);assert.deepEqual(await r.json(),{username:'maite'});assert.equal(h.calls.at(-1).createUser.email,'person@example.test');assert.equal(h.calls.at(-1).createUser.app_metadata.club_invitation_id,'real-id');
});
test('failed auth creation does not modify an existing user',async()=>{
 const h=harness([{data:{id:'real-id',enabled:true,invite_expires_at:new Date(Date.now()+60000).toISOString()}},{error:{message:'already exists'}}]);const r=await h.run({action:'activate',type:'club',token_hash:'a'.repeat(64),email:'existing@example.test',password:'test-only-password'});assert.equal(r.status,400);assert.equal(h.calls.length,2);
});
const october='20261024-0000-4000-8000-000000000001';
test('direct creation requires administrator and never accepts caller event scope',async()=>{
 const denied=harness([{data:null}]);assert.equal((await denied.run({action:'create_password',username:'Maite',password:'test-only-password'})).status,403);
 const h=harness([{data:{user_id:'owner'}},{data:{id:'account',username:'maite',enabled:true,event_ids:[october]}},{error:null},{error:null}]);
 const r=await h.run({action:'create_password',username:'Maite',password:'test-only-password',event_ids:['other']});assert.equal(r.status,200);
 const insert=h.calls.find(c=>c.steps?.some(s=>s[0]==='insert')).steps.find(s=>s[0]==='insert')[1];assert.deepEqual(Array.from(insert.event_ids),[october]);assert.equal(insert.username,'maite');
 const auth=h.calls.at(-1).createUser;assert.equal(auth.app_metadata.club_invitation_id,'account');assert.equal(auth.email,'account@accounts.invalid');assert.equal(auth.password,'test-only-password');assert.equal((await r.json()).link.endsWith('#club'),true);
});
test('password reset rejects suspended and protected administrator accounts',async()=>{
 const suspended=harness([{data:{user_id:'owner'}},{data:{id:'account',enabled:false,event_ids:[october]}}]);assert.equal((await suspended.run({action:'set_password',user_id:'account',password:'test-only-password'})).status,400);
 const protectedAccount=harness([{data:{user_id:'owner'}},{data:{id:'account',enabled:true,user_id:'admin2',event_ids:[october]}},{data:{user_id:'admin2'}}]);assert.equal((await protectedAccount.run({action:'set_password',user_id:'account',password:'test-only-password'})).status,403);
});

test('six-character initial password is accepted and five is rejected',async()=>{
 const h=harness([{data:{user_id:'owner'}},{data:{id:'account',username:'maite',enabled:true,event_ids:[october]}},{error:null},{error:null}]);assert.equal((await h.run({action:'create_password',username:'maite',password:'abc123'})).status,200);
 const short=harness([{data:{user_id:'owner'}}]);assert.equal((await short.run({action:'create_password',username:'maite',password:'abc12'})).status,400);
});
test('own profile reads are bound to the authenticated user',async()=>{
 const h=harness([{data:{id:'own',username:'maite',email:'own@accounts.invalid'}}]);const r=await h.run({action:'profile',user_id:'other'});assert.equal(r.status,200);assert.deepEqual(await r.json(),{username:'maite',email:''});assert.equal(h.calls[0].steps.some(s=>s[0]==='eq'&&s[1]==='user_id'&&s[2]==='owner'),true);
 const denied=harness([{data:null}]);assert.equal((await denied.run({action:'profile'})).status,403);
});
