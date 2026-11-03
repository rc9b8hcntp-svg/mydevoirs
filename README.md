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
- Paramètres : thème clair / sombre / automatique, couleur principale, matières, page de démarrage, priorité par défaut, confirmation de suppression
- Données enregistrées en local dans `%APPDATA%\Mes Devoirs\devoirs.json`
- Mise à jour : Paramètres → Mise à jour compare ta version avec la dernière « Release » de ton dépôt GitHub et propose de la télécharger
- Raccourcis : `Ctrl+N` nouveau devoir, `Ctrl+F` recherche

## Versions Windows

| Architecture | Fichiers produits |
|---|---|
| x64 (64 bits) | `MesDevoirs-Installeur-1.0.0-x64.exe` et `MesDevoirs-Portable-1.0.0-x64.exe` |
| x86 (32 bits) | `MesDevoirs-Installeur-1.0.0-ia32.exe` et `MesDevoirs-Portable-1.0.0-ia32.exe` |
| ARM64 | `MesDevoirs-Installeur-1.0.0-arm64.exe` et `MesDevoirs-Portable-1.0.0-arm64.exe` |

L'installeur crée un raccourci sur le Bureau et dans le menu Démarrer.
La version « Portable » se lance directement, sans installation.

## Construire les .exe avec GitHub

1. Crée un dépôt GitHub (ex. `mes-devoirs`) et dépose-y **tout le contenu** de ce dossier
   (y compris le dossier caché `.github`).
2. Va dans l'onglet **Actions** → « Construire Mes Devoirs (Windows) » → **Run workflow**.
3. Après quelques minutes, télécharge les fichiers dans la section **Artifacts** :
   `MesDevoirs-x64`, `MesDevoirs-x86-32bits`, `MesDevoirs-ARM64`.

## Construire sur ton PC (alternative)

Avec [Node.js](https://nodejs.org) installé :

```
npm install
npm start          # lancer l'appli pour tester
npm run dist       # construire les 3 versions dans le dossier dist/
```

## Publier une mise à jour

1. Change `"version"` dans `package.json` (ex. `1.0.1`).
2. Pousse le code puis crée un tag : `git tag v1.0.1 && git push origin v1.0.1`.
3. GitHub construit les .exe et les met dans une « Release ».
4. Dans l'appli, **Paramètres → Mise à jour** (dépôt déjà rempli : `rc9b8hcntp-svg/mydevoirs`) affiche la nouvelle version.
