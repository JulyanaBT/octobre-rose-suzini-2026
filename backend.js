export function createBackend(config, fetcher = globalThis.fetch) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) ||
      !config.publishableKey.startsWith('sb_publishable_')) {
    throw new Error('La connexion aux inscriptions n’est pas encore configurée.');
  }
  // Session remains in memory: a reload requires signing in again.
  let token = null, role = null;
  async function request(path, {body, authorized = false} = {}) {
    const headers = {apikey: config.publishableKey, 'Content-Type': 'application/json'};
    if (authorized) {
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
      if (response.status === 401) token = null;
      const message = data?.code === 'P0001' ? data.message :
        response.status === 401 ? 'Connexion expirée ou identifiants incorrects.' :
        'Impossible de terminer cette opération. Réessayez plus tard.';
      throw new Error(message);
    }
    return data;
  }
  return {
    async settings() {
      const rows = await request('/rest/v1/event_settings?select=registration_open');
      return {open: rows?.[0]?.registration_open === true};
    },
    register: data => request('/rest/v1/rpc/register_participant', {body: data}),
    async signIn(email, password) {
      token = null;
      const session = await request('/auth/v1/token?grant_type=password', {body: {email, password}});
      token = session.access_token;
      try {
        const roles = await request('/rest/v1/organizers?select=user_id', {authorized: true});
        role = roles?.length ? 'admin' : 'club';
        if (role === 'club') { const memberships = await request('/rest/v1/event_memberships?select=event_id', {authorized: true}); if (!memberships?.length) throw new Error('Aucun événement ne vous est attribué. Contactez l’administrateur.'); }
      } catch (error) { token = null; role = null; throw error; }
    },
    async signOut() {
      try { if (token) await request('/auth/v1/logout', {body: {}, authorized: true}); }
      finally { token = null; role = null; }
    },
    role: () => role,
    events: () => request('/rest/v1/events?select=id,title,event_date,location&order=event_date', {authorized:true}),
    setClubAccess: data => request('/rest/v1/rpc/set_club_access', {body:data,authorized:true}),
    updateEvent: data => request('/rest/v1/rpc/update_event_details', {body:data,authorized:true}),
    registrations: eventId => request('/rest/v1/registrations?select=id,first_name,last_name,nickname,email,created_at&order=created_at.desc'+(eventId ? '&event_id=eq.'+encodeURIComponent(eventId) : ''), {authorized: true}),
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
