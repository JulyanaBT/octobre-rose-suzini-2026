import test from 'node:test';
import assert from 'node:assert/strict';
import {createBackend} from '../backend.js';
const config = {supabaseUrl:'https://example.supabase.co',publishableKey:'sb_publishable_test'};
const response = (data, status=200) => new Response(JSON.stringify(data), {status});
test('configuration refuses secret keys and non-Supabase endpoints', () => {
  assert.throws(()=>createBackend({...config,publishableKey:'sb_secret_do-not-use'}));
  assert.throws(()=>createBackend({...config,supabaseUrl:'https://example.com'}));
});
test('public registration sends only a write RPC and no bearer token', async () => {
  const calls=[];
  const backend=createBackend(config, async (...args)=>{calls.push(args);return response('reference');});
  const data={first_name:'Camille',last_name:'Exemple',nickname:'Cam',wants_bt:true,wants_tennis:false};
  assert.equal(await backend.register(data),'reference');
  assert.equal(calls[0][0],config.supabaseUrl+'/rest/v1/rpc/register_sports_participant');
  assert.deepEqual(JSON.parse(calls[0][1].body),data);
  assert.equal(calls[0][1].headers.Authorization,undefined);
  await assert.rejects(backend.registrations(),/Connectez-vous/);
  assert.equal(calls.length,1);
});
test('an authenticated user without organizer membership cannot read via client', async () => {
  const replies=[response({access_token:'test'}),response([]),response([])];
  const backend=createBackend(config,async()=>replies.shift());
  await assert.rejects(backend.signIn('a@example.org','test'),/événement ne vous est attribué/);
  await assert.rejects(backend.registrations(),/Connectez-vous/);
});
test('organizer session is cleared even when logout network call fails', async () => {
  const replies=[response({access_token:'test'}),response([{user_id:'organizer'}])];
  const backend=createBackend(config,async()=>{if(replies.length)return replies.shift();throw new Error('offline');});
  await backend.signIn('a@example.org','test');
  await assert.rejects(backend.signOut());
  await assert.rejects(backend.registrations(),/Connectez-vous/);
});
test('closed or missing settings never open registration', async () => {
  const backend=createBackend(config,async()=>response([]));
  assert.deepEqual(await backend.settings(),{open:false});
});
test('server closure message is surfaced, database internals are hidden', async () => {
  const replies=[response({code:'P0001',message:'Les inscriptions ne sont pas encore ouvertes.'},400),response({message:'private internal SQL'},500)];
  const backend=createBackend(config,async()=>replies.shift());
  await assert.rejects(backend.register({}),/pas encore ouvertes/);
  await assert.rejects(backend.register({}),/Impossible de terminer/);
});
test('network failure never claims registration success or retries automatically', async () => {
  let count=0;
  const backend=createBackend(config,async()=>{count++;throw new Error('offline');});
  await assert.rejects(backend.register({}),/réception n’a pas pu être confirmée/);
  assert.equal(count,1);
});
test('club membership grants club identity, never admin identity', async () => {
  const replies=[response({access_token:'club'}),response([]),response([{event_id:'assigned'}])];
  const backend=createBackend(config,async()=>replies.shift());
  await backend.signIn('club@example.org','test');
  assert.equal(backend.role(),'club');
});
test('admin identity requires server organizer membership', async () => {
  const replies=[response({access_token:'admin'}),response([{user_id:'admin'}])];
  const backend=createBackend(config,async()=>replies.shift());
  await backend.signIn('admin@example.org','test');
  assert.equal(backend.role(),'admin');
});
function memoryStorage(){const map=new Map();return {getItem:k=>map.get(k)||null,setItem:(k,v)=>map.set(k,v),removeItem:k=>map.delete(k)};}
test('restores and rotates persisted session, revalidating role on server',async()=>{
 const storage=memoryStorage();let replies=[response({access_token:'one',refresh_token:'r1',expires_in:3600}),response([{user_id:'owner'}])];
 const first=createBackend(config,async()=>replies.shift(),storage);await first.signIn('owner@example.org','password');
 const calls=[];replies=[response({access_token:'two',refresh_token:'r2',expires_in:3600}),response([{user_id:'owner'}])];
 const second=createBackend(config,async(...args)=>{calls.push(args);return replies.shift();},storage);assert.equal(await second.restore(),true);assert.equal(second.role(),'admin');assert.equal(JSON.parse(calls[0][1].body).refresh_token,'r1');assert.equal(calls[1][1].headers.Authorization,'Bearer two');
});
test('revoked refresh token clears remembered session',async()=>{
 const storage=memoryStorage();storage.setItem('suzini-session-example.supabase.co',JSON.stringify({access_token:'old',refresh_token:'revoked',expires_at:1}));
 const backend=createBackend(config,async()=>response({},400),storage);assert.equal(await backend.restore(),false);assert.equal(storage.getItem('suzini-session-example.supabase.co'),null);await assert.rejects(backend.events(),/Connectez-vous/);
});
test('network outage does not discard remembered refresh token',async()=>{
 const storage=memoryStorage();storage.setItem('suzini-session-example.supabase.co',JSON.stringify({access_token:'old',refresh_token:'valid',expires_at:1}));
 const backend=createBackend(config,async()=>{throw Error('offline');},storage);await assert.rejects(backend.restore());assert.ok(storage.getItem('suzini-session-example.supabase.co'));
});
test('access management requires an authenticated token',async()=>{
 let calls=0;const backend=createBackend(config,async()=>{calls++;return response({});});await assert.rejects(backend.access({action:'list'}),/Connectez-vous/);assert.equal(calls,0);
});
test('username sign-in delegates to server and never assumes admin',async()=>{
 const calls=[],replies=[response({session:{access_token:'club',refresh_token:'refresh',expires_in:3600}}),response([]),response([{event_id:'assigned'}])];
 const backend=createBackend(config,async(...args)=>{calls.push(args);return replies.shift();},memoryStorage());await backend.signIn('maite','test-password');assert.equal(backend.role(),'club');assert.equal(JSON.parse(calls[0][1].body).action,'login');
});
test('Club writes require authentication and send event-scoped RPCs', async()=>{
 const calls=[];let replies=[];
 const backend=createBackend(config,async(...args)=>{calls.push(args);return replies.shift();},memoryStorage());
 await assert.rejects(backend.saveRegistration({}),/Connectez-vous/);
 await assert.rejects(backend.setParticipation({}),/Connectez-vous/);
 assert.equal(calls.length,0);
 replies=[response({access_token:'club'}),response([]),response([{event_id:'assigned'}])];
 await backend.signIn('club@example.org','test');
 replies=[response([{id:'person',version:1,present:true,activity:'prevention'}])];
 const payload={p_event:'assigned',p_id:'person',p_version:0,p_present:true,p_activity:'prevention'};
 const row=await backend.setParticipation(payload);
 assert.equal(row.activity,'prevention');assert.equal(row.version,1);
 const [url,request]=calls.at(-1);
 assert.match(url,/rpc\/club_set_participation$/);assert.equal(request.headers.Authorization,'Bearer club');assert.deepEqual(JSON.parse(request.body),payload);
 replies=[response({code:'P0001',message:'Cette fiche a été modifiée par un autre gestionnaire.'},400)];
 await assert.rejects(backend.setParticipation(payload),/autre gestionnaire/);
});
test('registration control is authenticated and event scoped; public reads event opening',async()=>{
 const calls=[],replies=[response([{registration_open:false}])];
 const backend=createBackend(config,async(...args)=>{calls.push(args);return replies.shift();},memoryStorage());
 assert.deepEqual(await backend.settings(),{open:false});assert.match(calls[0][0],/events\?select=registration_open&id=eq\./);
 await assert.rejects(backend.setRegistrationOpen({p_event:'foreign',p_open:true,p_version:0}),/Connectez-vous/);
 replies.push(response({access_token:'club'}),response([]),response([{event_id:'mine'}]),response([{registration_open:true,registration_version:2}]),response({open:false,version:3}));
 await backend.signIn('club@example.org','test');assert.deepEqual(await backend.registrationSettings('mine'),{open:true,version:2});
 assert.deepEqual(await backend.setRegistrationOpen({p_event:'mine',p_open:false,p_version:2}),{open:false,version:3});
 assert.equal(calls.at(-1)[1].headers.Authorization,'Bearer club');
});

