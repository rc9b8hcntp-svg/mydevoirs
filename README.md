# 📚 Mes Devoirs

Un petit logiciel Windows pour noter ses devoirs.

## Fonctionnalités

- Ajouter, modifier, supprimer des devoirs (titre, matière, date, priorité, notes)
- Cocher un devoir quand il est fait
- Filtres : À faire, En retard, Cette semaine, Terminés, Tous
- Filtre par matière (couleurs automatiques) et recherche
- Tri par date, priorité, matière ou ajout récent
- Thème clair / sombre
- Barres de défilement masquées (on défile toujours à la molette), même en fenêtre réduite
- Données enregistrées en local dans `%APPDATA%\Mes Devoirs\devoirs.json`
- Raccourcis : `Ctrl+N` nouveau devoir, `Ctrl+F` recherche

## Versions Windows

Chaque version est un installeur `.msi` :

| Architecture | Fichier produit |
|---|---|
| x64 (64 bits) | `MesDevoirs-<version>-x64.msi` |
| x86 (32 bits) | `MesDevoirs-<version>-ia32.msi` |
| ARM64 | `MesDevoirs-<version>-arm64.msi` |

L'installeur crée un raccourci sur le Bureau et dans le menu Démarrer.

## Construire les .msi avec GitHub

1. Crée un dépôt GitHub (ex. `mes-devoirs`) et dépose-y **tout le contenu** de ce dossier
   (y compris le dossier caché `.github`).
2. Va dans l'onglet **Actions** → « Construire Mes Devoirs (Windows) » → **Run workflow**.
3. Trois travaux se lancent (x64, x86, ARM64). Si l'un échoue, les autres continuent et
   la raison de l'échec s'affiche en rouge dans le résumé du run (le journal complet est
   aussi téléchargeable dans les Artifacts, `journal-<arch>`).
4. Chaque run publie une **release** avec un nouveau numéro : `1.0.<numéro du run>`.

## Construire sur ton PC (alternative)

Avec [Node.js](https://nodejs.org) installé :

```
npm install
npm start          # lancer l'appli pour tester
npm run dist       # construire les 3 .msi dans le dossier dist/
```
