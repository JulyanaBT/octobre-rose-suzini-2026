import {suggestedNickname,registerWithNickname} from './backend.js?v=20261018-sports';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const activities = {welcome:'À préciser',bt:'Beach tennis',tennis:'Tennis',prevention:'Prévention'};
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function mountRegistrations(root, backend, eventId, initialRows, isCurrent, {view='registrations'}={}) {
 const playersView=view==='players';
 root.dataset.view=view;
 let rows = initialRows, busy = new Set(), scope='all';
 const active=r=>r.present&&(scope==='all'||r.activity===scope);
 const belongs=r=>scope==='all'||(scope==='bt'?r.wants_bt||r.present&&r.activity==='bt':scope==='tennis'?r.wants_tennis||r.present&&r.activity==='tennis':r.present&&r.activity===scope);
 root.innerHTML = `<section class="registration-control"><div><strong>Inscriptions publiques</strong><p id="club-opening-state" role="status">Chargement…</p></div><button id="club-opening-toggle" disabled>Chargement…</button></section><nav id="club-activity-tabs" class="club-activity-tabs" aria-label="Activités"></nav><div class="club-status-tabs" aria-label="Catégories de joueurs" id="club-status-tabs"></div><div class="club-register-tools"><button id="club-add">+ Ajouter un inscrit</button><label class="club-search">Rechercher<input id="club-search" type="search" placeholder="Prénom, nom ou surnom" autocomplete="off"></label></div><div class="club-filters"><label>Présence<select id="club-presence-filter"><option value="all">Tous les inscrits</option><option value="present">Actifs</option><option value="absent">Inactifs</option></select></label><label>Activité actuelle<select id="club-activity-filter"><option value="all">Toutes les activités</option>${Object.entries(activities).map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label></div><div id="club-counts" class="club-counts"></div><p id="club-registration-status" role="status" aria-live="polite"></p><div id="club-people" class="club-people"></div><dialog id="club-person-dialog" aria-labelledby="club-person-title"></dialog>`;
 const $ = selector => root.querySelector(selector);
 const status = text => { if(isCurrent()) $('#club-registration-status').textContent=text; };
 let opening=null,openingBusy=false;
 const paintOpening=()=>{if(!isCurrent())return;$('#club-opening-state').textContent=opening.open?'Ouvertes · formulaire public accessible':'Suspendues · formulaire public masqué';$('#club-opening-toggle').textContent=opening.open?'Suspendre':'Ouvrir';$('#club-opening-toggle').disabled=openingBusy;};
 if(!playersView)backend.registrationSettings(eventId).then(value=>{opening=value;paintOpening();}).catch(error=>{if(isCurrent())$('#club-opening-state').textContent=error.message;});
 $('#club-opening-toggle').onclick=async()=>{if(!isCurrent()||!opening||openingBusy)return;openingBusy=true;paintOpening();try{opening=await backend.setRegistrationOpen({p_event:eventId,p_open:!opening.open,p_version:opening.version});status(opening.open?'Les inscriptions publiques sont ouvertes.':'Les inscriptions publiques sont suspendues.');}catch(error){status(error.message);}finally{openingBusy=false;paintOpening();}};
 $('#club-status-tabs').onclick=e=>{const button=e.target.closest('[data-category]');if(!button)return;$('#club-presence-filter').value=button.dataset.category;$('#club-search').value='';draw();};
 $('#club-activity-tabs').onclick=e=>{const button=e.target.closest('[data-scope]');if(!button)return;scope=button.dataset.scope;$('#club-presence-filter').value='all';draw();};
 const update = row => {const index=rows.findIndex(r=>r.id===row.id);if(index<0) rows.unshift(row);else rows[index]=row;draw();};
 function draw() {
  if(!isCurrent())return;
  const query=normalize($('#club-search').value.trim()), presence=$('#club-presence-filter').value, activity=$('#club-activity-filter').value;
  const filtered=rows.filter(r=>(!query||normalize(`${r.first_name} ${r.last_name} ${r.nickname}`).includes(query))&&belongs(r)&&(presence==='all'||active(r)===(presence==='present'))).sort((a,b)=>Number(active(b))-Number(active(a))||a.nickname.localeCompare(b.nickname,'fr'));
  $('#club-activity-tabs').innerHTML=playersView?[['all','Général'],['bt','BT'],['tennis','Tennis'],['prevention','Prévention'],['welcome','À préciser']].map(([v,n])=>`<button data-scope="${v}" aria-pressed="${scope===v}">${n}</button>`).join(''):'';
  const pool=rows.filter(belongs);
  $('#club-status-tabs').innerHTML=(playersView?[['all','Tous',pool.length],['present','Actifs',pool.filter(active).length],['absent','Inactifs',pool.filter(r=>!active(r)).length]]:[['all','Inscrits',rows.length]]).map(([value,label,count])=>`<button type="button" data-category="${value}" aria-pressed="${presence===value}"><b>${count}</b><span>${label}</span></button>`).join('');
  $('#club-counts').innerHTML=`<span>Actifs par activité :</span>${Object.entries(activities).map(([v,n])=>`<span><b>${rows.filter(r=>r.present&&r.activity===v).length}</b> ${n}</span>`).join('')}`;
  $('#club-people').innerHTML=filtered.length?filtered.map(r=>playersView?`<article class="club-player-row"><strong>${esc(r.nickname)}</strong><button data-presence="${esc(r.id)}" aria-pressed="${!!active(r)}" ${busy.has(r.id)?'disabled':''}>${active(r)?'Actif':'Inactif'}</button><button class="club-assignment" data-assign="${esc(r.id)}" data-activity-color="${r.present?r.activity:'inactive'}" ${busy.has(r.id)?'disabled':''}>${r.present?activities[r.activity]||'À préciser':'Absent'}</button></article>`:`<article class="club-person ${r.present?'is-present':''}" data-id="${esc(r.id)}"><div class="club-person-heading"><div><h2>${esc(r.nickname)}</h2><p>${esc(r.first_name)} ${esc(r.last_name)}</p><span class="player-status">${r.present?'Actif':'Inactif'}</span></div><button type="button" class="secondary" data-edit="${esc(r.id)}" ${busy.has(r.id)?'disabled':''}>Modifier</button></div>${r.email?`<p class="club-person-email">${esc(r.email)}</p>`:''}<p class="club-sports"><strong>Inscription :</strong> ${r.wants_bt&&r.wants_tennis?'Beach tennis + Tennis':r.wants_bt?'Beach tennis':r.wants_tennis?'Tennis':'Choix à préciser'}</p><div class="club-person-actions"><button type="button" data-presence="${esc(r.id)}" aria-pressed="${r.present}" ${busy.has(r.id)?'disabled':''}>${r.present?'Désactiver':'Activer'}</button><label>Activité actuelle<select data-activity="${esc(r.id)}" ${!r.present||busy.has(r.id)?'disabled':''}>${Object.entries(activities).map(([v,n])=>`<option value="${v}" ${r.activity===v?'selected':''}>${n}</option>`).join('')}</select></label></div>${!r.present?'<small>Activez le joueur à son arrivée pour affecter une activité.</small>':''}</article>`).join(''):`<p class="empty">${rows.length?'Aucun inscrit ne correspond aux filtres.':'Aucun inscrit pour le moment.'}</p>`;
 }
 async function participation(row,present,activity) {
  if(!isCurrent()||busy.has(row.id))return;
  busy.add(row.id);draw();status('Enregistrement…');
  try { const saved=await backend.setParticipation({p_event:eventId,p_id:row.id,p_version:row.version,p_present:present,p_activity:activity});if(isCurrent()){update(saved);status(present?`${saved.nickname} : statut actif et activité enregistrés.`:`${saved.nickname} désactivé et retiré de son activité.`);return true;} }
  catch(error){status(error.message);}
  finally{busy.delete(row.id);draw();}
 }
 function chooseActivity(row,leaving=false) {
  if(!row||!isCurrent()||busy.has(row.id))return;
  const dialog=$('#club-person-dialog');let saving=false;
  dialog.innerHTML=`<h2 id="club-person-title">${esc(row.nickname)}</h2><p>${leaving?'Choisir une autre activité ou signaler son départ.':'Choisir son activité.'}</p><div class="club-assignment-options">${Object.entries(activities).filter(([v])=>!leaving||scope==='all'||v!==scope).map(([v,n])=>`<button type="button" data-choice="${v}" data-activity-color="${v}">${n}</button>`).join('')}<button type="button" data-choice="inactive">Inactif · départ</button></div><p role="status" id="assignment-error"></p><button type="button" class="secondary" id="assignment-cancel">Annuler</button>`;
  dialog.oncancel=e=>{if(saving)e.preventDefault();};
  dialog.querySelector('#assignment-cancel').onclick=()=>dialog.close();
  dialog.querySelectorAll('[data-choice]').forEach(button=>button.onclick=async()=>{if(saving)return;saving=true;dialog.querySelectorAll('button').forEach(b=>b.disabled=true);const choice=button.dataset.choice;const saved=await participation(row,choice!=='inactive',choice==='inactive'?'welcome':choice);if(!isCurrent())return;if(saved)dialog.close();else dialog.querySelector('#assignment-error').textContent=$('#club-registration-status').textContent;saving=false;dialog.querySelectorAll('button').forEach(b=>b.disabled=false);});
  dialog.showModal();
 }
 function edit(row) {
  if(!isCurrent())return;
  const dialog=$('#club-person-dialog'), id=row?.id||crypto.randomUUID(), version=row?.version??null;
  dialog.innerHTML=`<h2 id="club-person-title">${row?'Modifier un inscrit':'Ajouter un inscrit'}</h2><form id="club-person-form"><div class="form-grid"><label>Prénom<input name="first_name" required maxlength="40" autocomplete="given-name" value="${esc(row?.first_name)}"></label><label>Nom<input name="last_name" required maxlength="60" autocomplete="family-name" value="${esc(row?.last_name)}"></label><label class="full">Surnom (facultatif)<input name="nickname" maxlength="40" value="${esc(row?.nickname)}"><small id="club-nickname-hint">Sans surnom : prénom + initiale du nom.</small></label><label class="full">E-mail (facultatif)<input name="email" type="email" maxlength="150" autocomplete="email" value="${esc(row?.email)}"></label><fieldset class="full sport-choices"><legend>Je souhaite participer à</legend><label><input type="checkbox" name="wants_bt" ${row?.wants_bt?'checked':''}> Beach tennis</label><label><input type="checkbox" name="wants_tennis" ${row?.wants_tennis?'checked':''}> Tennis</label><small>Cochez un sport ou les deux.</small></fieldset><p class="full smalltext">Prévention : informations à venir, sans inscription pour le moment.</p></div><p id="club-save-status" role="status" aria-live="polite"></p><div class="club-dialog-actions"><button type="submit">Enregistrer</button><button type="button" class="secondary" id="club-cancel">Annuler</button></div></form>`;
  const form=dialog.querySelector('form');let saving=false;
  dialog.oncancel=e=>{if(saving)e.preventDefault();};
  dialog.querySelector('#club-cancel').onclick=()=>dialog.close();
  form.oninput=()=>{const f=form.elements;dialog.querySelector('#club-nickname-hint').textContent=f.nickname.value.trim()||`Proposition : ${suggestedNickname(f.first_name.value,f.last_name.value)||'prénom + initiale'} (numérotée si nécessaire).`;};
  form.onsubmit=async e=>{
   e.preventDefault();if(saving||!isCurrent())return;
   const data=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,v.trim()]));
   if(!data.first_name||!data.last_name)return;
   data.wants_bt=form.elements.wants_bt.checked;data.wants_tennis=form.elements.wants_tennis.checked;
   if(!data.wants_bt&&!data.wants_tennis){dialog.querySelector('#club-save-status').textContent='Choisissez le beach tennis, le tennis ou les deux.';return;}
   saving=true;form.querySelectorAll('button,input').forEach(el=>el.disabled=true);dialog.querySelector('#club-save-status').textContent='Enregistrement…';
   try{
    let saved;
    await registerWithNickname(async values=>{saved=await backend.saveRegistration({p_event:eventId,p_id:id,p_version:version,p_first_name:values.first_name,p_last_name:values.last_name,p_nickname:values.nickname,p_email:values.email,p_wants_bt:values.wants_bt,p_wants_tennis:values.wants_tennis});return saved.id;},data);
    if(isCurrent()){update(saved);dialog.close();status(`${saved.nickname} : ${row?'fiche modifiée':'inscription ajoutée'}.`);}
   }catch(error){if(isCurrent())dialog.querySelector('#club-save-status').textContent=error.message;}
   finally{saving=false;if(isCurrent())form.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
  };
  dialog.showModal();
 }
 $('#club-add').onclick=()=>edit();
 $('#club-search').oninput=draw;$('#club-presence-filter').onchange=draw;$('#club-activity-filter').onchange=draw;
 $('#club-people').onclick=e=>{const editButton=e.target.closest('[data-edit]'),presence=e.target.closest('[data-presence]'),assign=e.target.closest('[data-assign]');if(editButton)edit(rows.find(r=>r.id===editButton.dataset.edit));if(assign)chooseActivity(rows.find(r=>r.id===assign.dataset.assign));if(presence){const row=rows.find(r=>r.id===presence.dataset.presence);if(scope==='all'){if(row.present)participation(row,false,'welcome');else chooseActivity(row);}else if(active(row))chooseActivity(row,true);else participation(row,true,scope);}};
 $('#club-people').onchange=e=>{if(e.target.matches('[data-activity]')){const row=rows.find(r=>r.id===e.target.dataset.activity);participation(row,true,e.target.value);}};
 draw();
}
