const sponsors = [
 ['tc-suzini.jpeg','TC Suzini'],['restauration-a-confirmer.png','Restauration — à confirmer'],['ligue-de-guyane.jpeg','Ligue de Guyane'],['octobre-rose-collectivite-guyane.png','Octobre Rose — Collectivité territoriale de Guyane'],['ligue-contre-le-cancer.png','La Ligue contre le cancer'],['agence-nationale-du-sport.png','Agence nationale du sport'],['passing-shot-kafe.jpeg','Passing Shot Kafé'],['julyana-bt-octobre-rose.png','Julyana BT']
];
export function sponsorStrip() { return `<aside class="sponsor-strip" aria-label="Sponsors et partenaires"><div class="sponsor-grid">${sponsors.map(([file,name],i)=>`<button type="button" class="sponsor-logo sponsor-${i}" data-sponsor="${i}" aria-label="Agrandir le logo : ${name}"><img src="assets/sponsor-${file}" alt="${name}" loading="eager"></button>`).join('')}</div></aside>`; }
const originalFooter = '';
const icon = {home:'⌂', calendar:'▦', match:'◉', ranking:'♜', info:'ⓘ'};
const headerFlower = `<svg class="title-flower" viewBox="0 0 40 40" aria-hidden="true"><g fill="#ed408e" stroke="#bc1c61" stroke-width=".6"><ellipse cx="20" cy="12" rx="8" ry="11"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(72 20 20)"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(144 20 20)"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(216 20 20)"/><ellipse cx="20" cy="12" rx="8" ry="11" transform="rotate(288 20 20)"/></g><circle cx="20" cy="20" r="5" fill="#ffb7d6"/><path d="m20 20 8-8" stroke="#fbd765" stroke-width="2"/><circle cx="29" cy="11" r="2" fill="#ffdf76"/></svg>`;
const headerRibbon = `<svg class="title-ribbon" viewBox="0 0 28 40" aria-hidden="true"><path d="M8 3C11-1 17-1 20 3c7 9-2 19-12 35l-7-6C12 18 22 7 16 5c-2-1-4-1-6 0Z" fill="#e72c82"/><path d="M8 3C2 9 7 18 20 38l7-6C15 17 5 7 12 5Z" fill="#f970af"/><path d="M8 3c3-3 9-3 12 0l-4 3c-2-1-4-1-6 0Z" fill="#b91e65"/></svg>`;
const decoratedTitle = `<span class="event-title" aria-label="Octobre Rose">${headerFlower}<b>Octobre</b>${headerRibbon}<b>Rose</b>${headerFlower}</span>`;
export function publicHeader(page) {
  const privatePage = (['admin','organisation','club'].includes(page) || page.startsWith('activation'));
  document.body.dataset.page = page;
  document.querySelector('footer').innerHTML = (!privatePage && page !== 'accueil' ? sponsorStrip() : '') + originalFooter;
  document.body.dataset.space = privatePage ? (page === 'club' || page.startsWith('activation') ? 'club' : 'admin') : 'public';
  document.querySelector('header').innerHTML = `<div class="header-top"><a class="header-logo" href="#accueil" aria-label="Accueil TC Suzini"><img src="assets/logo-beach-rose.png" alt="Beach Tennis Suzini"></a><a class="header-event" href="#accueil"><span>TC SUZINI · 24 OCTOBRE 2026</span><strong>${privatePage ? (page === 'club' || page.startsWith('activation') ? 'Espace Club' : 'Administration') : decoratedTitle}</strong></a><a class="header-logo club-switch" href="${privatePage ? '#accueil' : '#club'}" aria-label="${privatePage ? 'Accueil JulyanaBT' : 'Accès Club — identification requise'}"><img src="assets/logo-tennis-rose.png" alt="${privatePage ? 'Jul’Yana Beach Tennis' : 'Commission sportive TC Suzini'}"></a></div><div class="header-nav-band"><nav aria-label="Navigation ${privatePage ? 'des espaces' : 'publique'}">${(privatePage ? [['accueil','⌂','Public'],['club','▦','Club'],['admin','⚙','Admin']] : [['accueil',icon.home,'Accueil'],['raquettes','♧','Raquettes'],['surprise','♧','Surprises'],['information','♡','Prévention'],['buffet','♧','Buffet'],['infos',icon.info,'Infos']]).map(([route,symbol,label])=>`<a href="#${route}" ${(page===route || page==='contacts' && route==='infos')?'aria-current="page" class="active"':''}><span aria-hidden="true">${homeIcons[route]?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${homeIcons[route]}</svg>`:symbol}</span>${label}</a>`).join('')}</nav></div>`;
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
export function publicHome() { return `<section class="home-intro" aria-labelledby="home-title"><div class="home-intro-copy"><span class="home-kicker">SPORT · PARTAGE · SOLIDARITÉ</span><span class="home-time">15h–20h</span><h1 id="home-title">Ensemble,<br><span>jouons plus fort !</span></h1><p>Les femmes au cœur.<br><strong>Toutes et tous sur le terrain.</strong></p></div><a class="button home-register" href="#inscription">S’inscrire à la journée <span aria-hidden="true">↗</span></a></section><section class="home-four" aria-label="Les quatre rendez-vous de la journée">${[
 ['raquettes','Raquettes en partage','Tennis & beach tennis'],['surprise','Surprises au rendez-vous','Des moments à découvrir'],['information',"Stand d’information",'Sensibilisation & prévention'],['buffet','Buffet dînatoire convivial','Pour prolonger la journée']
].map(([id,title,sub])=>`<a class="home-item" href="#${id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${homeIcons[id]}</svg><strong>${title}</strong><span>${sub}</span></a>`).join('')}</section>${sponsorStrip()}<dialog class="home-dialog" aria-labelledby="home-dialog-title"><form method="dialog"><button class="dialog-close" aria-label="Fermer">×</button></form><h2 id="home-dialog-title"></h2><p class="home-dialog-text"></p><form method="dialog"><button class="button">Fermer</button></form></dialog>`; }
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
 if(homeDetails[page]) return heading('LA JOURNÉE',homeDetails[page][0],page==='information'?'Sensibilisation & prévention':'')+`<section class="card"><p>${homeDetails[page][1]}</p>${page==='raquettes'?'<div class="toolbar"><a class="button" href="#bt">Beach tennis</a><a class="button" href="#tennis">Tennis</a></div>':''}</section>`;
 if(['infos','contacts'].includes(page)) return practicalInfo(page);
 if(['matchs','classement'].includes(page))return heading('SUIVRE LA JOURNÉE',page==='matchs'?'Les matchs.':'Le classement.','Tennis et beach tennis au TC Suzini')+`<section class="card empty"><span class="empty-symbol" aria-hidden="true">${page==='matchs'?'◉':'♜'}</span><h2>${page==='matchs'?'La programmation se prépare.':'Les premiers résultats arrivent bientôt.'}</h2><p>${page==='matchs'?'Les rencontres seront affichées ici une fois les formats et les créneaux confirmés.':'Les classements seront disponibles après le début des rencontres.'}</p><a class="button secondary" href="#programme">Découvrir les activités</a></section>`;
 return null;
}

document.addEventListener('click', event => {
 const trigger = event.target.closest('[data-sponsor]');
 if (!trigger) return;
 const [file,name] = sponsors[Number(trigger.dataset.sponsor)];
 let dialog = document.querySelector('.sponsor-dialog');
 if (!dialog) { dialog=document.createElement('dialog'); dialog.className='sponsor-dialog'; document.body.append(dialog); }
 dialog.innerHTML = `<h2 id="sponsor-dialog-title">${name}</h2><img src="assets/sponsor-${file}" alt="${name}"><form method="dialog"><button>Fermer</button></form>`;
 dialog.setAttribute('aria-labelledby','sponsor-dialog-title'); dialog.showModal();
});

function practicalInfo(page) {
 const contacts = page === 'contacts';
 const link=(url,label)=>`<a class="info-action" href="${url}" ${url.startsWith('https:')?'target="_blank" rel="noopener noreferrer"':''}>${label}</a>`;
 return `<div class="install-info"><button type="button" data-install>Installer sur mon téléphone</button></div><nav class="info-tabs" aria-label="Infos pratiques"><a href="#infos" ${!contacts?'aria-current="page"':''}>📍 Accès</a><a href="#contacts" ${contacts?'aria-current="page"':''}>☎ Contacts</a></nav>${contacts ? `<section class="info-cards contacts-cards"><article class="info-card whatsapp-group"><h2>Groupe WhatsApp</h2>${link('https://chat.whatsapp.com/JXBRwwXn6RdCnRAxOL3YZs','Rejoindre le groupe Octobre Rose ↗')}</article><article class="info-card"><h2>Organisation</h2>${[['Quentin','33660063692','+33 6 60 06 36 92'],['Mélanie','33613255475','+33 6 13 25 54 75'],['Maïté','33681989653','+33 6 81 98 96 53']].map(([name,number,display])=>`<div class="organizer-row"><strong>${name}</strong>${link('tel:+'+number,display)}${link('https://wa.me/'+number,'WhatsApp')}</div>`).join('')}${link('mailto:tcsuzini.beachtennis@gmail.com','tcsuzini.beachtennis@gmail.com')}</article><article class="info-card"><h2>Support technique · Jul’Yana</h2><div class="info-actions">${link('tel:+594694406099','☎ +594 694 40 60 99')}${link('https://wa.me/594694406099','WhatsApp')}</div>${link('mailto:contact@julyanabt.fr','contact@julyanabt.fr')}</article></section>` : `<section class="info-cards"><article class="info-card info-address"><h2>Tennis Club de Suzini</h2><address>217 Route de Suzini<br>97354 Rémire-Montjoly · Guyane française</address><div class="info-actions">${link('https://maps.google.com/?q=Tennis+Club+Suzini+217+Route+de+Suzini+97354+Rémire-Montjoly','Voir la carte')}${link('https://www.google.com/maps/dir/?api=1&destination=Tennis+Club+de+Suzini+Remire-Montjoly','Itinéraire ↗')}</div></article><article class="info-card"><h2>Stationnement</h2><p>Parking gratuit à proximité immédiate du club.</p></article><article class="info-card"><h2>À votre arrivée</h2><p>Retrouvez l’équipe d’accueil au club dès 15h pour être orienté vers les activités tennis et beach tennis.</p></article></section><a class="admin-ribbon" href="#admin" aria-label="Accès administration — identification requise">${headerRibbon}</a>`}`;
}
