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
  const clubPage = page === 'club' || page.startsWith('club-');
  const privatePage = (['admin','organisation','club'].includes(page) || clubPage || page.startsWith('activation'));
  document.body.dataset.page = page;
  document.querySelector('footer').innerHTML = (!privatePage && page !== 'accueil' ? sponsorStrip() : '') + originalFooter;
  document.body.dataset.space = privatePage ? (clubPage || page.startsWith('activation') ? 'club' : 'admin') : 'public';
  document.querySelector('header').innerHTML = `<div class="header-top"><a class="header-logo" href="${clubPage ? '#club' : '#accueil'}" aria-label="Accueil TC Suzini"><img src="assets/logo-beach-rose.png" alt="Beach Tennis Suzini"></a><a class="header-event" href="${clubPage ? '#club' : '#accueil'}"><span>TC SUZINI · 24 OCTOBRE 2026</span><strong>${privatePage ? (clubPage || page.startsWith('activation') ? 'Espace Club' : 'Administration') : decoratedTitle}</strong></a><a class="header-logo club-switch" href="${privatePage ? '#accueil' : '#club'}" aria-label="${privatePage ? 'Retour à l’espace public' : 'Accès Club — identification requise'}"><img src="assets/logo-tennis-rose.png" alt="${privatePage ? 'Jul’Yana Beach Tennis' : 'Commission sportive TC Suzini'}"></a></div><div class="header-nav-band"><nav aria-label="Navigation ${privatePage ? 'des espaces' : 'publique'}">${(clubPage ? [['club-raquettes','♧','Raquettes'],['club-surprise','♧','Surprises'],['club-information','♡','Prévention'],['club-buffet','♧','Buffet'],['club-inscriptions','▦','Inscriptions'],['club-infos',icon.info,'Infos']] : privatePage ? [['accueil','⌂','Public'],['club','▦','Club'],['admin','⚙','Admin']] : [['accueil',icon.home,'Accueil'],['raquettes','♧','Raquettes'],['surprise','♧','Surprises'],['information','♡','Prévention'],['buffet','♧','Buffet'],['infos',icon.info,'Infos']]).map(([route,symbol,label])=>`<a href="#${route}" ${(page===route || page==='club' && route==='club-inscriptions' || page==='contacts' && route==='infos' || page==='information-stand' && route==='information')?'aria-current="page" class="active"':''}><span aria-hidden="true">${homeIcons[route.replace('club-','')]?`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${homeIcons[route.replace('club-','')]}</svg>`:symbol}</span>${label}</a>`).join('')}</nav></div>`;
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
 if(['information','information-stand'].includes(page))return preventionPage(page);
 if(['raquettes','bt','tennis'].includes(page))return null;
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

