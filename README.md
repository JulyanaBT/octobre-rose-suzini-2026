# Octobre Rose · TC Suzini — version de travail

Prototype local du 17 octobre 2026. Aucun service distant d’inscription n’est connecté. Les données d’essai restent dans le navigateur ; ne pas saisir de données réelles. Aucun compte administrateur ni mot de passe historique n’est repris.

## Essayer

Depuis ce dossier : `python3 -m http.server 8765 --bind 127.0.0.1`, puis ouvrir http://127.0.0.1:8765.

1. Organisation → Ajouter 12 participants fictifs.
2. Beach tennis → Générer le premier tour.
3. Saisir un score différent pour les deux équipes, puis Valider.
4. Organisation → Affecter au tennis un joueur dont le match est terminé. Un joueur encore programmé reste verrouillé.
5. Tennis → Vérifier la liste d’affectations.
6. S’inscrire → Tester l’inscription générale avec une identité fictive.

Les essais peuvent être exportés en JSON ou effacés depuis Organisation. Le stockage local n’offre pas les garanties nécessaires à un usage simultané par plusieurs organisateurs.

## Livré

- Accueil responsive, illustration vectorielle, logos existants, programme provisoire.
- Inscription générale simulée, présence, recherche et filtre des participants.
- Affectation exclusive accueil/pause, BT ou tennis.
- Moteur de rotations repris du dépôt portesouvertes2026 : 2 terrains, banc, minimisation des répétitions.
- Saisie/correction des scores, classement avec 10 meilleurs résultats et bonus existants.
- Espace TMC préparé, sans tableau ni règles inventées.
- 7 tests du moteur, dont une comparaison avec le calcul de classement d’origine.

## Choix provisoires explicites

Génération d’un seul tour à la fois, en attendant que tous les matchs précédents soient terminés. Ce comportement diffère de la programmation d’origine (deux tours initiaux, puis génération autorisée après un nouveau résultat), afin de tester la circulation entre activités. Le classement n’est pas changé. Les joueurs au tennis sont exclus des nouvelles rotations et du banc BT ; les bonus des tours déjà programmés restent acquis. Ces choix doivent être validés en réunion.

Les champs du formulaire sont des propositions. Les âges admis, capacités, créneaux, conditions de contact et règles du TMC restent à définir.

## Suite technique : Supabase + GitHub Pages

Aucune migration, création de compte, modification de l’ancien site ou publication n’a été effectuée.

Prévoir les entités suivantes : événements, activités, inscriptions à la journée, participations aux activités, disponibilités, tours, matchs et joueurs des matchs. Conserver les contacts dans des données privées ; les pages publiques ne nécessitent que les surnoms et les résultats autorisés.

Avant ouverture réelle :

- Créer/configurer le projet Supabase sous le compte du propriétaire.
- Ajouter authentification organisateur, rôles et règles d’accès côté base.
- Remplacer le stockage local par les opérations serveur, avec validation des inscriptions et protection contre les soumissions abusives.
- Rendre la réservation des joueurs et la génération d’un tour atomiques pour éviter les doubles affectations entre appareils.
- Réserver les commandes de gestion aux organisateurs ; publier uniquement les lectures autorisées.
- Prévoir gestion des erreurs réseau, synchronisation, export et sauvegarde.
- Implémenter le TMC après validation de son format.
- Tester les accès, la concurrence et une simulation complète avant publication GitHub Pages dans un nouveau dépôt.

## Validation réalisée

Tests : `node --test tests/engine.test.js` (7 réussites).
Syntaxe : `node --check app.js`.
Navigateur : accueil et organisation affichés, ajout de 12 participants, génération d’un tour, saisie d’un score, mise à jour du classement, transfert après match, verrouillage pendant match et inscription fictive vérifiés. Certaines actions de clic de l’outil d’aperçu ont échoué ; les parcours ont été vérifiés au clavier.

## Provenance

Moteur de rotation et règles de classement adaptés de https://github.com/JulyanaBT/portesouvertes2026. Logos issus du même dépôt. Le fichier tests/original-ranking.txt est la fonction de référence d’origine, sans configuration Firebase ni mot de passe.

## Priorité mobile

La version mobile constitue le parcours principal : navigation fixe à cinq entrées, prise en compte de la zone de sécurité iPhone, commandes tactiles d’au moins 44 px, champs de 16 px et participants présentés en fiches sur les petits écrans. Le tableau de classement conserve un défilement horizontal dans son conteneur.

Le workflow GitHub Actions lance les tests métier et le contrôle syntaxique à chaque push ou pull request. Il ne publie pas le site automatiquement.
