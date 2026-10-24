export const maintenancePages=[['accueil','Accueil'],['inscription','Inscription publique'],['participants','Participants'],['raquettes','Raquettes (tennis, beach tennis et règlements)'],['information','Prévention'],['convivialite','Convivialité'],['infos','Infos (accès, contacts et flyer)']];
export function maintenanceKey(page){
 if(page==='club'||['club-inscriptions','club-joueurs'].includes(page))return 'participants';
 const p=page.replace(/^club-/,'');
 if(['bt','tennis'].includes(p))return 'raquettes';
 if(['surprise','buffet'].includes(p))return 'convivialite';
 if(['contacts','flyer'].includes(p))return 'infos';
 if(p==='information-stand')return 'information';
 return maintenancePages.some(([key])=>key===p)?p:null;
}
export function maintenanceApplies(page,settings,role){
 const key=maintenanceKey(page);
 return !!key&&role!=='admin'&&settings.pages.includes(key)&&(role!=='club'||settings.club_blocked);
}
export function maintenanceNotice(){return `<section class="maintenance-card" role="status"><div><span class="maintenance-ribbon" aria-hidden="true">🎗️</span><h1>Une petite pause<br>pour mieux vous retrouver</h1><p>Cette page est momentanément en maintenance.<br>L’équipe prépare la suite d’Octobre Rose.</p><p>Merci de votre patience 💗</p></div></section>`;}
export async function maintenanceAdmin(backend,main,isCurrent,logout){
 const settings=await backend.maintenance();if(!isCurrent())return;
 main.innerHTML=`<section class="card"><h1>Maintenance</h1><p>Cochez les pages à mettre en maintenance. Vous gardez toujours accès au site avec votre compte administrateur.</p><form id="maintenance-form"><fieldset><legend>Pages concernées</legend>${maintenancePages.map(([key,label])=>`<label class="check"><input type="checkbox" name="pages" value="${key}" ${settings.pages.includes(key)?'checked':''}>${label}</label>`).join('')}</fieldset><fieldset><legend>Gestionnaires Club</legend><label class="check"><input type="checkbox" name="club_blocked" ${settings.club_blocked?'checked':''}>Afficher aussi la maintenance aux gestionnaires sur ces pages</label><small>Décoché : les gestionnaires voient le site. La connexion et Mon compte restent accessibles.</small></fieldset><button>Enregistrer la maintenance</button><p role="status"></p></form></section><div class="organizer-logout"><button id="logout" class="secondary">Se déconnecter</button></div>`;
 main.querySelector('#logout').onclick=logout;
 const form=main.querySelector('form');form.onsubmit=async e=>{e.preventDefault();const button=form.querySelector('button'),status=form.querySelector('[role="status"]');button.disabled=true;status.textContent='Enregistrement…';try{const data=new FormData(form);await backend.saveMaintenance({p_pages:data.getAll('pages'),p_club_blocked:data.has('club_blocked')});if(isCurrent())status.textContent='Maintenance enregistrée. Les pages ouvertes se mettent à jour sous 15 secondes.';}catch(error){if(isCurrent())status.textContent=error.message;}finally{button.disabled=false;}};
}
