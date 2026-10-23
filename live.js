import {mountRaquettes} from './raquettes.js?v=20261023-compactlang';
import {mountRegistrations} from './club-registrations.js?v=20261019-clubparticipants';
import {accessManager,activationPage,passwordDialog,accountPage} from './access.js?v=20261019-moncompte';
import {createBackend,suggestedNickname,registerWithNickname} from './backend.js?v=20261019-moncompte';
import {config} from './config.js';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let backend, setupError, signedIn = false, generation = 0;
let restored = false, selectedClubEvent = null, registrationWatch=null;
if (config.mode === 'live') {
  try { backend = createBackend(config); } catch (error) { setupError = error.message; }
}
const message = text => `<div class="notice" role="status">${esc(text)}</div>`;
const settingsNav = reset => `<nav class="club-subnav settings-tabs" aria-label="Paramètres"><a href="#club-compte" ${!reset?'class="active" aria-current="page"':''}>Mon compte</a><a href="#club-reset" ${reset?'class="active" aria-current="page"':''}>Réinitialisation</a></nav>`;
const title = text => `<div class="page-head"><div class="eyebrow">TC SUZINI · OCTOBRE ROSE</div><h1>${text}</h1></div>`;

export function invalidateLive() { generation++;clearInterval(registrationWatch);registrationWatch=null; }
export function renderLive(page, main) {
  if (config.mode !== 'live') return false;
  const current = ++generation;
  document.querySelector('.preview').textContent = 'TC SUZINI · OCTOBRE ROSE 2026';
  if (['accueil','programme'].includes(page)) return false;
  if (setupError) { main.innerHTML = title('Les inscriptions se préparent.') + message(setupError); return true; }
  if(page==='participants'){
    let rows=[],filter='all',loading=true,failed=false;
    const draw=()=>{
      if(current!==generation)return;
      const filtered=rows.filter(p=>filter==='all'||(filter==='bt'?p.wants_bt:p.wants_tennis));
      main.innerHTML=`<section class="public-participants"><nav class="participant-filters" aria-label="Filtrer les participants">${[['all','Tous'],['bt','Beach tennis'],['tennis','Tennis']].map(([value,label])=>`<button type="button" data-participant-filter="${value}" aria-pressed="${filter===value}">${label}</button>`).join('')}</nav><p class="participant-count" role="status">${loading?'Chargement des participants…':failed?'La liste est momentanément indisponible. Rechargez la page pour réessayer.':`${filtered.length} participant${filtered.length===1?'':'s'}${filter==='all'?'':` · ${rows.length} inscrits au total`}`}</p><div class="participant-list">${loading||failed?'':filtered.map(p=>`<article class="participant-row"><strong>${esc(p.nickname)}</strong><span>${[p.wants_bt?'Beach tennis':'',p.wants_tennis?'Tennis':''].filter(Boolean).join(' · ')||'Participation à la journée'}</span></article>`).join('')||'<p class="info-card">Aucun participant dans cette catégorie pour le moment.</p>'}</div></section>`;
      main.querySelectorAll('[data-participant-filter]').forEach(button=>button.addEventListener('click',()=>{filter=button.dataset.participantFilter;draw();}));
    };
    draw();backend.publicParticipants('20261024-0000-4000-8000-000000000001').then(data=>{rows=data;rows.sort((a,b)=>a.nickname.localeCompare(b.nickname,'fr',{sensitivity:'base',numeric:true}));}).catch(()=>{failed=true;}).finally(()=>{loading=false;draw();});
    return true;
  }
  if(page.startsWith('activation')){activationPage(backend,main,page,()=>current===generation);return true;}
  if (page === 'inscription') {
    clearInterval(registrationWatch);
    registrationWatch=setInterval(async()=>{
      if(current!==generation||document.hidden)return;
      try{const {open}=await backend.settings();if(current===generation && !open && main.querySelector('#live-register')){clearInterval(registrationWatch);main.innerHTML=title('Inscriptions suspendues.')+message('Les inscriptions viennent d’être suspendues. Merci de revenir plus tard.');}}catch{}
    },15000);
    main.innerHTML = title('Rejoindre la journée.') + message('Vérification de l’ouverture des inscriptions…');
    backend.settings().then(({open}) => {
      if (current !== generation) return;

      if(!open){clearInterval(registrationWatch);main.innerHTML=title('Inscriptions suspendues.')+message('Les inscriptions à la journée sont actuellement suspendues. Merci de revenir plus tard.')+'<a class="button secondary" href="#accueil">Retour à l’accueil</a>';return;}
      main.innerHTML = '<h1 class="registration-title">S’inscrire à la journée</h1>' + `<section class="card registration-card">${!open ? message("Les inscriptions ne sont pas encore ouvertes. Vous pouvez préparer votre nom sportif ci-dessous.") : ''}
      <form id="live-register"><div class="form-grid">
      <label>Prénom<input name="first_name" required maxlength="40" autocomplete="given-name"></label>
      <label>Nom<input name="last_name" required maxlength="60" autocomplete="family-name"></label>
      <label class="full">Surnom (facultatif)<input name="nickname" maxlength="40" autocomplete="nickname" placeholder="Laisser vide pour utiliser le nom proposé"><small id="nickname-preview" aria-live="polite">Sans surnom : prénom + initiale du nom.</small></label>
      <fieldset class="full sport-choices"><legend>Je souhaite participer à</legend><label><input type="checkbox" name="wants_bt"> Beach tennis</label><label><input type="checkbox" name="wants_tennis"> Tennis</label><small>Cochez un sport ou les deux.</small></fieldset><p class="full smalltext">Prévention : informations à venir, sans inscription pour le moment.</p>
      <details class="full registration-privacy"><summary>Modalités et confidentialité</summary><p class="smalltext">Choisissez le tennis, le beach tennis ou les deux. Le club organisera les affectations. Cette inscription ne réserve pas une place dans un tournoi particulier.</p><p class="smalltext">Vos informations sont destinées aux organisateurs du TC Suzini pour préparer votre accueil. Seuls votre nom sportif et votre suivi beach tennis (joueurs, matchs, classement et statistiques) sont visibles publiquement. Vos coordonnées restent réservées aux organisateurs.</p></details>
      <button class="full" ${!open ? 'disabled' : ''}>${open ? 'Envoyer mon inscription' : 'Inscriptions bientôt ouvertes'}</button></div></form><div id="registration-status" role="status" aria-live="polite"></div></section>`;
      const registrationForm = document.querySelector('#live-register');
      registrationForm.addEventListener('input', () => {
        const fields = registrationForm.elements;
        const name = fields.nickname.value.trim() || suggestedNickname(fields.first_name.value, fields.last_name.value);
        document.querySelector('#nickname-preview').textContent = name ? `Nom sportif proposé : ${name}${fields.nickname.value.trim() ? '' : ' — un numéro sera ajouté si nécessaire.'}` : 'Sans surnom : prénom + initiale du nom.';
      });
      document.querySelector('#live-register').addEventListener('submit', async event => {
        event.preventDefault();
        if (!open) return;
        const form = event.target, button = form.querySelector('button'), status = document.querySelector('#registration-status');
        const data = Object.fromEntries([...new FormData(form)].map(([key,value]) => [key,value.trim()]));
        data.wants_bt=form.elements.wants_bt.checked;data.wants_tennis=form.elements.wants_tennis.checked;
        if(!data.wants_bt&&!data.wants_tennis){status.textContent='Choisissez le beach tennis, le tennis ou les deux.';return;}
        if (['first_name','last_name'].some(key => !data[key])) { status.textContent = 'Merci de compléter tous les champs.'; return; }
        button.disabled = true; status.textContent = 'Envoi en cours…';
        try {
          const {id,nickname} = await registerWithNickname(backend.register, data);
          if (current !== generation) return;
          form.remove(); status.textContent = `Votre inscription à la journée est enregistrée sous le nom ${nickname}. Référence : ${id}. Aucun e-mail automatique n’est envoyé pour le moment.`;
        } catch (error) { if (current === generation) { status.textContent = error.message; if(error.message.includes('inscriptions sont suspendues'))form.remove();else button.disabled = false; } }
      });
    }).catch(error => { if (current === generation) main.innerHTML = title('Inscription') + message(error.message); });
    return true;
  }
  if(['raquettes','bt','tennis'].includes(page)){main.innerHTML='<section id="public-raquettes"></section>';mountRaquettes(main.querySelector('#public-raquettes'),backend,'20261024-0000-4000-8000-000000000001',()=>current===generation,{readOnly:true,initialSport:page==='tennis'?'tennis':'bt'});return true;}
  const clubPage = page === 'club' || page.startsWith('club-');
  if (!['organisation','admin','club'].includes(page) && !clubPage && !page.startsWith('admin-')) {
    main.innerHTML = title(page === 'tennis' ? 'Le TMC tennis se prépare.' : 'L’Americano beach tennis.') + message('Les matchs et le classement seront disponibles lorsque l’organisation sportive sera prête.');
    return true;
  }
  const adminPage = !clubPage;
  if(!restored){ main.innerHTML=title('Connexion…');backend.restore().then(value=>{signedIn=value;restored=true;if(current===generation)renderLive(page,main);}).catch(()=>{restored=true;if(current===generation)renderLive(page,main);});return true;}
  main.innerHTML = title(adminPage ? 'Administration.' : 'Espace Club.');
  let listVersion=0;
  async function list() {
    const listRequest=++listVersion;
    if (adminPage && backend.role() !== 'admin') { main.innerHTML=title('Accès réservé à l’administrateur.')+message('Votre compte Club dispose uniquement des événements qui lui sont attribués.')+'<a class="button" href="#club">Rejoindre mon espace Club</a>';return; }
    if(adminPage){await accessManager(backend,main,()=>current===generation,async()=>{signedIn=false;await backend.signOut().catch(()=>{});if(current===generation)renderLive(page,main);});return;}
    if (!['admin','club'].includes(backend.role())) throw new Error('Accès réservé à l’administrateur et aux gestionnaires Club autorisés.');
    backend.activity().catch(()=>{});
    main.style.setProperty('--club-header-height',`${document.querySelector('header')?.getBoundingClientRect().height||120}px`);
    if(['club-compte','club-parametres'].includes(page)){
      main.innerHTML=settingsNav(false)+'<section id="club-account-content"><p>Chargement du compte…</p></section>';
      const accountRoot=main.querySelector('#club-account-content');
      try{await accountPage(backend,accountRoot,()=>current===generation,async()=>{signedIn=false;await backend.signOut().catch(()=>{});if(current===generation)renderLive(page,main);});}
      catch(e){if(current===generation)accountRoot.innerHTML=message(e.message);}
      return;
    }
    const events = await backend.events();
    const requestedEvent = document.querySelector('#event-select')?.value || selectedClubEvent;
    const eventId = events.some(e => e.id === requestedEvent) ? requestedEvent : events[0]?.id;
    selectedClubEvent = eventId;
    if(page==='club-reset'){
      if(!eventId){main.innerHTML=settingsNav(true)+message('Aucun événement attribué.');return;}
      main.innerHTML=settingsNav(true)+`<section class="card"><h2>Réinitialisation</h2><p>Les inscriptions et les comptes sont conservés.</p><h3>Matchs et scores BT</h3><p>Efface tous les tours, matchs, scores, classements et statistiques BT. Les statuts des participants restent inchangés.</p><button data-reset="reset_matches">Effacer les matchs et scores BT</button><h3>Statuts des participants</h3><p>Passe tout le monde en inactif, toutes activités confondues. Les matchs et scores sont conservés. Les matchs en cours doivent d’abord être terminés ou supprimés.</p><button data-reset="deactivate_all">Passer tout le monde en inactif</button><p role="status" id="reset-status"></p></section><div class="organizer-logout"><button id="logout" class="secondary">Se déconnecter</button></div>`;
      main.querySelector('#logout').onclick=async()=>{signedIn=false;await backend.signOut();if(current===generation)renderLive(page,main);};
      let resetBusy=false;
      main.querySelectorAll('[data-reset]').forEach(button=>button.onclick=async()=>{
        if(resetBusy)return;const action=button.dataset.reset;
        if(!confirm(action==='reset_matches'?'Effacer définitivement tous les matchs et scores BT ? Les inscriptions et statuts seront conservés.':'Passer tous les participants en inactifs ? Leurs inscriptions et résultats seront conservés.'))return;
        resetBusy=true;main.querySelectorAll('[data-reset]').forEach(b=>b.disabled=true);
        try{const state=await backend.beach({p_event:eventId});await backend.beach({p_event:eventId,p_action:action,p_version:state.version});if(current===generation)main.querySelector('#reset-status').textContent=action==='reset_matches'?'Tous les matchs et scores BT ont été effacés.':'Tous les participants sont maintenant inactifs.';}
        catch(e){if(current===generation)main.querySelector('#reset-status').textContent=e.message;}
        finally{resetBusy=false;if(current===generation)main.querySelectorAll('[data-reset]').forEach(b=>b.disabled=false);}
      });return;
    }

    const inscriptionsPage = ['club','club-participants','club-inscriptions','club-joueurs'].includes(page);
    const playersPage=page==='club-joueurs';
    const convivialityPage=['club-convivialite','club-surprise','club-buffet'].includes(page);
    const subnav=inscriptionsPage?`<nav class="club-subnav" aria-label="Participants"><a href="#club-inscriptions" ${!playersPage?'class="active" aria-current="page"':''}>Inscriptions</a><a href="#club-joueurs" ${playersPage?'class="active" aria-current="page"':''}>Joueurs</a></nav>`:convivialityPage?`<nav class="club-subnav" aria-label="Convivialité"><a href="#club-surprise" ${page!=='club-buffet'?'class="active" aria-current="page"':''}>Surprises</a><a href="#club-buffet" ${page==='club-buffet'?'class="active" aria-current="page"':''}>Buffet</a></nav>`:'';
    const rows = eventId && inscriptionsPage ? await backend.registrations(eventId) : [];
    const event = events.find(e=>e.id===eventId);
    if (current !== generation || listRequest !== listVersion) return;
    main.innerHTML = (events.length>1 ? `<details class="club-event-picker"><summary>Changer d’événement</summary><label>Événement<select id="event-select">${events.map(e=>`<option value="${esc(e.id)}" ${e.id===eventId?'selected':''}>${esc(e.title)}</option>`).join('')}</select></label></details>` : '') + subnav + `${inscriptionsPage ? '<section id="club-registration-manager"></section>' : (!events.length ? message("Aucun événement ne vous est attribué pour le moment.") : page === 'club-raquettes' ? '<section id="club-raquettes-manager"></section>' : page === 'club-infos' ? '' : `<section class="card club-placeholder"><h2>${({'club-convivialite':'Surprises','club-surprise':'Surprises','club-information':'Prévention','club-buffet':'Buffet'})[page]||'Gestion de cette activité'}</h2><strong>À déterminer</strong></section>`)}<p id="admin-status" role="status"></p>${event && page === 'club-infos' ? `<section class="card"><h2>Informations de l’événement</h2><form id="event-form"><label>Titre<input name="new_title" required maxlength="120" value="${esc(event.title)}"></label><label>Lieu<input name="new_location" maxlength="200" value="${esc(event.location)}"></label><label>Date<input name="new_date" type="date" required value="${esc(event.event_date)}"></label><button>Enregistrer</button></form></section>` : ''}${adminPage && event ? `<section class="card"><h2>Attribuer un accès Club</h2><p>Le compte doit d’abord être créé et confirmé dans Supabase. L’accès concerne uniquement l’événement sélectionné.</p><form id="access-form"><label>E-mail du compte<input type="email" name="target_email" required></label><label>Action<select name="allow_access"><option value="true">Autoriser cet événement</option><option value="false">Retirer cet événement</option></select></label><button>Appliquer</button></form></section>` : ''}`;
    main.insertAdjacentHTML('beforeend','<div class="organizer-logout"><button id="change-password" class="secondary">Changer mon mot de passe</button><button id="logout" class="secondary">Se déconnecter</button></div>');
    if(page==='club-raquettes' && eventId)mountRaquettes(document.querySelector('#club-raquettes-manager'),backend,eventId,()=>current===generation && listRequest===listVersion);
    if(inscriptionsPage && eventId)mountRegistrations(document.querySelector('#club-registration-manager'),backend,eventId,rows,()=>current===generation && listRequest===listVersion,{view:playersPage?'players':'registrations'});
    if(document.querySelector('#event-select'))document.querySelector('#event-select').onchange=()=>list().catch(error=>document.querySelector('#admin-status').textContent=error.message);
    for(const [selector,action] of [['#event-form',backend.updateEvent],['#access-form',backend.setClubAccess]]) { const form=document.querySelector(selector); if(form)form.onsubmit=async e=>{e.preventDefault();const data=Object.fromEntries(new FormData(form));data.target_event=eventId;if('allow_access' in data)data.allow_access=data.allow_access==='true';const button=form.querySelector('button');button.disabled=true;try{await action(data);document.querySelector('#admin-status').textContent='Modification enregistrée.';}catch(error){document.querySelector('#admin-status').textContent=error.message;}finally{button.disabled=false;}}; }
    document.querySelector('#change-password').onclick=()=>passwordDialog(backend,main);
    document.querySelector('#logout').onclick = async () => {
      signedIn = false; main.innerHTML = title('Déconnexion…');
      try { await backend.signOut(); } catch {} finally { if (current === generation) renderLive(page, main); }
    };
  }
  if (signedIn) {
    main.innerHTML += message('Chargement des inscriptions…');
    list().catch(error => { if (current === generation) { signedIn = false; renderLive(page, main); if(document.querySelector('#login-status'))document.querySelector('#login-status').textContent = error.message; } });
    return true;
  }
  main.innerHTML += `<section class="card"><p>${adminPage ? 'Accès personnel de l’administrateur, prévu pour ordinateur.' : 'Connectez-vous pour retrouver les événements qui vous sont attribués.'} Votre connexion sera conservée sur cet appareil jusqu’à votre déconnexion ou l’expiration de la session.</p><form id="login"><label>${adminPage ? 'E-mail administrateur' : 'Identifiant ou e-mail'}<input name="email" type="text" autocomplete="username" required></label><label>Mot de passe<input name="password" type="password" autocomplete="current-password" required></label><button>Se connecter</button></form><p id="login-status" role="status" aria-live="polite"></p></section>`;
  document.querySelector('#login').onsubmit = async event => {
    event.preventDefault();
    const form = event.target, data = new FormData(form), button = form.querySelector('button');
    button.disabled = true;
    try {
      await backend.signIn(data.get('email').trim(), data.get('password'));
      signedIn = true;
      if (current === generation) await list();
    } catch (error) { if (current === generation) { if(document.querySelector('#login-status'))document.querySelector('#login-status').textContent = error.message; button.disabled = false; } }
    finally { form.querySelector('[name="password"]').value = ''; }
  };
  return true;
}

for(const type of ['pointerdown','keydown'])document.addEventListener(type,()=>{if(document.body.dataset.space==='club')backend?.activity().catch(()=>{});},{passive:true});
