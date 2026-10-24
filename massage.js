const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function massageTime(slot){const start=15*60+30+25*slot;const time=n=>`${Math.floor(n/60)}h${String(n%60).padStart(2,'0')}`;return `${time(start)} – ${time(start+15)}`;}
export function massageRows(slots,club=false){return slots.map(s=>`<article class="massage-row"><strong>${massageTime(s.slot)}</strong>${club?`<span>${esc(s.nickname||'Disponible')}</span><button type="button" data-slot="${s.slot}">${s.participant_id?'Modifier':'Attribuer'}</button>`:`<span class="massage-status ${s.reserved?'reserved':'available'}">${s.reserved?'Réservé':'Disponible'}</span>`}</article>`).join('');}
export async function mountMassage(root,api,event,isCurrent,{club=false}={}){
 let slots=[],people=[],busy=false,timer,snapshot;
 const alive=()=>isCurrent()&&root.isConnected;
 root.innerHTML=`<section class="massage-panel"><article class="info-card massage-intro"><h1>Massage avec Quentin</h1><p>Une parenthèse de bien-être : profitez d’un massage avec Quentin pour vous détendre et prendre soin de vous.</p><small>15 min de massage · 10 min entre deux séances</small></article><p class="massage-help">${club?'Attribuez un créneau à une personne inscrite.':'Pour réserver un créneau, adressez-vous à l’organisation.'}</p><p role="status" class="massage-feedback">Chargement…</p><div class="massage-slots"></div></section>`;
 const feedback=text=>{if(alive())root.querySelector('.massage-feedback').textContent=text;};
 const draw=()=>{if(!alive())return;root.querySelector('.massage-slots').innerHTML=massageRows(slots,club);root.querySelectorAll('[data-slot]').forEach(b=>b.onclick=()=>edit(Number(b.dataset.slot)));};
 async function load(){const next=await (club?api.clubMassage(event):api.publicMassage(event));if(!alive())return;const nextSnapshot=JSON.stringify(next);if(nextSnapshot!==snapshot){snapshot=nextSnapshot;slots=next;draw();}feedback('');}
 async function edit(slot){
  if(busy)return;busy=true;
  try{people=await api.registrations(event);if(!alive())return;const selected=slots.find(s=>s.slot===slot);
   const dialog=document.createElement('dialog');dialog.className='massage-dialog';dialog.innerHTML=`<form><h2>${massageTime(slot)}</h2><label>Participant<select name="participant"><option value="">Créneau libre</option>${people.slice().sort((a,b)=>a.nickname.localeCompare(b.nickname,'fr')).map(p=>`<option value="${esc(p.id)}" ${selected.participant_id===p.id?'selected':''}>${esc(p.nickname)} · ${esc(p.first_name)} ${esc(p.last_name)}</option>`).join('')}</select></label><p role="status"></p><div class="info-actions"><button type="button" data-cancel>Annuler</button><button type="submit">Enregistrer</button></div></form>`;root.append(dialog);dialog.showModal();dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
   dialog.querySelector('form').onsubmit=async e=>{e.preventDefault();if(busy)return;busy=true;const buttons=dialog.querySelectorAll('button,select');buttons.forEach(b=>b.disabled=true);try{await api.assignMassage({p_event:event,p_slot:slot,p_participant:dialog.querySelector('select').value||null,p_version:selected.version});dialog.close();await load();feedback('Créneau enregistré.');}catch(e){if(dialog.isConnected)dialog.querySelector('[role=status]').textContent=e.message;await load().catch(()=>{});}finally{busy=false;buttons.forEach(b=>b.disabled=false);}};
  }catch(e){feedback(e.message);}finally{busy=false;}
 }
 async function poll(){if(!alive())return;if(!busy&&!document.hidden&&!root.querySelector('dialog'))try{await load();}catch{feedback('Actualisation indisponible. Nouvelle tentative automatique…');}if(alive())timer=setTimeout(poll,5000);}
 try{await load();}catch(e){feedback(e.message);}if(alive())timer=setTimeout(poll,5000);
}
