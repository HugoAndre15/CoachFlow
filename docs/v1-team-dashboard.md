# V1 — Étape 5 : vue d’équipe

La page `/dashboard` rassemble les actions du coach et le bilan de son équipe, dans la direction visuelle CoachFlow. Les étapes 6 (hors ligne) et 7 restent hors de cette PR.

## Parcours

- Reprendre le match en direct en priorité, ou préparer le prochain rendez-vous avec ses présences.
- Consulter les disponibilités actuelles et ouvrir l’effectif.
- Repérer les matchs à date passée qui restent à vérifier.
- Lire le bilan par saison, sur les 30 derniers jours ou sur tout l’historique : résultats, buts, passes, présences et contributeurs.
- Créer un match depuis le dashboard avec le formulaire partagé de la page Matchs. Une erreur conserve la saisie ; le dialogue reste utilisable sur une faible hauteur d’écran et au clavier.
- Distinguer chargement, erreur, absence de club, absence d’équipe et bilan vide. Une actualisation échouée conserve les dernières données avec un avertissement. Les réponses d’une ancienne équipe ou période sont ignorées.

## Règles des données

`GET /api/teams/:id/dashboard?period=ALL|SEASON|LAST_30_DAYS` est réservé au coach, à l’assistant de l’équipe et au président du club. La saison commence le 1er juillet, comme dans le tableau des joueurs.

Le bilan ne retient que les matchs terminés dans la période. Un match joué en avance compte dès sa clôture, même si sa date prévue est future. Les filtres utilisent toujours la date prévue comme borne de début de période. Le score de notre équipe reste à gauche, même à l’extérieur. Les cinq derniers résultats sont affichés, mais les totaux couvrent toute la période.

Le taux de présence est pondéré : total des présences / total des présences et absences renseignées. Les incertains et non renseignés sont exclus du dénominateur ; sans données, le taux reste indéfini. Les joueurs archivés conservent leurs contributions historiques mais ne comptent plus dans l’effectif actuel. Pour le prochain match, les joueurs actuels absents de la feuille sont à renseigner.

Aucune migration ni nouvelle dépendance applicative. Les dépendances supplémentaires sont isolées dans le kit de recette `qa/`.

## Validation locale du 20 octobre 2026

- Backend : 285 tests passent dans 17 suites, dont 15 nouveaux tests de calculs, périodes et permissions du dashboard.
- Frontend : 11 tests de non-régression passent ; build de production réussi.
- Recette complète : vrai frontend Next.js, API NestJS/Prisma, 12 migrations dans une base PGlite isolée et Chromium 153. Tous les scripts passent, sans exception JavaScript non interceptée.
- Parcours : gestion des joueurs, match complet, historique et archivage, dashboard, nouvel utilisateur, erreurs et réessais, réponses réseau tardives et isolation des équipes/comptes.
- Mise en page : 375, 768 et 1280 px, noms longs, cibles tactiles, absence de débordement et formulaire sur une hauteur de 420 px. Captures examinées visuellement.
- Accessibilité automatisée : aucune violation axe des règles WCAG A/AA testées sur le dashboard renseigné aux trois largeurs et sur le formulaire de création.

Les erreurs réseau volontairement injectées, les préchargements annulés par navigation et les appels de télémétrie Vercel bloqués dans l’environnement restent visibles dans le rapport brut. Ils ne sont pas des exceptions applicatives.

Le workflow GitHub Actions ajouté lance les tests unitaires, les types, le build backend et les parcours navigateur sur les PR. Son résultat distant doit être consulté sur la PR ; la réussite locale ne vaut pas validation de la CI distante.

## Compte et données de démonstration

Voir [la procédure de recette](../qa/README.md). Après installation des dépendances et build backend :

```bash
npm run demo --prefix qa
```

Ouvrir `http://127.0.0.1:4300/login`, utiliser `coach.qa@example.com` / `CoachFlowQA2026!`, puis sélectionner **Seniors Démo** : 22 joueurs et 13 matchs fictifs avec des statuts et périodes variés. La base est recréée à chaque lancement. Ce n’est pas un compte permanent sur le site public et aucune donnée de production n’est utilisée.

Parcours de review : ouvrir la vue d’équipe, reprendre et terminer le direct, revenir au bilan, changer de période, puis préparer le prochain match et vérifier ses présences. Sur téléphone, créer aussi un nouveau match et ouvrir une fiche joueur.

Limites : Chromium avec tailles d’écran simulées, sans validation sur appareils physiques iOS/Android ni sur le déploiement réel. L’audit automatisé ne remplace pas toute la recette d’accessibilité. Le fonctionnement hors ligne reste prévu à l’étape 6.

## Correctif — matchs joués en avance et curseurs

Le dashboard et le tableau joueurs ne filtrent plus les matchs terminés avec une borne supérieure à la date courante. Les données existantes sont prises en compte au rechargement, sans migration ni nouvelle saisie. La recette couvre un match prévu demain avec but, passe et titulaires dans les trois périodes, ainsi que les curseurs calculés des boutons sur les principales pages. Les boutons actifs utilisent `pointer`, les boutons désactivés `not-allowed`.
