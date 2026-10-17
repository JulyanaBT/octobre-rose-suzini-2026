import { createClient } from 'npm:@supabase/supabase-js@2';
const url = Deno.env.get('SUPABASE_URL')!;
const service = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {auth:{persistSession:false,autoRefreshToken:false}});
const authClient = () => createClient(url,Deno.env.get('SUPABASE_ANON_KEY')!,{auth:{persistSession:false,autoRefreshToken:false}});
const site = 'https://julyanabt.fr/octobre-rose-suzini-2026/';
const origins = new Set(['https://julyanabt.fr','http://127.0.0.1:8765']);
Deno.serve(async req => {
 const origin=req.headers.get('origin') || '';
 const headers={'Content-Type':'application/json','Cache-Control':'no-store','Access-Control-Allow-Origin':origins.has(origin)?origin:'https://julyanabt.fr','Vary':'Origin','Access-Control-Allow-Headers':'authorization,apikey,content-type,x-client-info','Access-Control-Allow-Methods':'POST,OPTIONS'};
 const reply=(data:unknown,status=200)=>new Response(JSON.stringify(data),{status,headers});
 if(req.method==='OPTIONS')return new Response(null,{headers});
 if(req.method!=='POST'||(origin&&!origins.has(origin)))return reply({error:'Requête non autorisée.'},403);
 try {
 const body=await req.json();
 if(body.action==='login'){
  const username=String(body.username||'').trim().toLowerCase();
  const {data:account}=await service.from('club_accounts').select('email,enabled,activated_at').eq('username',username).maybeSingle();
  const client=authClient();
  const {data,error}=await client.auth.signInWithPassword({email:account?.email||'unknown-account@invalid.example',password:String(body.password||'')});
  if(error||!account?.enabled||!account.activated_at)return reply({error:'Identifiant ou mot de passe incorrect, ou accès désactivé.'},401);
  return reply({session:data.session});
 }
 if(body.action==='activate'){
  const password=String(body.password||'');
  if(password.length<12||password.length>128)return reply({error:'Choisissez un mot de passe de 12 à 128 caractères.'},400);
  if(!['invite','recovery'].includes(body.type)||typeof body.token_hash!=='string')return reply({error:'Invitation invalide.'},400);
  const username=String(body.username||'').trim().toLowerCase();
  const email=String(body.email||'').trim().toLowerCase();
  const {data:expected}=await service.from('club_accounts').select('user_id,email').eq('username',username).maybeSingle();
  if(!expected||expected.email!==email)return reply({error:'Vérifiez l’identifiant et l’e-mail indiqués par l’administrateur.'},400);
  const client=authClient();
  const {data,error}=await client.auth.verifyOtp({token_hash:body.token_hash,type:body.type});
  if(error||!data.user||!data.session||data.user.id!==expected.user_id)return reply({error:'Ce lien est expiré ou déjà utilisé. Demandez une nouvelle invitation.'},400);
  const {data:account}=await service.from('club_accounts').select('*').eq('user_id',data.user.id).maybeSingle();
  if(!account?.enabled||account.activated_at||!account.invite_expires_at||Date.parse(account.invite_expires_at)<Date.now())return reply({error:'Invitation expirée ou annulée.'},403);
  const {error:passwordError}=await service.auth.admin.updateUserById(data.user.id,{password,email_confirm:true});
  if(passwordError)throw new Error('Ce mot de passe ne peut pas être enregistré. Demandez un nouveau lien.');
  const {error:assignError}=await service.rpc('finish_club_activation',{target_user:data.user.id});
  if(assignError)throw new Error('Activation interrompue. Demandez une nouvelle invitation.');
  return reply({username:account.username});
 }
 const bearer=req.headers.get('authorization')?.replace(/^Bearer /i,'');
 if(!bearer)return reply({error:'Connexion administrateur requise.'},401);
 const {data:userData,error:userError}=await service.auth.getUser(bearer);
 if(userError||!userData.user)return reply({error:'Connexion expirée.'},401);
 const {data:owner}=await service.from('organizers').select('user_id').eq('user_id',userData.user.id).maybeSingle();
 if(!owner)return reply({error:'Accès réservé à l’administrateur.'},403);
 if(body.action==='list'){
  const {data,error}=await service.from('club_accounts').select('user_id,username,display_name,email,enabled,event_ids,activated_at,invite_expires_at,invitation_sent_at').order('created_at');
  if(error)throw new Error('Gestion des accès indisponible.');
  return reply({accounts:data});
 }
 if(body.action==='mark_sent'){
  const {error}=await service.from('club_accounts').update({invitation_sent_at:new Date().toISOString()}).eq('user_id',body.user_id).is('activated_at',null);
  if(error)throw new Error('Mise à jour impossible.');return reply({ok:true});
 }
 if(body.action==='update'){
  if(!Array.isArray(body.event_ids)||typeof body.enabled!=='boolean')return reply({error:'Droits invalides.'},400);
  const {error}=await service.rpc('apply_club_assignments',{target_user:body.user_id,assigned_events:body.event_ids,access_enabled:body.enabled});
  if(error)throw new Error('Impossible de modifier ces droits.');
  return reply({ok:true});
 }
 if(body.action==='create'||body.action==='reinvite'){
  let account;

  if(body.action==='create'){
   const username=String(body.username||'').trim().toLowerCase();
   const display_name=String(body.display_name||'').trim();
   const email=String(body.email||'').trim().toLowerCase();
   if(!/^[a-z][a-z0-9_-]{1,29}$/.test(username)||!display_name||display_name.length>80||!/^\S+@\S+\.\S+$/.test(email)||!Array.isArray(body.event_ids)||!body.event_ids.length)return reply({error:'Vérifiez le prénom, l’identifiant, l’e-mail et les événements.'},400);
   const {data:events,error:eventsError}=await service.from('events').select('id').in('id',body.event_ids);
   if(eventsError||events?.length!==new Set(body.event_ids).size)return reply({error:'Événement inconnu.'},400);
   const {data:existing}=await service.from('club_accounts').select('user_id').eq('username',username);
   if(existing?.length)return reply({error:'Cet identifiant est déjà utilisé.'},409);
   const {data:created,error}=await service.auth.admin.createUser({email,email_confirm:false,user_metadata:{display_name}});
   if(error||!created.user)return reply({error:'Cet e-mail est déjà utilisé ou ne peut pas être invité.'},409);
   account={user_id:created.user.id,username,display_name,email,event_ids:body.event_ids,enabled:true,invite_expires_at:new Date(Date.now()+3600000).toISOString()};
   const {error:saveError}=await service.from('club_accounts').insert(account);
   if(saveError){await service.auth.admin.deleteUser(created.user.id);return reply({error:'Cet identifiant ou cet e-mail est déjà utilisé.'},409);}

  }else{
   const {data}=await service.from('club_accounts').select('*').eq('user_id',body.user_id).maybeSingle();
   if(!data||data.activated_at||!data.enabled)return reply({error:'Cette invitation ne peut pas être renouvelée.'},400);
   account=data;
  }
  // Recovery token activates only this pending, non-admin Club account.
  const {data:generated,error}=await service.auth.admin.generateLink({type:'recovery',email:account.email});
  if(error||!generated.properties?.hashed_token)throw new Error('Le compte est réservé, mais le lien n’a pas été généré. Utilisez « Renouveler le lien ».');
  const expires=new Date(Date.now()+3600000).toISOString();
  const {error:expiryError}=await service.from('club_accounts').update({invite_expires_at:expires,invitation_sent_at:null}).eq('user_id',account.user_id);
  if(expiryError)throw new Error('Impossible de renouveler cette invitation.');
  return reply({user_id:account.user_id,username:account.username,expires_at:expires,link:`${site}#activation?username=${encodeURIComponent(account.username)}&type=recovery&token_hash=${encodeURIComponent(generated.properties.hashed_token)}`});
 }
 return reply({error:'Action inconnue.'},400);
 }catch{return reply({error:'Opération impossible. Actualisez la liste avant de réessayer.'},400);}
});