function preventionPage(page) {
 const stand=page==='information-stand';
 const source=(url,label)=>`<a href="${url}" target="_blank" rel="noopener noreferrer">${label} ↗</a>`;
 const topic=(title,subtitle,content)=>`<details class="prevention-topic" name="prevention-topics"><summary><span><strong>${title}</strong><small>${subtitle}</small></span><span class="prevention-toggle" aria-hidden="true">+</span></summary><div class="prevention-copy">${content}</div></details>`;
 return `<section class="prevention" aria-label="Prévention"><nav class="prevention-tabs" aria-label="Prévention"><a href="#information" ${!stand?'aria-current="page"':''}>Informations</a><a href="#information-stand" ${stand?'aria-current="page"':''}>Stand</a></nav>${stand?`<article class="info-card prevention-stand"><h1>Stand de prévention</h1><strong>À déterminer</strong><p>Les intervenants, les prestations et les horaires seront précisés ici.</p></article>`:`<p class="prevention-intro">S’informer, prendre soin de soi, soutenir.<br>Ouvrez un thème pour en savoir plus.</p><div class="prevention-topics">
 ${topic('Octobre Rose','Une histoire, un ruban, une mobilisation',`<p>Née aux États-Unis, la campagne Octobre Rose arrive en France en <strong>1994</strong>. Chaque mois d’octobre, elle mobilise autour du cancer du sein : informer, encourager le dépistage, soutenir les personnes touchées et faire avancer la recherche.</p><p>Le <strong>ruban rose</strong> symbolise cette solidarité. Au-delà d’un mois et d’une couleur, l’objectif est de faciliter la parole et l’accès à l’information, tout au long de l’année.</p><p class="prevention-source">${source('https://www.ligue-cancer.net/07-ardeche/actualites/le-symbole-dun-combat-le-ruban-rose','La Ligue · histoire du ruban rose')}</p>`)}
 ${topic('Cancer du sein','Comprendre la maladie et les chiffres',`<h2>Comprendre</h2><p>Des cellules du sein se multiplient de façon anormale et peuvent se propager. Il existe plusieurs formes de cancer du sein, qui nécessitent des traitements adaptés. La maladie touche surtout les femmes, mais aussi les hommes : environ 0,5 à 1 % des cas dans le monde.</p><p class="prevention-source">${source('https://www.who.int/fr/news-room/fact-sheets/detail/breast-cancer','OMS · comprendre la maladie')}</p><h2>Quelques repères en France</h2><p>Le dépistage organisé est généralisé depuis <strong>2004</strong>. La survie nette à cinq ans est passée de 80 % pour les femmes diagnostiquées en 1989–1993 à 88 % en 2010–2015 : un indicateur de progrès, qui ne prédit pas une situation individuelle.</p><div class="prevention-numbers"><div><strong>61 214</strong><span>nouveaux cas estimés<br>en 2023</span></div><div><strong>12 757</strong><span>décès<br>en 2022</span></div></div><p>Ces chiffres nationaux portent sur des années différentes ; ils ne représentent pas un taux de mortalité parmi les nouveaux cas.</p><p class="prevention-source">${source('https://www.cancer.fr/presse/depistage-des-cancers-du-sein-23-000-deces-evites-entre-2004-et-2018','INCa · chiffres France')} · ${source('https://www.ligue-cancer.net/octobre-rose','La Ligue · évolution de la survie')} · ${source('https://www.ameli.fr/node/907188','Assurance Maladie · historique')}</p>`)}
 ${topic('Comment se faire dépister ?','Quand, pour qui et quels examens ?',`<p><strong>De 50 à 74 ans</strong>, sans symptôme ni risque particulier : une mammographie et un examen clinique des seins <strong>tous les deux ans</strong>, dans le programme organisé. La mammographie est prise en charge à 100 %, sans avance de frais ; les examens complémentaires suivent leurs règles habituelles de remboursement.</p><p>Avant 50 ans, après 74 ans ou en cas d’antécédents personnels ou familiaux, échangez avec votre médecin ou votre sage-femme pour un suivi adapté. Une échographie ou une IRM peut être indiquée dans certaines situations, sur avis médical.</p><p>Le dépistage vise une détection précoce ; il n’empêche pas l’apparition d’un cancer. Il comporte aussi des limites : fausses alertes, cancers non repérés ou surdiagnostic. Un professionnel peut vous aider à en comprendre les bénéfices et les risques.</p><p class="prevention-source">${source('https://www.ameli.fr/assure/sante/themes/cancer-sein/depistage-organise-50-74-ans','Assurance Maladie · dépistage et suivi')}</p>`)}
 ${topic('Les signes à connaître','Un changement mérite un avis médical',`<p>Consultez si vous remarquez un changement inhabituel :</p><ul><li>une boule dans un sein ou sous le bras ;</li><li>une modification de la forme du sein ou une peau qui se rétracte, rougit ou prend un aspect « peau d’orange » ;</li><li>un mamelon qui se rétracte ou un écoulement inhabituel, notamment sanglant.</li></ul><p>Ces signes ne signifient pas nécessairement un cancer, mais demandent un avis médical <strong>sans attendre la prochaine mammographie</strong>, quel que soit votre âge. L’absence de douleur ne suffit pas à rassurer.</p><p>Connaître ses seins aide à repérer un changement. L’autosurveillance ne remplace ni l’examen par un professionnel ni le dépistage recommandé.</p><p class="prevention-source">${source('https://www.ameli.fr/assure/sante/themes/cancer-sein/symptomes-diagnostic','Assurance Maladie · signes et diagnostic')} · ${source('https://www.ligue-cancer.net/octobre-rose','La Ligue · autosurveillance')}</p>`)}
 ${topic('Agir au quotidien','Bouger, limiter les risques, sans culpabiliser',`<p>Une activité physique régulière, moins d’alcool, l’arrêt du tabac et une alimentation équilibrée contribuent à réduire le risque. Bouger peut commencer simplement : marcher, danser, jouer, à son rythme.</p><p>Le risque dépend aussi de facteurs que l’on ne choisit pas, notamment l’âge et certains antécédents. Aucun mode de vie ne garantit d’éviter un cancer : <strong>la maladie n’est pas une faute</strong>.</p><p>Pendant ou après des traitements, l’activité physique peut être adaptée avec l’équipe soignante selon votre état de santé.</p><p class="prevention-source">${source('https://www.who.int/fr/news-room/fact-sheets/detail/breast-cancer','OMS · facteurs de risque')} · ${source('https://www.ligue-cancer.net/octobre-rose','La Ligue · activité physique adaptée')}</p>`)}
 </div><p class="prevention-note">Informations générales · sources consultées le 18 octobre 2026.<br>Pour votre situation personnelle, parlez-en à un professionnel de santé.</p>`}</section>`;
}

// Keep disclosures exclusive and bring the opened topic below the sticky header.
let preventionScrollFrame;
document.addEventListener('toggle', event => {
 const opened = event.target;
 if (!opened.matches?.('.prevention-topic')) return;
 const section = opened.closest('.prevention');
 if (!opened.open) {
  if (section && !section.querySelector('.prevention-topic[open]')) {
   cancelAnimationFrame(preventionScrollFrame);
   section.style.removeProperty('padding-bottom');
   preventionScrollFrame = requestAnimationFrame(() => {
    if (!section.isConnected || section.querySelector('.prevention-topic[open]')) return;
    window.scrollTo({top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
   });
  }
  return;
 }
 opened.closest('.prevention-topics')?.querySelectorAll('.prevention-topic[open]').forEach(other => {
  if (other !== opened) other.open = false;
 });
 cancelAnimationFrame(preventionScrollFrame);
 preventionScrollFrame = requestAnimationFrame(() => {
  if (!opened.isConnected || !opened.open) return;
  section.style.removeProperty('padding-bottom');
  const headerHeight = document.querySelector('header')?.getBoundingClientRect().height || 0;
  const top = Math.max(0, window.scrollY + opened.getBoundingClientRect().top - headerHeight - 8);
  // Short topics near the bottom also need enough space to reach the header.
  const available = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
  if (top > available) section.style.paddingBottom = `${Math.ceil(top - available)}px`;
  window.scrollTo({top, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth'});
 });
}, true);
