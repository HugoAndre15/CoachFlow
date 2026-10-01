# V1 — Étape 4 : tableau des joueurs

La page `/dashboard/joueurs` regroupe l’effectif, les présences et les contributions des joueurs. Elle conserve les couleurs, la typographie et la navigation CoachFlow.

## Parcours et présentation

- Tableau sur ordinateur et tablette, identité du joueur fixe en cas de défilement horizontal. Liste tactile sur téléphone, sans imposer le tableau large.
- Recherche par prénom, nom complet ou numéro, insensible aux accents. Filtres par poste et disponibilité ; tri par nom, numéro, présence, matchs joués, titularisations, buts et passes décisives.
- Périodes : tous les matchs, saison depuis le 1er juillet, 30 derniers jours (bornes calendaires UTC).
- Fiche latérale, plein écran sur téléphone : identité, pied fort, disponibilité, présences détaillées, participation, buts, passes, récupération/perte de balle, cartons et détails facultatifs des buts.
- Un formulaire pour créer et modifier. Effacer un numéro, poste ou pied fort efface réellement cette valeur. Archivage réversible avec conservation de l’historique.
- Boîtes de dialogue natives : navigation clavier, fermeture par Échap, blocage pendant l’enregistrement, retour au déclencheur. Erreurs de sauvegarde affichées dans le formulaire sans perdre la saisie.
- Chargement, erreur, effectif vide et filtre sans résultat ont des états distincts. Les réponses tardives de l’ancienne équipe/période sont ignorées.

## Règles des statistiques

Le nouveau `GET /api/players/overview?teamId=<uuid>&period=ALL|SEASON|LAST_30_DAYS` fournit les joueurs et leurs statistiques en une requête frontend. L’accès est réservé au coach, à l’assistant de l’équipe et au président du club. Les joueurs archivés restent accessibles, sans la précédente limite frontend de 100 joueurs.

Seuls les matchs **terminés**, datés au plus tard à l’instant de la requête et dans la période sélectionnée sont agrégés.

- **Présences** : nombre de lignes `PRESENT` / nombre de lignes `PRESENT` ou `ABSENT` dans les feuilles. Les états `UNKNOWN` et `UNCERTAIN` sont détaillés séparément, hors dénominateur. Un joueur absent de la feuille n’est pas considéré absent du match. Sans présence renseignée, le taux est `null`, affiché « — ».
- **Matchs joués** : titulaire présent au départ ou remplaçant entré par un changement valide. Les changements sont rejoués dans l’ordre enregistré ; les anciennes incohérences sont ignorées. Un joueur qui sort puis revient ne compte qu’une fois par match.
- **Titularisations** : composition initiale conservée. **Entrées en jeu** : matchs joués par un remplaçant initial. **Banc sans entrer** : présent sans avoir joué.
- **Actions** : événements saisis pour les joueurs présents, y compris toutes les zones existantes. Un carton reçu sur le banc ne crée pas artificiellement une participation.
- L’archivage et la disponibilité actuelle ne réécrivent pas les résultats passés. Les statistiques du tableau concernent les matchs de l’équipe sélectionnée.

Aucune migration de base de données ni nouvelle dépendance applicative.

## Vérifications réalisées

- `cd back && npm test -- --runInBand` : 270 tests passent, dont les calculs, les permissions et les bornes de période.
- `cd front && npm run test:players && npm run test:match-flow` : 11 tests passent (tri, filtres, rendu HTML et non-régression des résumés de match).
- Builds de production frontend et backend réussis.
- API Nest/Prisma sur une base isolée PGlite avec les 12 migrations : 18 contrôles des parcours match existants et 6 groupes de contrôles du tableau passent (autorisations, statistiques persistées, périodes, archivage/réintégration, champs effacés, isolation d’équipe).
- Six scénarios d’interaction React dans un DOM simulé passent : recherche/période, édition, archivage/réintégration, échec de sauvegarde puis réessai, réinitialisation/Échap, changement d’équipe avec réponse tardive.

**Limite de validation :** le navigateur local est bloqué par la politique de sockets de l’environnement. Les scénarios DOM ne vérifient ni le moteur de mise en page, ni le comportement réel iOS/Android. Aucun contrôle visuel sur appareil ou capture navigateur n’est revendiqué.

## Recette visuelle avant fusion

1. **Lire l’effectif** — à 375 px, 768 px et 1280 px : rechercher un nom accentué, trier les buts, changer de période et ouvrir une fiche. Vérifier la lisibilité, les noms longs, l’absence de débordement de page, le défilement du tableau sur tablette et de la fiche sur petit écran.
2. **Gérer un joueur** — ajouter un joueur avec seulement prénom/nom, compléter sa fiche, effacer le numéro et le pied fort, recharger. Archiver, retrouver via « Archivé », choisir « Disponible » et enregistrer. L’historique doit rester intact.
3. **Contrôler un match terminé** — un titulaire, un remplaçant entré, un remplaçant resté sur le banc, un absent et un incertain ; saisir un but avec passe décisive. Vérifier que les présences et contributions correspondent et que seul le titulaire et le remplaçant entré ont joué. Vérifier aussi Échap, Tab, le clavier mobile et un échec réseau au moment d’enregistrer.
