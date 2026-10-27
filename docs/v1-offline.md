# V1 — Étape 6 : carnet Terrain hors ligne

## Périmètre et parcours

Depuis la fiche `/dashboard/matchs/:id`, **Ouvrir le mode terrain** ouvre `/terrain/index.html#match=:id`. Le coach prépare le match avec du réseau et conserve cette adresse dans ses favoris. Le carnet permet de saisir les présences, la composition, le chrono, les buts/passes (minute, zone, partie du corps), les remplacements, les cartons et la clôture. Le chrono enregistre son instant de départ et reprend après fermeture.

Un seul appareil fait foi pendant le match. L’application générale, la création de club/équipe/match, les statistiques et la connexion initiale nécessitent toujours du réseau. Le mode Terrain reprend les droits existants de démarrage/clôture : coach et président ; l’assistant conserve ses droits habituels dans l’application en ligne.

## Stockage et confidentialité

- Service worker limité à `/terrain/`, avec cache explicite de l’interface et de la configuration publique de l’API. Aucun cache automatique des réponses API ni des pages de compte.
- IndexedDB `coachflow-terrain`, schéma version 1, copies séparées par identifiant de compte et de match. Feuille minimale : noms, numéros, éligibilité générique, présences et événements. Aucun libellé de blessure, coordonnée, mot de passe ou jeton ajouté à cette base.
- Chaque modification est confirmée après la transaction IndexedDB. Une erreur de stockage ne doit pas afficher une sauvegarde réussie.
- Verrous navigateur pour sérialiser les écritures entre onglets et la déconnexion. Confirmation avant suppression des actions non synchronisées à la déconnexion ; annuler conserve le compte et les actions. Les données restent accessibles uniquement à ce compte via l’interface.
- HTTPS, CSP restrictive sur le carnet, aucun script tiers ni analytique dans cet écran. Les données locales ne sont pas chiffrées par CoachFlow : le verrouillage de l’appareil et la sécurité du navigateur restent nécessaires.
- Demande de stockage persistant, sans promettre qu’elle sera accordée. Effacement du navigateur, navigation privée, manque d’espace ou perte de l’appareil peuvent supprimer les actions non synchronisées. Un export JSON privé est proposé en secours, sans jeton d’authentification.

## Synchronisation

`GET /api/matches/:id/offline` prépare un état minimal et une empreinte de version. `POST /api/matches/:id/offline/sync` rejoue un lot ordonné et validé, dans une transaction unique, avec les règles métier existantes.

Un UUID de lot et son contenu exact sont sauvegardés localement avant envoi. La table `OfflineReceipt` conserve l’identité de l’auteur, l’empreinte de la requête et les identifiants attribués aux actions, sans copie des noms des joueurs. Une réponse perdue est rejouée sans doublon. Les actions ajoutées entre deux tentatives restent en attente et leurs références locales sont remplacées par les identifiants serveur après confirmation.

Les écritures habituelles des matchs et les lots hors ligne utilisent le même verrou PostgreSQL de ligne. Une empreinte différente renvoie HTTP 409 et conserve le carnet local, sans écraser les changements distants. Une action invalide annule tout le lot ; les droits sont revérifiés à chaque envoi. Une session expirée conserve les données et demande une reconnexion au même compte.

La synchronisation automatique se déclenche dans le carnet ouvert, après saisie ou retour du réseau. Un bouton permet de réessayer. Ce n’est pas une synchronisation en arrière-plan lorsque le navigateur est fermé. Après confirmation, les statistiques normales utilisent les événements enregistrés sur le serveur.

## Déploiement

Une migration additive crée `OfflineReceipt` et sa clé étrangère vers `Match`. Exécuter `npx prisma migrate deploy` dans `back` avant de servir le nouveau backend, puis déployer le frontend. Aucun effacement de données existantes. Le backend et le frontend doivent utiliser le même environnement ; `NEXT_PUBLIC_API_URL` configure aussi la CSP et l’URL publique du carnet.

Le cache de l’interface porte une version explicite dans `front/public/terrain/sw.js`. Incrémenter cette version lors des changements du carnet. Ne pas activer de force une nouvelle version au milieu d’un match : le worker attend la fermeture des anciennes pages.

## Recette sur un vrai appareil

