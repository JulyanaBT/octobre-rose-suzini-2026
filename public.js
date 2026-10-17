const icon = {home:'⌂', calendar:'▦', match:'◉', ranking:'♜', info:'ⓘ'};
const headerFlower = `<svg class="title-flower" viewBox="0 0 40 40" aria-hidden="true"><g fill="#ed408e" stroke="#bc1c61" stroke-width=".6"><ellipse cx="20" cy="12" rx="8" ry="11"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(72 20 20)"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(144 20 20)"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(216 20 20)"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(288 20 20)"/></g><circle cx="20" cy="20" r="5" fill="#ffb7d6"/><path d="m20 20 8-8" stroke="#fbd765" stroke-width="2"/><circle cx="29" cy="11" r="2" fill="#ffdf76"/></svg>`;
const headerRibbon = `<svg class="title-ribbon" viewBox="0 0 28 40" aria-hidden="true"><path d="M8 3C11-1 17-1 20 3c7 9-2 19-12 35l-7-6C12 18 22 7 16 5c-2-1-4-1-6 0Z" fill="#e72c82"/><path d="M8 3C2 9 7 18 20 38l7-6C15 17 5 7 12 5Z" fill="#f970af"/><path d="M8 3c3-3 9-3 12 0l-4 3c-2-1-4-1-6 0Z" fill="#b91e65"/></svg>`;
const decoratedTitle = `<span class="event-title" aria-label="Octobre Rose">${headerFlower}<b>Octobre</b>${headerRibbon}<b>Rose</b>${headerFlower}</span>`;
export function publicHeader(page) {
  const privatePage = ['admin','organisation','club'].includes(page);
  document.body.dataset.page = page;
  document.body.dataset.space = privatePage ? (page === 'club' ? 'club' : 'admin') : 'public';
  document.querySelector('header').innerHTML = `<div class="header-top"><a class="header-logo" href="#accueil" aria-label="Accueil TC Suzini"><img src="${privatePage ? 'assets/logo-suzini.png' : 'assets/logo-beach-rose.png'}" alt="Beach Tennis Suzini"></a><a class="header-event" href="#accueil"><span>TC SUZINI · 24 OCTOBRE 2026</span><strong>${privatePage ? (page === 'club' ? 'Espace Club' : 'Administration') : decoratedTitle}</strong></a><a class="header-logo" href="#accueil" aria-label="${privatePage ? 'Accueil JulyanaBT' : 'Accueil Commission sportive TC Suzini'}"><img src="${privatePage ? 'assets/logo-julyana.png' : 'assets/logo-tennis-rose.png'}" alt="${privatePage ? 'Jul’Yana Beach Tennis' : 'Commission sportive TC Suzini'}"></a></div><div class="header-nav-band"><nav aria-label="Navigation ${privatePage ? 'des espaces' : 'publique'}">${(privatePage ? [['accueil','⌂','Public'],['club','▦','Club'],['admin','⚙','Admin']] : [['accueil',icon.home,'Accueil'],['programme',icon.calendar,'Activités'],['matchs',icon.match,'Matchs'],['classement',icon.ranking,'Classement'],['infos',icon.info,'Infos']]).map(([route,symbol,label])=>`<a href="#${route}" ${page===route?'aria-current="page" class="active"':''}><span aria-hidden="true">${symbol}</span>${label}</a>`).join('')}</nav></div>`;
}
const homeDetails = {
 raquettes: ['Raquettes en partage', 'Du court au sable : découverte, challenges et tournois. Un Americano beach tennis sur deux terrains et un TMC tennis sont en préparation. Les formats et horaires seront précisés.'],
 surprise: ['Surprises au rendez-vous', 'Des surprises pour partager un moment ensemble. Le programme se prépare avec le TC Suzini : les détails seront dévoilés prochainement.'],
 information: ["Stand d’information", 'Un temps de sensibilisation et de prévention autour d’Octobre Rose. Les intervenants et les horaires restent à confirmer.'],
 buffet: ['Buffet dînatoire convivial', 'Pour prolonger cette belle journée ensemble. L’organisation du buffet, ses modalités et les éventuelles réservations seront précisées ultérieurement.']
};
const homeIcons = {
 raquettes: '<circle cx="9" cy="9" r="5"/><path d="m12.5 12.5 7 7M5 9h8M9 5v8"/><circle cx="18" cy="7" r="2"/>',
 surprise: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M3 6h18v4H3zM12 6v15M12 6C4 6 5 0 9 2l3 4Zm0 0c8 0 7-6 3-4l-3 4Z"/>',
 information: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7v1"/>',
 buffet: '<path d="M5 3v7m-3-7v5a3 3 0 0 0 6 0V3M5 11v10M17 3c-4 3-4 9 0 9h2M19 3v18"/>'
};
export function publicHome() { return `<section class="home-intro" aria-labelledby="home-title"><div class="home-intro-copy"><span class="home-kicker">SPORT · PARTAGE · SOLIDARITÉ</span><h1 id="home-title">Ensemble,<br><span>jouons plus fort !</span></h1><p>Les femmes au cœur.<br><strong>Toutes et tous sur le terrain.</strong></p></div><a class="button home-register" href="#inscription">S’inscrire à la journée <span aria-hidden="true">↗</span></a></section><section class="home-four" aria-label="Les quatre rendez-vous de la journée">${[
 ['raquettes','Raquettes en partage','Tennis & beach tennis'],['surprise','Surprises au rendez-vous','Des moments à découvrir'],['information',"Stand d’information",'Sensibilisation & prévention'],['buffet','Buffet dînatoire convivial','Pour prolonger la journée']
].map(([id,title,sub])=>`<button class="home-item" type="button" data-home-detail="${id}" aria-haspopup="dialog"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${homeIcons[id]}</svg><strong>${title}</strong><span>${sub}</span></button>`).join('')}</section><aside class="home-sponsors" aria-label="Sponsors et partenaires"><span>AVEC NOS PARTENAIRES</span><p>Les partenaires de la journée seront présentés ici.</p></aside><dialog class="home-dialog" aria-labelledby="home-dialog-title"><form method="dialog"><button class="dialog-close" aria-label="Fermer">×</button></form><h2 id="home-dialog-title"></h2><p class="home-dialog-text"></p><form method="dialog"><button class="button">Fermer</button></form></dialog>`; }
document.addEventListener('click', event => {
 const trigger = event.target.closest('[data-home-detail]');
 if (!trigger) return;
 const content = homeDetails[trigger.dataset.homeDetail];
 const dialog = document.querySelector('.home-dialog');
 if (!content || !dialog) return;
 dialog.querySelector('h2').textContent = content[0];
 dialog.querySelector('.home-dialog-text').textContent = content[1];
 dialog.showModal();
});
export function publicPage(page) {
 const heading=(label,title,text)=>`<div class="page-head"><div class="eyebrow">${label}</div><h1>${title}</h1><p>${text}</p></div>`;
 if(page==='accueil')return publicHome();
 if(page==='infos')return heading('LE RENDEZ-VOUS','On se retrouve au club.','Samedi 24 octobre 2026 · TC Suzini')+`<section class="card"><h2>Une journée ouverte à toutes et tous</h2><p>Les femmes sont au cœur de cet événement Octobre Rose. Femmes et hommes sont les bienvenus pour partager cette journée.</p><h3>Les horaires se précisent</h3><p>Le créneau annoncé sur le flyer est 15 h–20 h. Les horaires définitifs et l’organisation des activités seront confirmés ici.</p><h3>Une inscription générale</h3><p>Inscrivez-vous une seule fois à la journée. L’équipe coordonnera ensuite les participations au tennis et au beach tennis.</p><a class="button" href="#inscription">Voir les inscriptions</a></section>`;
 if(['matchs','classement'].includes(page))return heading('SUIVRE LA JOURNÉE',page==='matchs'?'Les matchs.':'Le classement.','Tennis et beach tennis au TC Suzini')+`<section class="card empty"><span class="empty-symbol" aria-hidden="true">${page==='matchs'?'◉':'♜'}</span><h2>${page==='matchs'?'La programmation se prépare.':'Les premiers résultats arrivent bientôt.'}</h2><p>${page==='matchs'?'Les rencontres seront affichées ici une fois les formats et les créneaux confirmés.':'Les classements seront disponibles après le début des rencontres.'}</p><a class="button secondary" href="#programme">Découvrir les activités</a></section>`;
 return null;
}
