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
  const data={first_name:'Camille',last_name:'Exemple',nickname:'Cam',email:'cam@example.org'};
  assert.equal(await backend.register(data),'reference');
  assert.equal(calls[0][0],config.supabaseUrl+'/rest/v1/rpc/register_participant');
  assert.deepEqual(JSON.parse(calls[0][1].body),data);
  assert.equal(calls[0][1].headers.Authorization,undefined);
  await assert.rejects(backend.registrations(),/Connectez-vous/);
  assert.equal(calls.length,1);
});
test('an authenticated user without organizer membership cannot read via client', async () => {
  const replies=[response({access_token:'test'}),response([])];
  const backend=createBackend(config,async()=>replies.shift());
  await assert.rejects(backend.signIn('a@example.org','test'),/accès organisateur/);
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
