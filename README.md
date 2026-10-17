# Octobre Rose · TC Suzini

Site mobile pour la journée du 24 octobre 2026. Accueil public, inscription commune préparée et espace organisateur connecté à Supabase.

## État

Les inscriptions restent fermées dans `event_settings`. Le compte organisateur est authentifié par Supabase ; seuls les utilisateurs inscrits dans `organizers` peuvent consulter les coordonnées. La connexion et la lecture de la liste ont été vérifiées en local. Les sessions restent en mémoire et ne survivent pas au rechargement.

Les affectations, les matchs et les classements partagés sont encore à développer. Le moteur Americano à deux terrains est conservé, avec les règles de classement historiques. Le format du TMC reste à confirmer.

## Configuration

`config.js` contient uniquement l’URL du projet et sa clé **publique** publishable. Ne jamais y mettre une clé secrète, un mot de passe ou une clé service_role. Le schéma initial est dans `supabase/migrations/001_registrations.sql` et a déjà été appliqué au projet : ne pas le rejouer sur la même base.

Le mode `live` utilise Supabase. Le mode `demo` est un prototype local pour des données fictives uniquement ; il n’est pas le mode de publication.

## Développement et tests

Lancer `python3 -m http.server 8765 --bind 127.0.0.1`, puis ouvrir http://127.0.0.1:8765.

Lancer `node --test tests/*.test.js` : 14 tests couvrent rotations, classement, gestion des erreurs et client d’authentification. Ces tests ne remplacent pas une vérification des règles d’accès sur la base déployée.

## Publication

GitHub Pages, branche `main`, dossier racine. Les chemins des ressources sont relatifs pour fonctionner sous le chemin du dépôt. La base des participants est dans Supabase et ne fait pas partie du dépôt.

Avant ouverture des inscriptions : valider les champs, capacités, modalités d’accueil, information sur l’utilisation des données et protection contre les soumissions abusives ; tester une inscription complète.

## Provenance

Moteur et logos adaptés du dépôt JulyanaBT/portesouvertes2026. La référence de classement dans `tests/original-ranking.txt` ne contient aucune configuration de l’ancien service.
