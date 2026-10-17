import {suggestedNickname,registerWithNickname} from './backend.js?v=20261017-inscrits';
const esc = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const activities = {welcome:'Accueil / pause',bt:'Beach tennis',tennis:'Tennis',prevention:'Prévention'};
const normalize = value => value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
export function mountRegistrations(root, backend, eventId, initialRows, isCurrent) {
 let rows = initialRows, busy = new Set();
 root.innerHTML = `<div class="club-register-tools"><button id="club-add">+ Ajouter un inscrit</button><label class="club-search">Rechercher<input id="club-search" type="search" placeholder="Prénom, nom ou surnom" autocomplete="off"></label></div><div class="club-filters"><label>Présence<select id="club-presence-filter"><option value="all">Tous les inscrits</option><option value="present">Présents</option><option value="absent">Non présents</option></select></label><label>Activité actuelle<select id="club-activity-filter"><option value="all">Toutes les activités</option>${Object.entries(activities).map(([v,n])=>`<option value="${v}">${n}</option>`).join('')}</select></label></div><div id="club-counts" class="club-counts"></div><p id="club-registration-status" role="status" aria-live="polite"></p><div id="club-people" class="club-people"></div><dialog id="club-person-dialog" aria-labelledby="club-person-title"></dialog>`;
 const $ = selector => root.querySelector(selector);
 const status = text => { if(isCurrent()) $('#club-registration-status').textContent=text; };
 const update = row => {const index=rows.findIndex(r=>r.id===row.id);if(index<0) rows.unshift(row);else rows[index]=row;draw();};
 function draw() {
  if(!isCurrent())return;
  const query=normalize($('#club-search').value.trim()), presence=$('#club-presence-filter').value, activity=$('#club-activity-filter').value;
  const filtered=rows.filter(r=>(!query||normalize(`${r.first_name} ${r.last_name} ${r.nickname}`).includes(query))&&(presence==='all'||r.present===(presence==='present'))&&(activity==='all'||r.present&&r.activity===activity)).sort((a,b)=>a.nickname.localeCompare(b.nickname,'fr'));
  $('#club-counts').innerHTML=`<span><b>${rows.length}</b> inscrits</span><span><b>${rows.filter(r=>r.present).length}</b> présents</span>${Object.entries(activities).map(([v,n])=>`<span><b>${rows.filter(r=>r.present&&r.activity===v).length}</b> ${n}</span>`).join('')}`;
  $('#club-people').innerHTML=filtered.length?filtered.map(r=>`<article class="club-person ${r.present?'is-present':''}" data-id="${esc(r.id)}"><div class="club-person-heading"><div><h2>${esc(r.nickname)}</h2><p>${esc(r.first_name)} ${esc(r.last_name)}</p></div><button type="button" class="secondary" data-edit="${esc(r.id)}" ${busy.has(r.id)?'disabled':''}>Modifier</button></div><p class="club-person-email">${esc(r.email)}</p><div class="club-person-actions"><button type="button" data-presence="${esc(r.id)}" aria-pressed="${r.present}" ${busy.has(r.id)?'disabled':''}>${r.present?'✓ Présent · marquer parti':'Pointer l’arrivée'}</button><label>Activité actuelle<select data-activity="${esc(r.id)}" ${!r.present||busy.has(r.id)?'disabled':''}>${Object.entries(activities).map(([v,n])=>`<option value="${v}" ${r.activity===v?'selected':''}>${n}</option>`).join('')}</select></label></div>${!r.present?'<small>Pointez l’arrivée pour affecter une activité.</small>':''}</article>`).join(''):`<p class="empty">${rows.length?'Aucun inscrit ne correspond aux filtres.':'Aucun inscrit pour le moment.'}</p>`;
 }
 async function participation(row,present,activity) {
  if(!isCurrent()||busy.has(row.id))return;
  busy.add(row.id);draw();status('Enregistrement…');
  try { const saved=await backend.setParticipation({p_event:eventId,p_id:row.id,p_version:row.version,p_present:present,p_activity:activity});if(isCurrent()){update(saved);status(present?`${saved.nickname} : présence et activité enregistrées.`:`${saved.nickname} marqué non présent et retiré de son activité.`);} }
  catch(error){status(error.message);}
  finally{busy.delete(row.id);draw();}
 }
 function edit(row) {
  if(!isCurrent())return;
  const dialog=$('#club-person-dialog'), id=row?.id||crypto.randomUUID(), version=row?.version??null;
  dialog.innerHTML=`<h2 id="club-person-title">${row?'Modifier un inscrit':'Ajouter un inscrit'}</h2><form id="club-person-form"><div class="form-grid"><label>Prénom<input name="first_name" required maxlength="40" autocomplete="given-name" value="${esc(row?.first_name)}"></label><label>Nom<input name="last_name" required maxlength="60" autocomplete="family-name" value="${esc(row?.last_name)}"></label><label class="full">Surnom (facultatif)<input name="nickname" maxlength="40" value="${esc(row?.nickname)}"><small id="club-nickname-hint">Sans surnom : prénom + initiale du nom.</small></label><label class="full">E-mail<input name="email" type="email" required maxlength="150" autocomplete="email" value="${esc(row?.email)}"></label></div><p id="club-save-status" role="status" aria-live="polite"></p><div class="club-dialog-actions"><button type="submit">Enregistrer</button><button type="button" class="secondary" id="club-cancel">Annuler</button></div></form>`;
  const form=dialog.querySelector('form');let saving=false;
  dialog.oncancel=e=>{if(saving)e.preventDefault();};
  dialog.querySelector('#club-cancel').onclick=()=>dialog.close();
  form.oninput=()=>{const f=form.elements;dialog.querySelector('#club-nickname-hint').textContent=f.nickname.value.trim()||`Proposition : ${suggestedNickname(f.first_name.value,f.last_name.value)||'prénom + initiale'} (numérotée si nécessaire).`;};
  form.onsubmit=async e=>{
   e.preventDefault();if(saving||!isCurrent())return;
   const data=Object.fromEntries([...new FormData(form)].map(([k,v])=>[k,v.trim()]));
   if(!data.first_name||!data.last_name||!data.email)return;
   saving=true;form.querySelectorAll('button,input').forEach(el=>el.disabled=true);dialog.querySelector('#club-save-status').textContent='Enregistrement…';
   try{
    let saved;
    await registerWithNickname(async values=>{saved=await backend.saveRegistration({p_event:eventId,p_id:id,p_version:version,p_first_name:values.first_name,p_last_name:values.last_name,p_nickname:values.nickname,p_email:values.email});return saved.id;},data);
    if(isCurrent()){update(saved);dialog.close();status(`${saved.nickname} : ${row?'fiche modifiée':'inscription ajoutée'}.`);}
   }catch(error){if(isCurrent())dialog.querySelector('#club-save-status').textContent=error.message;}
   finally{saving=false;if(isCurrent())form.querySelectorAll('button,input').forEach(el=>el.disabled=false);}
  };
  dialog.showModal();
 }
 $('#club-add').onclick=()=>edit();
 $('#club-search').oninput=draw;$('#club-presence-filter').onchange=draw;$('#club-activity-filter').onchange=draw;
 $('#club-people').onclick=e=>{const editButton=e.target.closest('[data-edit]'),presence=e.target.closest('[data-presence]');if(editButton)edit(rows.find(r=>r.id===editButton.dataset.edit));if(presence){const row=rows.find(r=>r.id===presence.dataset.presence);participation(row,!row.present,'welcome');}};
 $('#club-people').onchange=e=>{if(e.target.matches('[data-activity]')){const row=rows.find(r=>r.id===e.target.dataset.activity);participation(row,true,e.target.value);}};
 draw();
}
