export function createBackend(config, fetcher = globalThis.fetch, storage = globalThis.localStorage) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) ||
      !config.publishableKey.startsWith('sb_publishable_')) {
    throw new Error('La connexion aux inscriptions n’est pas encore configurée.');
  }
  const storageKey = 'suzini-session-' + new URL(config.supabaseUrl).hostname;
  let token = null, role = null, session = null, refreshing = null;
  const clear = () => { token=null; role=null; session=null; try { storage?.removeItem(storageKey); } catch {} };
  function remember(data) { session={access_token:data.access_token,refresh_token:data.refresh_token,expires_at:data.expires_at || Math.floor(Date.now()/1000)+(data.expires_in || 3600)}; token=session.access_token; if(session.refresh_token)try { storage?.setItem(storageKey,JSON.stringify(session)); } catch {} }
  async function refresh() {
    if(!session?.refresh_token)throw new Error('Connectez-vous pour accéder aux inscriptions.');
    if(!refreshing)refreshing=request('/auth/v1/token?grant_type=refresh_token',{body:{refresh_token:session.refresh_token}}).then(remember).catch(error=>{if(error.status===400||error.status===401)clear();throw error;}).finally(()=>{refreshing=null;});
    await refreshing;
  }
  async function checkRole() {
    const roles=await request('/rest/v1/organizers?select=user_id',{authorized:true});
    role=roles?.length?'admin':'club';
    if(role==='club'){const memberships=await request('/rest/v1/event_memberships?select=event_id',{authorized:true});if(!memberships?.length){clear();throw new Error('Aucun événement ne vous est attribué. Contactez l’administrateur.');}}
  }
  async function request(path, {body, authorized = false} = {}) {
    const headers = {apikey: config.publishableKey, 'Content-Type': 'application/json'};
    if (authorized) {
      if (session?.refresh_token && session.expires_at <= Date.now()/1000+60) await refresh();
      if (!token) throw new Error('Connectez-vous pour accéder aux inscriptions.');
      headers.Authorization = `Bearer ${token}`;
    }
    let response;
    try {
      response = await fetcher(config.supabaseUrl + path, {
        method: body === undefined ? 'GET' : 'POST', headers,
        ...(body === undefined ? {} : {body: JSON.stringify(body)}),
        signal: AbortSignal.timeout(15000), cache: 'no-store',
      });
    } catch {
      throw new Error('Connexion interrompue. La réception n’a pas pu être confirmée : vérifiez auprès du club avant de réessayer.');
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
      if (response.status === 401) clear();
      const message = path.startsWith('/functions/') && typeof data?.error==='string' ? data.error : data?.code === 'P0001' ? data.message :
        response.status === 401 ? 'Connexion expirée ou identifiants incorrects.' :
        'Impossible de terminer cette opération. Réessayez plus tard.';
      throw Object.assign(new Error(message),{status:response.status});
    }
    return data;
  }
  function registrationRow(data) {
    const row=Array.isArray(data)?data[0]:data;
    if(!row?.id)throw new Error('La réponse n’a pas pu être confirmée. Actualisez la liste avant de réessayer.');
    return row;
  }
  let lastActivity=0;
  async function activity(force=false){if(!token||!role||(!force&&Date.now()-lastActivity<60000))return;lastActivity=Date.now();try{await request('/rest/v1/rpc/record_club_activity',{body:{},authorized:true});}catch(error){lastActivity=0;throw error;}}
  return {
    activity,
    publicMassage:event=>request('/rest/v1/rpc/public_massage',{body:{p_event:event}}),
    clubMassage:event=>request('/rest/v1/rpc/club_massage',{body:{p_event:event},authorized:true}),
    assignMassage:data=>request('/rest/v1/rpc/assign_massage',{body:data,authorized:true}),
    maintenance:()=>request('/rest/v1/rpc/get_site_maintenance',{body:{}}),
    saveMaintenance:data=>request('/rest/v1/rpc/set_site_maintenance',{body:data,authorized:true}),
    async settings() {
      const rows = await request('/rest/v1/events?select=registration_open&id=eq.20261024-0000-4000-8000-000000000001');
      return {open: rows?.[0]?.registration_open === true};
    },
    register: data => request('/rest/v1/rpc/register_sports_participant', {body: data}),
    async signIn(identifier, password) {
      clear();
      const data = identifier.includes('@') ? await request('/auth/v1/token?grant_type=password',{body:{email:identifier,password}}) : (await request('/functions/v1/club-access',{body:{action:'login',username:identifier,password}})).session;
      remember(data);
      try { await checkRole(); } catch(error){ clear(); throw error; }
    },
    async restore() {
      if(token&&role)return true;
      let saved;try{saved=JSON.parse(storage?.getItem(storageKey)||'null');}catch{clear();return false;}
      if(!saved?.refresh_token)return false;
      session=saved;token=saved.access_token;
      try { await refresh();await checkRole();return true; } catch(error){if(error.status===400||error.status===401||!session){clear();return false;}throw error;}
    },
    async signOut() {
      const oldToken=token;clear();
      if(oldToken)await fetcher(config.supabaseUrl+'/auth/v1/logout?scope=local',{method:'POST',headers:{apikey:config.publishableKey,Authorization:`Bearer ${oldToken}`},signal:AbortSignal.timeout(15000)});
    },
    trackInvitation: token => request('/rest/v1/rpc/track_club_invitation',{body:{p_token:token}}),
    access: data => data.action==='delete' ? request('/rest/v1/rpc/delete_club_manager',{body:{p_account:data.user_id},authorized:true}) : data.action==='list' ? request('/rest/v1/rpc/admin_club_accounts',{body:{},authorized:true}) : request('/functions/v1/club-access',{body:data,authorized:true}),
    activate: data => request('/functions/v1/club-access',{body:{...data,action:'activate'}}),
    publicParticipants: eventId => request('/rest/v1/rpc/public_participants',{body:{p_event:eventId}}),
    publicBeach: eventId => request('/rest/v1/rpc/public_bt',{body:{p_event:eventId}}),
    beach: data => request('/rest/v1/rpc/club_bt',{body:data,authorized:true}),
    role: () => role,
    events: () => request('/rest/v1/events?select=id,title,event_date,location&order=event_date', {authorized:true}),
    setClubAccess: data => request('/rest/v1/rpc/set_club_access', {body:data,authorized:true}),
    updateEvent: data => request('/rest/v1/rpc/update_event_details', {body:data,authorized:true}),
    async registrationSettings(eventId) {
      const rows=await request('/rest/v1/events?select=registration_open,registration_version&id=eq.'+encodeURIComponent(eventId),{authorized:true});
      if(!rows?.length)throw new Error('Cet événement ne vous est pas attribué.');
      return {open:rows[0].registration_open===true,version:rows[0].registration_version};
    },
    setRegistrationOpen: data => request('/rest/v1/rpc/set_registration_open',{body:data,authorized:true}),
    saveRegistration: data => request('/rest/v1/rpc/club_save_ranked_registration',{body:data,authorized:true}).then(registrationRow),
    setParticipation: data => request('/rest/v1/rpc/club_set_participation',{body:data,authorized:true}).then(registrationRow),
    registrations: eventId => request('/rest/v1/registrations?select=id,first_name,last_name,nickname,email,created_at,present,activity,version,wants_bt,wants_tennis,tennis_ranking&order=created_at.desc'+(eventId ? '&event_id=eq.'+encodeURIComponent(eventId) : ''), {authorized: true}),
  };
}

export function suggestedNickname(first, last, number = 1) {
  const base = `${first.trim()} ${Array.from(last.trim())[0]?.toLocaleUpperCase('fr') || ''}`.trim();
  const suffix = number > 1 ? ` ${number}` : '';
  return base.slice(0, 40 - suffix.length).trimEnd() + suffix;
}
export async function registerWithNickname(register, data) {
  const automatic = !data.nickname.trim();
  for (let number = 1; number <= 100; number++) {
    const nickname = automatic ? suggestedNickname(data.first_name, data.last_name, number) : data.nickname.trim();
    try { return {id: await register({...data, nickname}), nickname}; }
    catch (error) {
      // Retry only a confirmed uniqueness rejection, never an uncertain network failure.
      if (!automatic || error.message !== 'Ce surnom est indisponible. Ajoutez une initiale.') throw error;
    }
  }
  throw new Error('Choisissez un surnom personnel pour terminer votre inscription.');
}