test('public sports read needs no session and calls only the public projection',async()=>{
 let call;const api=createBackend({supabaseUrl:'https://test.supabase.co',publishableKey:'sb_publishable_test'},async(url,options)=>{call={url,options};return {ok:true,json:async()=>({players:[],matches:[]})};},null);
 assert.deepEqual(await api.publicBeach('event-demo'),{players:[],matches:[]});
 assert.equal(call.url,'https://test.supabase.co/rest/v1/rpc/public_bt');
 assert.equal(call.options.headers.Authorization,undefined);
 assert.deepEqual(JSON.parse(call.options.body),{p_event:'event-demo'});
});
test('public participant list uses only the dedicated anonymous read projection', async()=>{
 const calls=[]; const rows=[{nickname:'Cam',wants_bt:true,wants_tennis:true}];
 const backend=createBackend(config,async(...args)=>{calls.push(args);return response(rows);});
 assert.deepEqual(await backend.publicParticipants('event-test'),rows);
 assert.equal(calls[0][0],config.supabaseUrl+'/rest/v1/rpc/public_participants');
 assert.deepEqual(JSON.parse(calls[0][1].body),{p_event:'event-test'});
 assert.equal(calls[0][1].headers.Authorization,undefined);
 await assert.rejects(backend.registrations('event-test'),/Connectez-vous/);
});
test('manager overview requires an authenticated administrator RPC',async()=>{
 const calls=[];const replies=[response({access_token:'test'}),response([{user_id:'owner'}]),response({accounts:[]})];
 const api=createBackend(config,async(...args)=>{calls.push(args);return replies.shift();});
 await api.signIn('owner@example.invalid','test');
 assert.deepEqual(await api.access({action:'list'}),{accounts:[]});
 assert.equal(calls.at(-1)[0],config.supabaseUrl+'/rest/v1/rpc/admin_club_accounts');
 assert.equal(calls.at(-1)[1].headers.Authorization,'Bearer test');
});
test('activity recording requires a session and is throttled',async()=>{
 const calls=[];const replies=[response({access_token:'test'}),response([{user_id:'owner'}]),response(null)];
 const api=createBackend(config,async(...args)=>{calls.push(args);return replies.shift();});
 await api.activity();assert.equal(calls.length,0);
 await api.signIn('owner@example.invalid','test');await api.activity();await api.activity();
 assert.equal(calls.length,3);assert.equal(calls.at(-1)[0],config.supabaseUrl+'/rest/v1/rpc/record_club_activity');
 assert.equal(calls.at(-1)[1].headers.Authorization,'Bearer test');
});
test('manager deletion requires auth and sends only account id to the protected RPC',async()=>{
 const calls=[];const replies=[response({access_token:'test'}),response([{user_id:'owner'}]),response(null)];
 const api=createBackend(config,async(...args)=>{calls.push(args);return replies.shift();});
 await assert.rejects(api.access({action:'delete',user_id:'fixture'}),/Connectez-vous/);
 await api.signIn('owner@example.invalid','test');await api.access({action:'delete',user_id:'fixture'});
 assert.equal(calls.at(-1)[0],config.supabaseUrl+'/rest/v1/rpc/delete_club_manager');
 assert.deepEqual(JSON.parse(calls.at(-1)[1].body),{p_account:'fixture'});
});
