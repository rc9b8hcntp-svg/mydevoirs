# 📚 Mes Devoirs

Un petit logiciel Windows pour noter ses devoirs.

## Fonctionnalités

- Ajouter, modifier, supprimer des devoirs (titre, matière, date, priorité, notes)
- Cocher un devoir quand il est fait
- Filtres : À faire, En retard, Cette semaine, Terminés, Tous
- Filtre par matière (couleurs automatiques) et recherche
- Tri par date, priorité, matière ou ajout récent
- Thème clair / sombre
- Données enregistrées en local dans `%APPDATA%\Mes Devoirs\devoirs.json`
- Raccourcis : `Ctrl+N` nouveau devoir, `Ctrl+F` recherche

## Versions Windows

| Architecture | Fichiers produits |
|---|---|
| x64 (64 bits) | `MesDevoirs-Installeur-1.0.0-x64.msi` et `MesDevoirs-Portable-1.0.0-x64.exe` |
| x86 (32 bits) | `MesDevoirs-Installeur-1.0.0-ia32.msi` et `MesDevoirs-Portable-1.0.0-ia32.exe` |
| ARM64 | `MesDevoirs-Installeur-1.0.0-arm64.msi` et `MesDevoirs-Portable-1.0.0-arm64.exe` |

L'installeur MSI crée un raccourci sur le Bureau et dans le menu Démarrer.
La version « Portable » se lance directement, sans installation.

## Construire les .msi avec GitHub

1. Crée un dépôt GitHub (ex. `mes-devoirs`) et dépose-y **tout le contenu** de ce dossier
   (y compris le dossier caché `.github`).
2. Va dans l'onglet **Actions** → « Construire Mes Devoirs (Windows) » → **Run workflow**.
3. Après quelques minutes, les fichiers sont dans la section **Artifacts** (`MesDevoirs-x64`,
   `MesDevoirs-x86-32bits`, `MesDevoirs-ARM64`) **et** publiés dans l'onglet **Releases** du dépôt
   (tag `v` + version de `package.json`, ex. `v1.0.0`). Pour une nouvelle version : change `version`
   dans `package.json`, puis pousse sur `main` (ou crée un tag `vX.Y.Z`).

## Construire sur ton PC (alternative)

Avec [Node.js](https://nodejs.org) installé :

```
npm install
npm start          # lancer l'appli pour tester
npm run dist       # construire les 3 versions dans le dossier dist/
```
