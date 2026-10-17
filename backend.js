export function createBackend(config, fetcher = globalThis.fetch) {
  if (!/^https:\/\/[a-z0-9-]+\.supabase\.co$/.test(config.supabaseUrl) ||
      !config.publishableKey.startsWith('sb_publishable_')) {
    throw new Error('La connexion aux inscriptions n’est pas encore configurée.');
  }
  // Session remains in memory: a reload requires signing in again.
  let token = null;
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
        if (!roles?.length) throw new Error('Ce compte ne dispose pas d’un accès organisateur.');
      } catch (error) { token = null; throw error; }
    },
    async signOut() {
      try { if (token) await request('/auth/v1/logout', {body: {}, authorized: true}); }
      finally { token = null; }
    },
    registrations: () => request('/rest/v1/registrations?select=id,first_name,last_name,nickname,email,created_at&order=created_at.desc', {authorized: true}),
  };
}