1. Avec du réseau, créer un match de test, ouvrir sa fiche puis le mode Terrain. Cliquer **Préparer ce match hors ligne** et attendre **Prêt hors ligne**.
2. Mettre le téléphone en mode avion. Renseigner les présences et au moins deux titulaires, démarrer, saisir un but et une passe.
3. Fermer l’onglet, rouvrir son adresse depuis les favoris, toujours en mode avion. Vérifier score, présences, événements et chrono ; saisir un remplacement et terminer.
4. Rétablir le réseau, garder le carnet ouvert et attendre **tout est enregistré**. Au besoin cliquer **Synchroniser**.
5. Revenir au tableau joueurs et au dashboard : vérifier les contributions et l’absence de doublons. Recharger le carnet puis synchroniser à nouveau ne doit rien dupliquer.

La validation automatisée utilise Chromium et des tailles mobile/tablette/ordinateur. Les tests physiques Safari/iOS et Android restent à faire avant une utilisation réelle sur le terrain. Les corrections de cartons et remplacements se font en ligne après synchronisation ; le carnet permet de retirer les buts/passes et événements adverses pris en charge.

## Vérifications réalisées

- 285 tests backend et 11 tests frontend passent ; builds frontend et backend réussis.
- Recette réelle Chromium + Next.js + NestJS/Prisma + PostgreSQL embarqué isolé : présences, composition, but/passe avec zone/corps, fermeture/réouverture sans réseau, remplacement, but adverse, clôture et statistiques persistées.
- Réponse perdue après validation serveur, action supplémentaire saisie avant réessai, puis confirmation sans doublon ; refus d’accès 403, conflit 409 et annulation transactionnelle d’un lot invalide.
- Session expirée sans effacement des actions ; séparation des comptes ; déconnexion annulée conservant les actions, puis déconnexion confirmée effaçant la copie locale.
- Mise en page inspectée à 375, 768 et 1280 px ; aucune violation axe WCAG A/AA détectée sur le carnet dans les états testés. Cela ne remplace pas tous les contrôles d’accessibilité ni les essais physiques.
- Les parcours existants restent intégrés à `npm test --prefix qa`. Les erreurs réseau injectées et la télémétrie Vercel inaccessible dans l’environnement apparaissent dans les rapports bruts, sans être assimilées à des erreurs de l’application.



## Préparation rapide sur mobile et tablette

- Un appui sur la ligne coche le joueur présent. Les onze premiers sélectionnés sont titulaires, les suivants remplaçants. Les joueurs non cochés sont absents ; les indisponibles restent non sélectionnables.
- Nom, prénom, numéro et poste sont visibles. Le poste est un champ facultatif de la copie minimale ; les anciennes copies restent compatibles, sans détail médical ajouté.
- Le bouton de statut ouvre les choix titulaire, remplaçant, incertain ou absent. Promouvoir un remplaçant lorsque onze titulaires sont déjà sélectionnés place le dernier titulaire de la liste sur le banc. Décocher un titulaire libère une place pour la prochaine sélection, sans modifier automatiquement les autres joueurs.
- Le démarrage depuis le carnet exige au moins onze présents et la résolution des présences incertaines. Les alertes de postes concernent les titulaires : aucun ou plusieurs gardiens, aucune défense, aucun milieu ou aucune attaque. Elles ne bloquent jamais à elles seules le démarrage. Un poste manquant est signalé comme une vérification incomplète.
- Cette contrainte de onze présents s’applique à la nouvelle préparation Terrain. Les anciens événements déjà enregistrés restent rejouables ; la règle historique du parcours en ligne reste inchangée.
- Le cache Terrain passe en v2. Après le déploiement, ouvrir le carnet avec Internet puis fermer les anciens onglets Terrain et le rouvrir pour activer la nouvelle version. Ne pas effacer le stockage si des actions restent à synchroniser.

Recette : sélectionner dix joueurs (démarrage désactivé), puis le onzième (activé), puis le douzième (remplaçant) ; modifier un statut, recharger hors ligne, retrouver la sélection et les compteurs ; démarrer malgré les alertes de postes et terminer le parcours match/synchronisation existant. Les tests couvrent également les anciennes copies sans poste et la conservation des matchs v1 en attente.
