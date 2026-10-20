# Recette CoachFlow

Cette suite lance le vrai frontend Next.js, l’API NestJS et une base PostgreSQL embarquée PGlite, isolée et recréée à chaque exécution. Aucun accès à la base de production, aucun secret ni compte de production n’est nécessaire.

## Préparer l’environnement

Linux x64, Node.js 24, npm et `tar`. Sous Windows, utiliser WSL2/Ubuntu ; la CI utilise Ubuntu. Les ports 4300, 4301 et 54329 doivent être libres.

Depuis la racine du dépôt :

```bash
npm ci --prefix back
npm run build --prefix back
npm ci --prefix front
npm ci --prefix qa
```

Le navigateur Chromium est fourni par `@sparticuz/chromium`. Aucun téléchargement Playwright supplémentaire n’est requis.

## Lancer tous les parcours

```bash
npm test --prefix qa
```

La suite échoue avec un code de sortie non nul au premier problème. Les résultats, captures de diagnostic et traces sont dans `qa/results/` (ignoré par Git). `COACHFLOW_QA_OUTPUT` permet de changer ce dossier. `COACHFLOW_REPO` permet de préciser un autre checkout du projet.

Les tests unitaires restent séparés :

```bash
npm test --prefix back -- --runInBand
npm run test:players --prefix front
npm run test:match-flow --prefix front
```

Le workflow `.github/workflows/quality.yml` exécute ces contrôles sur les PR et sur `main`. Les rapports textuels et JSON sont conservés sept jours comme artefacts GitHub. L’interface peut aussi être examinée manuellement : les captures ne prouvent pas seules la qualité de l’UX.

## Un compte rempli pour une recette manuelle

```bash
npm run demo --prefix qa
```

Puis ouvrir `http://127.0.0.1:4300/login` :

- E-mail : `coach.qa@example.com`
- Mot de passe de test uniquement : `CoachFlowQA2026!`
- Équipe à sélectionner : **Seniors Démo**

Le serveur reste ouvert jusqu’à `Ctrl+C`. La base est en mémoire : fermer le processus efface les données. Relancer la commande recrée le même type de scénarios avec de nouvelles dates et identifiants. Ce compte est local, pas un compte de démonstration sur le site public.

La démo contient 22 joueurs (20 dans l’effectif et 2 archivés), dont 3 blessés et 1 suspendu, ainsi que 13 matchs : 7 résultats récents/anciens, un résultat d’une saison précédente, un match prévu à une date future mais déjà terminé, inclus dans le bilan, un match à date passée non clôturé, deux prochains matchs et un direct. Le reste du jeu de données comprend une équipe de recette et une équipe vide.

## Parcours automatisés

- **Effectif** : création, modification, champs facultatifs effacés, archivage/réintégration, filtres, tri, recherche, noms longs et navigation clavier.
- **Match** : présences, composition, refus d’un démarrage incomplet, but avec minute/zone/corps, passe, remplacement, fin et statistiques des participants. Le chronomètre est placé à 12 minutes dans son stockage local ; les événements sont réellement saisis par l’interface.
- **Dashboard** : calculs confrontés à des résultats attendus et au tableau joueurs ; périodes ; scores à l’extérieur ; conservation des joueurs archivés ; lien vers le direct, clôture et retour au bilan ; prochain match ; création après erreur réseau ; absence de doublon.
- **Résilience** : erreurs de lecture initiale et d’actualisation, réessai, réponse de période ou d’équipe tardive, équipe vide, nouvel utilisateur sans club puis sans équipe.
- **Accès** : HTTP 401 sans authentification, 403 pour un utilisateur extérieur, 400 pour une période ou un identifiant invalide. Les tests backend couvrent également les rôles autorisés.
- **UI** : 375, 768 et 1280 px ; absence de débordement ; cibles tactiles ; dialogue sur une petite hauteur ; focus et Échap ; audit axe des règles WCAG A/AA sur le dashboard et son formulaire.

La suite ne prétend pas valider tous les navigateurs, un clavier iOS natif, le déploiement réel ni le fonctionnement totalement hors ligne. Ces contrôles restent à faire sur de vrais appareils et lors de l’étape offline.

## Mode Terrain

La suite inclut `offline.mjs` : préparation, présences, but/passe détaillés, fermeture et réouverture sans réseau, remplacement, clôture, réponse de synchronisation perdue puis réessai, action ajoutée pendant la reprise, statistiques, refus 403, conflit 409, rollback d’un lot invalide, isolation des comptes, déconnexion et accessibilité aux trois largeurs. Voir [le guide hors ligne](../docs/v1-offline.md) pour la recette sur téléphone et la migration requise.
