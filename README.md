# 📚 Mes Devoirs

Un petit logiciel Windows pour noter ses devoirs.

## Fonctionnalités

- Ajouter, modifier, supprimer des devoirs (titre, matière, date, priorité, notes)
- Cocher un devoir quand il est fait
- Filtres : À faire, En retard, Cette semaine, Terminés, Tous
- Matières prédéfinies avec une couleur chacune (Maths, Français, Histoire-Géo…), à choisir en un clic quand on ajoute un devoir
- Ajouter / retirer des matières et changer leur couleur (Paramètres → Matières, ou directement dans « Nouveau devoir »)
- Filtre par matière et recherche
- Vue Liste ou Calendrier, au choix par **mois** ou par **semaine** (lundi à vendredi) (devoirs colorés par matière, clic sur un jour pour ajouter un devoir)
- Tri par date, priorité, matière ou ajout récent
- Barres de défilement masquées (on défile toujours à la molette), même en fenêtre réduite ; la fenêtre peut être très étroite (le menu passe alors au-dessus de la liste)
- Paramètres : thème clair / sombre / automatique, couleur principale, matières, page de démarrage, priorité par défaut, confirmation de suppression
- Données enregistrées en local dans `%APPDATA%\Mes Devoirs\devoirs.json`
- Mise à jour : Paramètres → Mise à jour compare ta version avec la dernière « Release » de ton dépôt GitHub et propose de la télécharger
- Raccourcis : `Ctrl+N` nouveau devoir, `Ctrl+F` recherche

## Versions Windows

Chaque version est un installeur `.msi` :

| Architecture | Fichier produit |
|---|---|
| x64 (64 bits) | `MesDevoirs-<version>-x64.msi` |
| x86 (32 bits) | `MesDevoirs-<version>-ia32.msi` |
| ARM64 | `MesDevoirs-<version>-arm64.msi` |

L'installeur crée un raccourci sur le Bureau et dans le menu Démarrer.

## Construire sur ton PC (alternative)

Avec [Node.js](https://nodejs.org) installé :

```
npm install
npm start          # lancer l'appli pour tester
npm run dist       # construire les 3 .msi dans le dossier dist/
```

## Mises à jour

Comme chaque run GitHub publie une release `1.0.<numéro du run>` avec le même numéro dans l'appli,
il n'y a rien à modifier à la main : après un nouveau run, **Paramètres → Mise à jour**
(dépôt déjà rempli : `rc9b8hcntp-svg/mydevoirs`) affiche la nouvelle version.
Pour changer le début du numéro (ex. passer à `1.1.x`), modifie `"version"` dans `package.json`.
