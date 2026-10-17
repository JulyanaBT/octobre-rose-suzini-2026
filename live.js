import {createBackend} from './backend.js';
import {config} from './config.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let backend, setupError, signedIn = false, generation = 0;
if (config.mode === 'live') {
  try { backend = createBackend(config); } catch (error) { setupError = error.message; }
}
const message = text => `<div class="notice" role="status">${esc(text)}</div>`;
const title = text => `<div class="page-head"><div class="eyebrow">TC SUZINI · OCTOBRE ROSE</div><h1>${text}</h1></div>`;

export function renderLive(page, main) {
  if (config.mode !== 'live') return false;
  const current = ++generation;
  document.querySelector('.preview').textContent = 'TC SUZINI · OCTOBRE ROSE 2026';
  if (['accueil','programme'].includes(page)) return false;
  if (setupError) { main.innerHTML = title('Les inscriptions se préparent.') + message(setupError); return true; }
  if (page === 'inscription') {
    main.innerHTML = title('Rejoindre la journée.') + message('Vérification de l’ouverture des inscriptions…');
    backend.settings().then(({open}) => {
      if (current !== generation) return;
      if (!open) { main.innerHTML = title('Les inscriptions ouvrent bientôt.') + message('Le club finalise les modalités de la journée. Revenez prochainement.'); return; }
      main.innerHTML = title('Une inscription pour la journée.') + `<section class="card"><p>Les affectations au beach tennis et au tennis seront organisées ensuite par le club. Cette inscription ne réserve pas une place dans un tournoi particulier.</p>
      <form id="live-register"><div class="form-grid">
      <label>Prénom<input name="first_name" required maxlength="40" autocomplete="given-name"></label>
      <label>Nom<input name="last_name" required maxlength="60" autocomplete="family-name"></label>
      <label class="full">Prénom ou surnom sportif<input name="nickname" required maxlength="40" autocomplete="nickname"><small>Ce nom servira à vous appeler pour les activités.</small></label>
      <label class="full">E-mail<input name="email" type="email" required maxlength="150" autocomplete="email"></label>
      <p class="full smalltext">Vos informations sont destinées aux organisateurs du TC Suzini pour préparer votre accueil. Elles ne sont pas affichées aux autres visiteurs.</p>
      <button class="full">Envoyer mon inscription</button></div></form><div id="registration-status" role="status" aria-live="polite"></div></section>`;
      document.querySelector('#live-register').addEventListener('submit', async event => {
        event.preventDefault();
        const form = event.target, button = form.querySelector('button'), status = document.querySelector('#registration-status');
        const data = Object.fromEntries([...new FormData(form)].map(([key,value]) => [key,value.trim()]));
        if (Object.values(data).some(value => !value)) { status.textContent = 'Merci de compléter tous les champs.'; return; }
        button.disabled = true; status.textContent = 'Envoi en cours…';
        try {
          const id = await backend.register(data);
          if (current !== generation) return;
          form.remove(); status.textContent = `Votre inscription à la journée est enregistrée. Référence : ${id}. Aucun e-mail automatique n’est envoyé pour le moment.`;
        } catch (error) { if (current === generation) { status.textContent = error.message; button.disabled = false; } }
      });
    }).catch(error => { if (current === generation) main.innerHTML = title('Inscription') + message(error.message); });
    return true;
  }
  if (page !== 'organisation') {
    main.innerHTML = title(page === 'tennis' ? 'Le TMC tennis se prépare.' : 'L’Americano beach tennis.') + message('Les matchs et le classement seront disponibles lorsque l’organisation sportive sera prête.');
    return true;
  }
  main.innerHTML = title('Espace organisateur.');
  async function list() {
    const rows = await backend.registrations();
    if (current !== generation) return;
    main.innerHTML = title('Les inscriptions à la journée.') + `<div class="toolbar"><button id="refresh">Actualiser</button><button id="logout" class="secondary">Se déconnecter</button></div><p>${rows.length} inscription(s). Les affectations sportives seront ajoutées dans une prochaine étape.</p><div class="grid">${rows.map(row => `<article class="card"><h3>${esc(row.nickname)}</h3><p>${esc(row.first_name)} ${esc(row.last_name)}</p><p>${esc(row.email)}</p></article>`).join('')}</div><p id="admin-status" role="status"></p>`;
    document.querySelector('#refresh').onclick = async event => {
      event.target.disabled = true;
      try { await list(); } catch (error) { if (current === generation) { document.querySelector('#admin-status').textContent = error.message; event.target.disabled = false; } }
    };
    document.querySelector('#logout').onclick = async () => {
      signedIn = false; main.innerHTML = title('Déconnexion…');
      try { await backend.signOut(); } catch {} finally { if (current === generation) renderLive('organisation', main); }
    };
  }
  if (signedIn) {
    main.innerHTML += message('Chargement des inscriptions…');
    list().catch(error => { if (current === generation) { signedIn = false; renderLive('organisation', main); document.querySelector('#login-status').textContent = error.message; } });
    return true;
  }
  main.innerHTML += `<section class="card"><p>Accès réservé aux comptes autorisés par le club. La session se ferme lorsque vous rechargez cette page.</p><form id="login"><label>E-mail<input name="email" type="email" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" required></label><button>Se connecter</button></form><p id="login-status" role="status" aria-live="polite"></p></section>`;
  document.querySelector('#login').onsubmit = async event => {
    event.preventDefault();
    const form = event.target, data = new FormData(form), button = form.querySelector('button');
    button.disabled = true;
    try {
      await backend.signIn(data.get('email').trim(), data.get('password'));
      signedIn = true;
      if (current === generation) await list();
    } catch (error) { if (current === generation) { document.querySelector('#login-status').textContent = error.message; button.disabled = false; } }
    finally { form.querySelector('[name="password"]').value = ''; }
  };
  return true;
}
