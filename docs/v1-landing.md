# V1 — Accueil public

La page d’accueil présente les usages disponibles : clubs et équipes, effectif, préparation, direct, statistiques et carnet Terrain. Les appels à l’action ouvrent les pages d’inscription et de connexion existantes.

## Contenu et direction visuelle

Palette navy/emerald, sections éditoriales claires, typographie lisible et aperçu interactif du parcours préparer / jouer / retrouver le bilan. Les illustrations et les noms du FC Horizon / AS Rivage sont explicitement fictifs. Aucun témoignage, volume d’utilisateurs ou chiffre commercial n’est présenté.

La page n’affiche pas d’offres payantes ni de promesses sur des fonctions futures. Le hors-ligne est expliqué avec ses conditions : préparation en ligne, même appareil et navigateur, usage continu du carnet Terrain, synchronisation avec le carnet ouvert. Le direct classique n’est pas présenté comme basculant automatiquement hors ligne.

## Structure

`app/page.tsx` reste un composant serveur avec ses métadonnées. Seul l’aperçu interactif est un composant client. La page possède son en-tête, son unique élément main et son pied de page ; LayoutWrapper lui laisse cette responsabilité. Les autres routes conservent leur disposition.

Navigation par ancres, menu mobile natif, FAQ native et lien d’évitement restent utilisables sans logique JavaScript dédiée. Les animations ne conditionnent pas l’affichage du contenu.

## Vérification

- Build de production et contrôle TypeScript.
- Scénario `qa/landing.mjs` exécuté en début de recette complète dans un contexte anonyme indépendant : aperçus, FAQ, ancres, entrée inscription/connexion, responsive 375/768/1280 et audit axe.
- Vérification manuelle de l’aperçu, des liens et du rendu sur les trois formats lorsque l’environnement d’aperçu le permet.

## Recette utilisateur après déploiement

1. Ouvrir la page dans une fenêtre privée et examiner les trois étapes de l’aperçu.
2. Vérifier les ancres et la FAQ, puis ouvrir le menu sur téléphone.
3. Suivre « Créer mon espace », revenir à l’accueil et ouvrir « Se connecter ».
4. Rejouer séparément la recette terrain réelle sur téléphone, puis la recette complète depuis un compte neuf avant les essais avec d’autres coachs.
